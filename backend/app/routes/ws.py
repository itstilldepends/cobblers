import asyncio
import json
import logging

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.config import settings
from app.events import event_bus
from app.storage.file_store import FileStore

logger = logging.getLogger(__name__)

router = APIRouter()

store = FileStore(data_dir=settings.data_dir)


@router.websocket("/api/debates/{debate_id}/ws")
async def debate_websocket(websocket: WebSocket, debate_id: str):
    """WebSocket endpoint for real-time debate events.

    Subscribes to the event bus and forwards events to the client.
    The orchestrator is started via REST endpoints, not here.
    """
    await websocket.accept()

    queue: asyncio.Queue | None = None

    try:
        # Wait for the client to send initial config (api_keys)
        raw = await websocket.receive_text()
        config = json.loads(raw)
        # api_keys are accepted for protocol compatibility but no longer used here
        _ = config.get("api_keys", {})

        session = store.load(debate_id)
        if not session:
            await websocket.send_json({"type": "error", "error": "Debate not found"})
            await websocket.close()
            return

        # Subscribe to the event bus for this debate
        queue = event_bus.subscribe(debate_id)

        # Forward events from the subscription queue to the websocket
        while True:
            try:
                event = await asyncio.wait_for(queue.get(), timeout=30.0)
                await websocket.send_json(event)
                if event.get("type") in ("debate_complete", "error"):
                    break
            except asyncio.TimeoutError:
                # Send a keepalive ping to detect dead connections
                try:
                    await websocket.send_json({"type": "ping"})
                except Exception:
                    break

    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected for debate {debate_id}")
    except json.JSONDecodeError:
        await websocket.send_json({"type": "error", "error": "Invalid JSON"})
    except Exception as e:
        logger.exception(f"WebSocket error for debate {debate_id}")
        try:
            await websocket.send_json({"type": "error", "error": str(e)})
        except Exception:
            pass
    finally:
        if queue is not None:
            event_bus.unsubscribe(debate_id, queue)
        try:
            await websocket.close()
        except Exception:
            pass
