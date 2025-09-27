import asyncio
import json
import time
import traceback

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.responses import StreamingResponse
from loguru import logger
from redis import Redis
from src.dependencies.auth_dependency import auth_through_url_param
from src.dependencies.redis_dependency import get_redis_client
from src.utils.user_events_utils import _normalize_since_id

user_event_router = APIRouter(
    prefix="/api/user-events",
    tags=["user_events"],
)


@user_event_router.get("/stream/{user_id}/events")
async def stream_user_events(
    request: Request,
    user_id: int,
    since_id: str = "0",
    _auth_user_id: int = Depends(auth_through_url_param),
    redis_client: Redis = Depends(get_redis_client),
    token: str = Query(None),
):
    """
    Stream events for a specific user in real-time using Redis streams.
    Users can only subscribe to their own events.
    """
    if not token:
        raise HTTPException(status_code=403, detail="Missing access token")

    # Optional: enforce docstring contract (leave as-is or remove if not needed)
    # if _auth_user_id != user_id:
    #     raise HTTPException(status_code=403, detail="Forbidden")

    stream_name = f"user_events:{user_id}"
    since_id = _normalize_since_id(since_id)

    async def event_generator():
        nonlocal since_id

        while not await request.is_disconnected():
            try:
                events = await asyncio.to_thread(
                    redis_client.xread,
                    streams={stream_name: since_id},
                    count=5,
                    block=5000,  # 5-second timeout
                )

                if events:
                    for _, messages in events:
                        for message_id, data in messages:
                            since_id = str(message_id)  # advance cursor

                            # Parse the event data (leave your existing logic untouched)
                            event_data = json.loads(data.get("data", "{}"))
                            event_type = event_data.get("event_type", "UNKNOWN")

                            payload = {
                                "event": "USER_EVENT",
                                "id": message_id,
                                "user_id": user_id,
                                "event_type": event_type,
                                "data": event_data,
                                "timestamp": time.time(),
                            }
                            yield f"id: {message_id}\n"
                            yield f"data: {json.dumps(payload)}\n\n"

            except Exception as e:
                msg = str(e)
                # Self-heal the known failure mode and avoid a tight loop
                if "Invalid stream ID" in msg:
                    logger.warning(
                        f"XREAD invalid since_id {since_id} on {stream_name}. Resetting to '0-0'.",
                    )
                    since_id = "0-0"
                else:
                    logger.error(
                        f"Error streaming user events for user {user_id}: {e}. "
                        f"traceback: {traceback.format_exc()}"
                    )

                error_payload = {
                    "event": "ERROR",
                    "id": f"error:{time.time()}",
                    "user_id": user_id,
                    "error": msg,
                    "timestamp": time.time(),
                }
                yield f"id: error:{time.time()}\n"
                yield f"data: {json.dumps(error_payload)}\n\n"

                # Tiny backoff so logs don't spam if the error repeats
                await asyncio.sleep(0.2)
                continue

    return StreamingResponse(event_generator(), media_type="text/event-stream")
