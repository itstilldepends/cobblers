import asyncio
import logging
from typing import Any, Callable, Coroutine

from app.adapters.base import LLMAdapter
from app.models.debate import DebateSession, DebateStatus, ModelResponse, Round
from app.orchestrator.brief import BriefGenerator
from app.orchestrator.convergence import ConvergenceDetector
from app.prompts.round1 import build_round1_prompt
from app.prompts.round_n import build_round_n_prompt
from app.storage.file_store import FileStore

logger = logging.getLogger(__name__)

SendEvent = Callable[[dict[str, Any]], Coroutine[Any, Any, None]]


class DebateOrchestrator:
    def __init__(self, store: FileStore, adapters: list[LLMAdapter], brief_adapter: LLMAdapter):
        self.store = store
        self.adapters = adapters
        self.brief_adapter = brief_adapter
        self.brief_generator = BriefGenerator(brief_adapter)
        self.convergence_detector = ConvergenceDetector(brief_adapter)

    async def run(
        self,
        session: DebateSession,
        send_event: SendEvent | None = None,
        start_question: str | None = None,
    ):
        """Run the full debate loop."""
        try:
            start_round = len(session.rounds) + 1

            # For follow-ups, reset the round budget: allow max_rounds additional rounds
            if start_question:
                end_round = start_round + session.max_rounds - 1
            else:
                end_round = session.max_rounds

            for round_num in range(start_round, end_round + 1):
                if session.status == DebateStatus.PAUSED:
                    break

                if send_event:
                    await send_event({"type": "round_start", "round": round_num})

                # 1. Build prompts
                is_first_round_of_run = round_num == start_round

                if round_num == 1 and not start_question:
                    prompts = {adapter.model_id: build_round1_prompt(session.question) for adapter in self.adapters}
                else:
                    last_brief = session.rounds[-1].brief if session.rounds else None
                    if last_brief is None:
                        logger.error("No brief found for previous round")
                        break

                    follow_up_q = start_question if (is_first_round_of_run and start_question) else None
                    prompts = {
                        adapter.model_id: build_round_n_prompt(
                            start_question or session.question, last_brief, round_num,
                            follow_up_question=follow_up_q,
                        )
                        for adapter in self.adapters
                    }

                # 2. Call all adapters concurrently
                async def call_adapter(adapter: LLMAdapter, msgs: list[dict[str, str]]) -> ModelResponse:
                    try:
                        text = await adapter.generate(msgs)
                        if send_event:
                            await send_event({
                                "type": "model_response",
                                "round": round_num,
                                "model_id": adapter.model_id,
                                "text": text,
                            })
                        return ModelResponse(model_id=adapter.model_id, provider=adapter.provider, text=text)
                    except Exception as e:
                        error_text = f"Error: {e}"
                        if send_event:
                            await send_event({
                                "type": "model_error",
                                "round": round_num,
                                "model_id": adapter.model_id,
                                "error": error_text,
                            })
                        return ModelResponse(model_id=adapter.model_id, provider=adapter.provider, text=error_text)

                tasks = [call_adapter(adapter, prompts[adapter.model_id]) for adapter in self.adapters]
                responses = await asyncio.gather(*tasks)

                # 3. Create round
                current_round = Round(number=round_num, responses=list(responses))

                # Set question on the first round of a follow-up run
                if is_first_round_of_run and start_question:
                    current_round.question = start_question

                # 4. Generate brief
                convergence_question = start_question or session.question
                try:
                    brief = await self.brief_generator.generate(convergence_question, list(responses))
                    current_round.brief = brief
                    if send_event:
                        await send_event({
                            "type": "brief_generated",
                            "round": round_num,
                            "brief": brief.model_dump(),
                        })
                except Exception as e:
                    logger.error(f"Brief generation failed: {e}")
                    if send_event:
                        await send_event({"type": "brief_error", "round": round_num, "error": str(e)})

                # 5. Check convergence (only if we have a brief and not on the last round)
                if current_round.brief and round_num < end_round:
                    previous_briefs = [r.brief for r in session.rounds if r.brief is not None]
                    try:
                        convergence = await self.convergence_detector.check(
                            convergence_question, current_round.brief, previous_briefs
                        )
                        current_round.convergence = convergence
                        if send_event:
                            await send_event({
                                "type": "convergence_check",
                                "round": round_num,
                                "result": convergence.model_dump(),
                            })
                    except Exception as e:
                        logger.error(f"Convergence check failed: {e}")

                # 6. Add round and save
                session.rounds.append(current_round)
                self.store.save(session)

                # 7. Check if converged
                if current_round.convergence and current_round.convergence.converged:
                    if send_event:
                        await send_event({"type": "converged", "round": round_num})
                    break

            # Mark as completed
            if session.status != DebateStatus.PAUSED:
                session.status = DebateStatus.COMPLETED
                self.store.save(session)

            if send_event:
                await send_event({"type": "debate_complete", "status": session.status.value})

        except Exception as e:
            logger.exception(f"Debate orchestration failed: {e}")
            session.status = DebateStatus.ERROR
            self.store.save(session)
            if send_event:
                await send_event({"type": "error", "error": str(e)})
