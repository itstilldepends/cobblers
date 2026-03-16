import asyncio
import logging

from fastapi import APIRouter, HTTPException

from app.adapters.registry import create_adapter, list_available_models, MODEL_REGISTRY, _PROVIDER_KEY_MAP
from app.config import settings
from app.events import event_bus
from app.models.api import (
    ContinueRequest,
    CreateDebateRequest,
    DebateListItem,
    EditBriefRequest,
    ForkRequest,
    ValidateKeysRequest,
)
from app.models.debate import DebateBrief, DebateSession, DebateStatus, Disagreement
from app.orchestrator.engine import DebateOrchestrator
from app.storage.file_store import FileStore

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api")

store = FileStore(data_dir=settings.data_dir)

# Track running debate tasks so we don't lose references
_running_tasks: dict[str, asyncio.Task] = {}


def _merge_api_keys(request_keys: dict[str, str]) -> dict[str, str]:
    """Merge request-provided API keys with env-configured ones. Request keys take priority."""
    keys: dict[str, str] = {}
    if settings.anthropic_api_key:
        keys["anthropic"] = settings.anthropic_api_key
    if settings.openai_api_key:
        keys["openai"] = settings.openai_api_key
    if settings.gemini_api_key:
        keys["gemini"] = settings.gemini_api_key
    if settings.deepseek_api_key:
        keys["deepseek"] = settings.deepseek_api_key
    if settings.openrouter_api_key:
        keys["openrouter"] = settings.openrouter_api_key
    keys.update(request_keys)
    return keys


def _create_orchestrator(
    model_ids: list[str], api_keys: dict[str, str], judge_model_id: str | None = None
) -> DebateOrchestrator:
    """Create an orchestrator with adapters for the given models."""
    adapters = []
    for model_id in model_ids:
        adapters.append(create_adapter(model_id, api_keys))

    # Judge adapter: explicit choice, or fall back to first debater
    if judge_model_id:
        brief_adapter = create_adapter(judge_model_id, api_keys)
    else:
        brief_adapter = adapters[0]

    return DebateOrchestrator(store=store, adapters=adapters, brief_adapter=brief_adapter)


@router.post("/debates")
async def create_debate(request: CreateDebateRequest) -> DebateSession:
    """Create a new debate session and start the orchestrator."""
    api_keys = _merge_api_keys(request.api_keys)

    # Validate that we can create all requested adapters
    try:
        orchestrator = _create_orchestrator(request.model_ids, api_keys, request.judge_model_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    session = DebateSession(
        question=request.question,
        model_ids=request.model_ids,
        judge_model_id=request.judge_model_id,
        max_rounds=request.max_rounds,
    )
    store.save(session)

    # Create event callback that publishes to the event bus
    async def send_event(event: dict):
        await event_bus.publish(session.id, event)

    # Launch orchestrator as background task
    task = asyncio.create_task(orchestrator.run(session, send_event=send_event))
    _running_tasks[session.id] = task

    # Clean up task reference when done
    def _cleanup(t: asyncio.Task, sid: str = session.id):
        _running_tasks.pop(sid, None)

    task.add_done_callback(_cleanup)

    return session


@router.get("/debates")
async def list_debates() -> list[DebateListItem]:
    """List all debate sessions."""
    return store.list_all()


@router.get("/debates/{debate_id}")
async def get_debate(debate_id: str) -> DebateSession:
    """Get a full debate session by ID."""
    session = store.load(debate_id)
    if not session:
        raise HTTPException(status_code=404, detail="Debate not found")
    return session


@router.delete("/debates/{debate_id}")
async def delete_debate(debate_id: str) -> dict:
    """Delete a debate session."""
    # Cancel if running
    task = _running_tasks.pop(debate_id, None)
    if task and not task.done():
        task.cancel()

    if store.delete(debate_id):
        return {"deleted": True}
    raise HTTPException(status_code=404, detail="Debate not found")


@router.put("/debates/{debate_id}/rounds/{round_num}/brief")
async def edit_brief(debate_id: str, round_num: int, request: EditBriefRequest) -> DebateBrief:
    """Edit a round's brief and pause the debate."""
    session = store.load(debate_id)
    if not session:
        raise HTTPException(status_code=404, detail="Debate not found")

    # Find the round
    target_round = None
    for r in session.rounds:
        if r.number == round_num:
            target_round = r
            break

    if target_round is None:
        raise HTTPException(status_code=404, detail=f"Round {round_num} not found")

    if target_round.brief is None:
        raise HTTPException(status_code=400, detail="Round has no brief to edit")

    # Apply edits
    if request.consensus is not None:
        target_round.brief.consensus = request.consensus
    if request.disagreements is not None:
        target_round.brief.disagreements = [
            Disagreement(**d) if isinstance(d, dict) else d for d in request.disagreements
        ]
    if request.open_questions is not None:
        target_round.brief.open_questions = request.open_questions
    if request.summary is not None:
        target_round.brief.summary = request.summary

    target_round.brief.edited = True

    # Pause the debate
    session.status = DebateStatus.PAUSED
    # Remove any rounds after the edited one
    session.rounds = [r for r in session.rounds if r.number <= round_num]

    store.save(session)
    return target_round.brief


@router.post("/debates/{debate_id}/continue")
async def continue_debate(debate_id: str, request: ContinueRequest) -> DebateSession:
    """Continue a debate: resume a paused debate, or follow up on a completed one."""
    session = store.load(debate_id)
    if not session:
        raise HTTPException(status_code=404, detail="Debate not found")

    if session.status == DebateStatus.COMPLETED and request.question:
        # Follow-up on completed debate
        pass
    elif session.status == DebateStatus.PAUSED:
        # Resume paused debate
        pass
    else:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot continue debate with status: {session.status}. "
            "Use question parameter for completed debates, or resume paused debates without question.",
        )

    api_keys = _merge_api_keys(request.api_keys)

    try:
        orchestrator = _create_orchestrator(session.model_ids, api_keys, session.judge_model_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    session.status = DebateStatus.RUNNING
    store.save(session)

    async def send_event(event: dict):
        await event_bus.publish(session.id, event)

    task = asyncio.create_task(
        orchestrator.run(session, send_event=send_event, start_question=request.question)
    )
    _running_tasks[session.id] = task

    def _cleanup(t: asyncio.Task, sid: str = session.id):
        _running_tasks.pop(sid, None)

    task.add_done_callback(_cleanup)

    return session


@router.post("/debates/{debate_id}/fork")
async def fork_debate(debate_id: str, request: ForkRequest) -> DebateSession:
    """Fork a debate, copying all rounds. Created as PAUSED so user can edit brief before resuming."""
    session = store.load(debate_id)
    if not session:
        raise HTTPException(status_code=404, detail="Debate not found")

    # Copy ALL rounds
    forked_rounds = [r.model_copy(deep=True) for r in session.rounds]
    new_session = DebateSession(
        question=session.question,
        model_ids=session.model_ids,
        judge_model_id=session.judge_model_id,
        max_rounds=session.max_rounds,
        rounds=forked_rounds,
        forked_from=session.id,
        status=DebateStatus.PAUSED,
    )
    store.save(new_session)

    return new_session


@router.post("/config/validate-keys")
async def validate_keys(request: ValidateKeysRequest) -> dict:
    """Validate API keys by making a tiny request to each provider."""
    results: dict[str, dict] = {}

    for provider, key in request.api_keys.items():
        try:
            # Find any model for this provider to test with
            test_model_id = None
            for model_id, (prov, _) in MODEL_REGISTRY.items():
                if _PROVIDER_KEY_MAP.get(prov) == provider:
                    test_model_id = model_id
                    break

            if not test_model_id:
                results[provider] = {"valid": False, "error": f"Unknown provider: {provider}"}
                continue

            adapter = create_adapter(test_model_id, {provider: key})
            # Make a minimal request
            await adapter.generate([{"role": "user", "content": "Say 'ok'"}])
            results[provider] = {"valid": True}
        except Exception as e:
            results[provider] = {"valid": False, "error": str(e)}

    return results


@router.get("/models")
async def get_models() -> list[dict]:
    """List all available models."""
    return list_available_models()


@router.get("/config/server-keys")
async def get_server_keys() -> dict:
    """Return which providers have API keys configured on the server."""
    return {
        "anthropic": bool(settings.anthropic_api_key),
        "openai": bool(settings.openai_api_key),
        "gemini": bool(settings.gemini_api_key),
        "deepseek": bool(settings.deepseek_api_key),
        "openrouter": bool(settings.openrouter_api_key),
    }
