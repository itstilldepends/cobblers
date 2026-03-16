"""In-memory event bus for forwarding orchestrator events to WebSocket clients."""

import asyncio
from collections import defaultdict


class EventBus:
    """Simple pub/sub event bus keyed by debate ID."""

    def __init__(self):
        self._subscribers: dict[str, set[asyncio.Queue]] = defaultdict(set)

    def subscribe(self, debate_id: str) -> asyncio.Queue:
        """Create a new subscription queue for a debate."""
        queue: asyncio.Queue = asyncio.Queue()
        self._subscribers[debate_id].add(queue)
        return queue

    def unsubscribe(self, debate_id: str, queue: asyncio.Queue) -> None:
        """Remove a subscription queue."""
        self._subscribers[debate_id].discard(queue)
        if not self._subscribers[debate_id]:
            del self._subscribers[debate_id]

    async def publish(self, debate_id: str, event: dict) -> None:
        """Publish an event to all subscribers of a debate."""
        for queue in self._subscribers.get(debate_id, set()):
            await queue.put(event)


event_bus = EventBus()
