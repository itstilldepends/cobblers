from pydantic import BaseModel


class CreateDebateRequest(BaseModel):
    question: str
    model_ids: list[str]  # e.g. ["claude-sonnet", "gpt-4o", "gemini-flash"]
    judge_model_id: str | None = None  # model for brief/convergence; defaults to first debater
    max_rounds: int = 5
    api_keys: dict[str, str] = {}  # provider -> key


class EditBriefRequest(BaseModel):
    consensus: list[str] | None = None
    disagreements: list[dict] | None = None
    open_questions: list[str] | None = None
    summary: str | None = None


class ResumeRequest(BaseModel):
    api_keys: dict[str, str] = {}

class FollowUpRequest(BaseModel):
    question: str
    api_keys: dict[str, str] = {}


class ForkRequest(BaseModel):
    fork_at_round: int
    question: str | None = None  # optional new question
    api_keys: dict[str, str] = {}


class ValidateKeysRequest(BaseModel):
    api_keys: dict[str, str]  # provider -> key


class DebateListItem(BaseModel):
    id: str
    question: str
    status: str
    model_ids: list[str]
    round_count: int
    created_at: str
    forked_from: str | None = None
