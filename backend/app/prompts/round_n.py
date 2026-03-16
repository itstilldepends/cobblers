from app.models.debate import DebateBrief


def build_round_n_prompt(question: str, brief: DebateBrief, round_number: int) -> list[dict[str, str]]:
    """Build messages for subsequent rounds - respond to brief."""
    brief_text = format_brief(brief)

    return [
        {
            "role": "user",
            "content": f"""You are in round {round_number} of a multi-AI debate.

Original question: {question}

Here is the current state of the debate:
{brief_text}

Please:
1. Address any disagreements where you have additional insights
2. Refine your position based on valid points raised by others
3. Identify if you've changed your mind on anything and why
4. Highlight remaining uncertainties

Be concise and focus on advancing the discussion.

Respond in the same language as the original question.""",
        }
    ]


def format_brief(brief: DebateBrief) -> str:
    """Format a DebateBrief as readable text."""
    sections = []

    if brief.summary:
        sections.append(f"## Summary\n{brief.summary}")

    if brief.consensus:
        items = "\n".join(f"- {point}" for point in brief.consensus)
        sections.append(f"## Points of Consensus\n{items}")

    if brief.disagreements:
        disagreement_parts = []
        for d in brief.disagreements:
            positions_text = "\n".join(f"  - {model}: {pos}" for model, pos in d.positions.items())
            disagreement_parts.append(f"- **{d.topic}**:\n{positions_text}")
        sections.append(f"## Disagreements\n" + "\n".join(disagreement_parts))

    if brief.open_questions:
        items = "\n".join(f"- {q}" for q in brief.open_questions)
        sections.append(f"## Open Questions\n{items}")

    return "\n\n".join(sections) if sections else "(No brief available yet.)"
