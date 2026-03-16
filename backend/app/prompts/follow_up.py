from app.models.debate import DebateBrief, FollowUp
from app.prompts.round_n import format_brief


def build_follow_up_prompt(
    original_question: str,
    debate_brief: DebateBrief,
    previous_follow_ups: list[FollowUp],
    current_question: str,
) -> list[dict[str, str]]:
    """Build prompt for a follow-up question after debate completion."""
    debate_context = format_brief(debate_brief)

    history_section = ""
    if previous_follow_ups:
        parts = []
        for fu in previous_follow_ups:
            fu_brief = format_brief(fu.brief) if fu.brief else "(no summary)"
            parts.append(f"Follow-up #{fu.number}: {fu.question}\nSummary: {fu_brief}")
        history = "\n\n".join(parts)
        history_section = f"\nPrevious follow-up discussions:\n{history}\n"

    content = (
        "A multi-AI debate has concluded on the following question:\n\n"
        f"Original question: {original_question}\n\n"
        f"Final debate conclusions:\n{debate_context}\n"
        f"{history_section}\n"
        "The user now asks a follow-up question. Answer it thoroughly, "
        "drawing on the debate conclusions above where relevant.\n\n"
        f"Follow-up question: {current_question}\n\n"
        "Respond in the same language as the questions."
    )

    return [
        {
            "role": "user",
            "content": content,
        }
    ]
