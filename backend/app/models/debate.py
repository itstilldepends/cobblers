import datetime
import uuid
from enum import Enum
from typing import Any

from pydantic import BaseModel, Field, model_validator


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
    question: str | None = None
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
    created_at: str = Field(
        default_factory=lambda: datetime.datetime.now().isoformat()
    )

    @model_validator(mode="before")
    @classmethod
    def migrate_follow_ups(cls, data: Any) -> Any:
        """Migrate legacy follow_ups data into rounds."""
        if isinstance(data, dict):
            follow_ups = data.pop("follow_ups", None)
            # Also remove legacy fork_point field
            data.pop("fork_point", None)
            if follow_ups:
                rounds = data.get("rounds", [])
                max_round_num = max((r["number"] for r in rounds), default=0) if rounds else 0
                for fu in follow_ups:
                    max_round_num += 1
                    round_data = {
                        "number": max_round_num,
                        "question": fu.get("question"),
                        "responses": fu.get("responses", []),
                        "brief": fu.get("brief"),
                        "convergence": None,
                    }
                    rounds.append(round_data)
                data["rounds"] = rounds
        return data
