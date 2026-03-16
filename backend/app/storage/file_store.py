import json
import os

from app.models.api import DebateListItem
from app.models.debate import DebateSession


class FileStore:
    def __init__(self, data_dir: str = "./data"):
        self.data_dir = data_dir
        os.makedirs(data_dir, exist_ok=True)

    def _path(self, session_id: str) -> str:
        return os.path.join(self.data_dir, f"{session_id}.json")

    def save(self, session: DebateSession) -> None:
        """Write session to data_dir/{session.id}.json."""
        path = self._path(session.id)
        with open(path, "w") as f:
            json.dump(session.model_dump(), f, indent=2)

    def load(self, session_id: str) -> DebateSession | None:
        """Read session from file, return None if not found."""
        path = self._path(session_id)
        if not os.path.exists(path):
            return None
        try:
            with open(path) as f:
                data = json.load(f)
            return DebateSession.model_validate(data)
        except (json.JSONDecodeError, Exception):
            return None

    def list_all(self) -> list[DebateListItem]:
        """List all sessions, sorted by created_at descending."""
        items: list[DebateListItem] = []
        if not os.path.isdir(self.data_dir):
            return items
        for filename in os.listdir(self.data_dir):
            if not filename.endswith(".json"):
                continue
            path = os.path.join(self.data_dir, filename)
            try:
                with open(path) as f:
                    data = json.load(f)
                items.append(
                    DebateListItem(
                        id=data["id"],
                        question=data["question"],
                        status=data["status"],
                        model_ids=data["model_ids"],
                        round_count=len(data.get("rounds", [])),
                        created_at=data["created_at"],
                        forked_from=data.get("forked_from"),
                    )
                )
            except (json.JSONDecodeError, KeyError):
                continue
        items.sort(key=lambda x: x.created_at, reverse=True)
        return items

    def delete(self, session_id: str) -> bool:
        """Delete session file. Returns True if it existed."""
        path = self._path(session_id)
        if os.path.exists(path):
            os.remove(path)
            return True
        return False
