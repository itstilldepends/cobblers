import datetime
import uuid
from enum import Enum

from pydantic import BaseModel, Field


class DebateStatus(str, Enum):
    RUNNING = "running"
    PAUSED = "paused"
    COMPLETED = "completed"
    ERROR = "error"


class ModelResponse(BaseModel):
    model_id: str
    provider: str
    text: str


class Disagreement(BaseModel):
    topic: str
    positions: dict[str, str]  # model_id -> position


class DebateBrief(BaseModel):
    consensus: list[str] = Field(default_factory=list)
    disagreements: list[Disagreement] = Field(default_factory=list)
    open_questions: list[str] = Field(default_factory=list)
    summary: str = ""
    edited: bool = False


class ConvergenceResult(BaseModel):
    converged: bool
    confidence: float
    reasoning: str


class Round(BaseModel):
    number: int
    responses: list[ModelResponse] = Field(default_factory=list)
    brief: DebateBrief | None = None
    convergence: ConvergenceResult | None = None


class DebateSession(BaseModel):
    id: str = Field(default_factory=lambda: uuid.uuid4().hex[:12])
    question: str
    model_ids: list[str]
    judge_model_id: str | None = None
    max_rounds: int = 5
    status: DebateStatus = DebateStatus.RUNNING
    rounds: list[Round] = Field(default_factory=list)
    forked_from: str | None = None
    fork_point: int | None = None
    created_at: str = Field(
        default_factory=lambda: datetime.datetime.now().isoformat()
    )
