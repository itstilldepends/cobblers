import asyncio
import json
import logging

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.adapters.registry import create_adapter
from app.config import settings
from app.models.debate import DebateStatus
from app.orchestrator.engine import DebateOrchestrator
from app.storage.file_store import FileStore

logger = logging.getLogger(__name__)

router = APIRouter()

store = FileStore(data_dir=settings.data_dir)


def _merge_api_keys(request_keys: dict[str, str]) -> dict[str, str]:
    """Merge request-provided API keys with env-configured ones."""
    keys: dict[str, str] = {}
    if settings.anthropic_api_key:
        keys["anthropic"] = settings.anthropic_api_key
    if settings.openai_api_key:
        keys["openai"] = settings.openai_api_key
    if settings.gemini_api_key:
        keys["gemini"] = settings.gemini_api_key
    if settings.deepseek_api_key:
        keys["deepseek"] = settings.deepseek_api_key
    keys.update(request_keys)
    return keys


@router.websocket("/api/debates/{debate_id}/ws")
async def debate_websocket(websocket: WebSocket, debate_id: str):
    """WebSocket endpoint for real-time debate events.

    After connecting, the client can send a JSON message with api_keys
    to start/resume the debate with streaming events.
    """
    await websocket.accept()

    event_queue: asyncio.Queue = asyncio.Queue()

    async def send_event(event: dict):
        await event_queue.put(event)

    try:
        # Wait for the client to send initial config (api_keys)
        raw = await websocket.receive_text()
        config = json.loads(raw)
        api_keys = _merge_api_keys(config.get("api_keys", {}))

        session = store.load(debate_id)
        if not session:
            await websocket.send_json({"type": "error", "error": "Debate not found"})
            await websocket.close()
            return

        if session.status not in (DebateStatus.RUNNING, DebateStatus.PAUSED):
            # Send current state and close
            await websocket.send_json({
                "type": "debate_complete",
                "status": session.status.value,
            })
            await websocket.close()
            return

        # Create adapters
        try:
            adapters = [create_adapter(mid, api_keys) for mid in session.model_ids]
            if session.judge_model_id:
                brief_adapter = create_adapter(session.judge_model_id, api_keys)
            else:
                brief_adapter = adapters[0]
        except ValueError as e:
            await websocket.send_json({"type": "error", "error": str(e)})
            await websocket.close()
            return

        orchestrator = DebateOrchestrator(store=store, adapters=adapters, brief_adapter=brief_adapter)

        if session.status == DebateStatus.PAUSED:
            session.status = DebateStatus.RUNNING
            store.save(session)

        # Run orchestrator in background, sending events through queue
        run_task = asyncio.create_task(orchestrator.run_streaming(session, send_event))

        # Forward events from queue to websocket
        try:
            while True:
                # Wait for either an event or the task to complete
                try:
                    event = await asyncio.wait_for(event_queue.get(), timeout=1.0)
                    await websocket.send_json(event)
                    if event.get("type") in ("debate_complete", "error"):
                        break
                except asyncio.TimeoutError:
                    if run_task.done():
                        # Drain remaining events
                        while not event_queue.empty():
                            event = event_queue.get_nowait()
                            await websocket.send_json(event)
                        break
        except WebSocketDisconnect:
            run_task.cancel()
            logger.info(f"WebSocket disconnected for debate {debate_id}")
            return

    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected for debate {debate_id}")
    except json.JSONDecodeError:
        await websocket.send_json({"type": "error", "error": "Invalid JSON"})
    except Exception as e:
        logger.exception(f"WebSocket error for debate {debate_id}")
        try:
            await websocket.send_json({"type": "error", "error": str(e)})
        except Exception:
            pass
    finally:
        try:
            await websocket.close()
        except Exception:
            pass
