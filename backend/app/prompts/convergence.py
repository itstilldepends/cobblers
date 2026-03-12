from app.models.debate import DebateBrief
from app.prompts.round_n import format_brief


def build_convergence_prompt(
    question: str, brief: DebateBrief, previous_briefs: list[DebateBrief]
) -> list[dict[str, str]]:
    """Ask an LLM to judge if the debate has converged."""
    current_text = format_brief(brief)

    history = ""
    if previous_briefs:
        history_parts = []
        for i, pb in enumerate(previous_briefs, 1):
            history_parts.append(f"### Round {i} Brief:\n{format_brief(pb)}")
        history = "\n\n".join(history_parts)

    return [
        {
            "role": "user",
            "content": f"""You are judging whether a multi-AI debate has converged (reached sufficient agreement or exhausted productive discussion).

Original question: {question}

{"Previous round briefs:" + chr(10) + history + chr(10) + chr(10) if history else ""}Current round brief:
{current_text}

Analyze whether the debate has converged. Consider:
1. Are the remaining disagreements substantive or minor?
2. Have positions changed significantly between rounds?
3. Are the open questions likely to be resolved with further discussion?

Respond with valid JSON:
{{
  "converged": true/false,
  "confidence": 0.0-1.0,
  "reasoning": "brief explanation"
}}""",
        }
    ]
