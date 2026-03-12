def build_round1_prompt(question: str) -> list[dict[str, str]]:
    """Build messages for first round - independent answer."""
    return [
        {
            "role": "user",
            "content": f"""You are participating in a multi-AI debate. Answer the following question thoroughly and honestly. Present your reasoning clearly.

Question: {question}

Provide a comprehensive answer with clear reasoning.""",
        }
    ]
