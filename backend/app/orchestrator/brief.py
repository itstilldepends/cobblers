import json
import re

from app.adapters.base import LLMAdapter
from app.models.debate import DebateBrief, Disagreement, ModelResponse
from app.prompts.brief_generation import build_brief_prompt


class BriefGenerator:
    def __init__(self, adapter: LLMAdapter):
        self.adapter = adapter

    async def generate(self, question: str, responses: list[ModelResponse]) -> DebateBrief:
        """Generate a debate brief from model responses."""
        messages, anon_to_real = build_brief_prompt(question, responses)
        raw = await self.adapter.generate(messages)
        return self._parse_brief(raw, anon_to_real)

    @staticmethod
    def _parse_brief(raw: str, anon_to_real: dict[str, str] | None = None) -> DebateBrief:
        """Parse JSON from LLM response with fallback handling."""
        # Try to extract JSON from the response (may be wrapped in markdown code blocks)
        json_match = re.search(r"```(?:json)?\s*\n?(.*?)\n?```", raw, re.DOTALL)
        json_str = json_match.group(1) if json_match else raw.strip()

        try:
            data = json.loads(json_str)
        except json.JSONDecodeError:
            # Last resort: try to find anything that looks like JSON
            brace_match = re.search(r"\{.*\}", raw, re.DOTALL)
            if brace_match:
                try:
                    data = json.loads(brace_match.group(0))
                except json.JSONDecodeError:
                    return DebateBrief(summary=raw[:500], consensus=[], disagreements=[], open_questions=[])
            else:
                return DebateBrief(summary=raw[:500], consensus=[], disagreements=[], open_questions=[])

        # Parse disagreements and restore real model IDs
        disagreements = []
        for d in data.get("disagreements", []):
            if isinstance(d, dict) and "topic" in d and "positions" in d:
                positions = d["positions"]
                if anon_to_real:
                    positions = {
                        anon_to_real.get(k, k): v for k, v in positions.items()
                    }
                disagreements.append(Disagreement(topic=d["topic"], positions=positions))

        return DebateBrief(
            consensus=data.get("consensus", []),
            disagreements=disagreements,
            open_questions=data.get("open_questions", []),
            summary=data.get("summary", ""),
        )
