import json
import re

from app.adapters.base import LLMAdapter
from app.models.debate import ConvergenceResult, DebateBrief
from app.prompts.convergence import build_convergence_prompt


class ConvergenceDetector:
    def __init__(self, adapter: LLMAdapter):
        self.adapter = adapter

    async def check(
        self, question: str, brief: DebateBrief, previous_briefs: list[DebateBrief]
    ) -> ConvergenceResult:
        """Check if the debate has converged."""
        messages = build_convergence_prompt(question, brief, previous_briefs)
        raw = await self.adapter.generate(messages)
        return self._parse_result(raw)

    @staticmethod
    def _parse_result(raw: str) -> ConvergenceResult:
        """Parse convergence JSON from LLM response."""
        json_match = re.search(r"```(?:json)?\s*\n?(.*?)\n?```", raw, re.DOTALL)
        json_str = json_match.group(1) if json_match else raw.strip()

        try:
            data = json.loads(json_str)
        except json.JSONDecodeError:
            brace_match = re.search(r"\{.*\}", raw, re.DOTALL)
            if brace_match:
                try:
                    data = json.loads(brace_match.group(0))
                except json.JSONDecodeError:
                    return ConvergenceResult(converged=False, confidence=0.0, reasoning="Failed to parse convergence check")
            else:
                return ConvergenceResult(converged=False, confidence=0.0, reasoning="Failed to parse convergence check")

        return ConvergenceResult(
            converged=bool(data.get("converged", False)),
            confidence=float(data.get("confidence", 0.0)),
            reasoning=str(data.get("reasoning", "")),
        )
