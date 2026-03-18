from app.models.debate import DebateBrief
from app.prompts.round_n import format_brief


def build_convergence_prompt(
    question: str,
    brief: DebateBrief,
    previous_briefs: list[DebateBrief],
    prior_context_brief: DebateBrief | None = None,
) -> list[dict[str, str]]:
    """Ask an LLM to judge if the debate has converged.

    Args:
        question: The question being debated (follow-up question if applicable).
        brief: The current round's brief.
        previous_briefs: Briefs from earlier rounds of the SAME question's run.
        prior_context_brief: If this is a follow-up, the final brief from the
            prior discussion. Provided as background only — convergence should
            be judged solely on the current question's discussion.
    """
    current_text = format_brief(brief)

    history = ""
    if previous_briefs:
        history_parts = []
        for i, pb in enumerate(previous_briefs, 1):
            history_parts.append(f"### Round {i} Brief:\n{format_brief(pb)}")
        history = "\n\n".join(history_parts)

    context_section = ""
    if prior_context_brief:
        context_section = f"""For background, here is the conclusion from the prior discussion (DO NOT use this to judge convergence — it is only context):
{format_brief(prior_context_brief)}

---

"""

    return [
        {
            "role": "user",
            "content": f"""You are judging whether a multi-AI debate has converged (reached sufficient agreement or exhausted productive discussion).

Question being discussed: {question}

{context_section}{"Previous round briefs for this question:" + chr(10) + history + chr(10) + chr(10) if history else ""}Current round brief:
{current_text}

Analyze whether the debate on the above question has converged. Consider:
1. Are the remaining disagreements substantive or minor?
2. Have positions changed significantly between rounds?
3. Are the open questions likely to be resolved with further discussion?

IMPORTANT: Write the "reasoning" field in the same language as the question.

Respond with valid JSON:
{{
  "converged": true/false,
  "confidence": 0.0-1.0,
  "reasoning": "brief explanation in the same language as the question"
}}""",
        }
    ]
