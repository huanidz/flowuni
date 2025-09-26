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
    event_type: str = Query(None, description="Filter events by type"),
):
    """
    Stream events for a specific user in real-time using Redis streams.
    Users can only subscribe to their own events.
    """
    if not token:
        raise HTTPException(status_code=403, detail="Missing access token")

    stream_name = f"user_events:{user_id}"
    if event_type:
        stream_name = f"user_events:{user_id}:{event_type}"

    async def event_generator():
        nonlocal since_id

        # Continue with blocking read for new messages
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
                            since_id = message_id

                            # Parse the event data
                            event_data = json.loads(data.get("data", "{}"))
                            event_type = event_data.get("event_type", "UNKNOWN")

                            # Send the event to the client
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
                logger.error(
                    f"Error streaming user events for user {user_id}: {e}. "
                    f"traceback: {traceback.format_exc()}"
                )
                # Send error event to client
                error_payload = {
                    "event": "ERROR",
                    "id": f"error:{time.time()}",
                    "user_id": user_id,
                    "error": str(e),
                    "timestamp": time.time(),
                }
                yield f"id: error:{time.time()}\n"
                yield f"data: {json.dumps(error_payload)}\n\n"
                # Continue streaming despite errors
                continue

    return StreamingResponse(event_generator(), media_type="text/event-stream")
