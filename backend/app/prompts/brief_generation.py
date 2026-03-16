import string

from app.models.debate import ModelResponse

# Anonymous labels: Model A, Model B, Model C, ...
_LABELS = [f"Model {c}" for c in string.ascii_uppercase]

BRIEF_SYSTEM_PROMPT = """You are an impartial analyst summarizing a multi-AI debate. Your job is to identify consensus, disagreements, and open questions from the responses provided.

The model identities are anonymized. Use the provided labels (Model A, Model B, etc.) when referring to specific positions.

You MUST respond with valid JSON matching this exact schema:
{
  "consensus": ["list of points all models agree on"],
  "disagreements": [
    {
      "topic": "description of the disagreement",
      "positions": {
        "Model A": "that model's position"
      }
    }
  ],
  "open_questions": ["questions that remain unresolved"],
  "summary": "A brief overall summary of the debate state"
}

Be precise and objective. Quote or paraphrase the models accurately. Do not add your own opinions.

IMPORTANT: Respond in the same language as the original question."""


def build_brief_prompt(
    question: str, responses: list[ModelResponse]
) -> tuple[list[dict[str, str]], dict[str, str]]:
    """Format all responses with anonymous labels and ask for a structured JSON brief.

    Returns:
        (messages, anon_to_real): the prompt messages and a mapping from
        anonymous label (e.g. "Model A") to real model_id (e.g. "claude-sonnet").
    """
    anon_to_real: dict[str, str] = {}
    real_to_anon: dict[str, str] = {}
    for i, resp in enumerate(responses):
        label = _LABELS[i] if i < len(_LABELS) else f"Model {i + 1}"
        anon_to_real[label] = resp.model_id
        real_to_anon[resp.model_id] = label

    responses_text = "\n\n".join(
        f"### {real_to_anon[resp.model_id]}:\n{resp.text}" for resp in responses
    )

    messages = [
        {
            "role": "user",
            "content": f"""{BRIEF_SYSTEM_PROMPT}

---

Original question: {question}

Model responses:

{responses_text}

---

Now produce the JSON summary.""",
        }
    ]

    return messages, anon_to_real
