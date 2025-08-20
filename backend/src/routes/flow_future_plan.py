import traceback
from uuid import uuid4

from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect, status
from loguru import logger
from src.core.websocket import websocket_manager
from src.decorators.common_decorators import futureuse
from src.dependencies.auth_dependency import get_current_socket_user

future_plan_router = APIRouter(
    prefix="/api/flow_future_plan",
    tags=["flow_future_plan"],
)


@futureuse
@future_plan_router.websocket("/ws/playground_chat")
async def chat_playground(
    websocket: WebSocket, _auth_user_id: int = Depends(get_current_socket_user)
):
    # Start connection
    NEW_CONNECTION_ID = str(uuid4())

    # Attempt to establish WebSocket connection
    connection_success = await websocket_manager.connect(
        websocket=websocket, connection_id=NEW_CONNECTION_ID, user_id=_auth_user_id
    )

    # If connection failed, log and return immediately
    if not connection_success:
        logger.error(
            f"Failed to establish WebSocket connection {NEW_CONNECTION_ID} for user {_auth_user_id}"
        )
        await websocket.close(
            code=status.WS_1011_INTERNAL_ERROR,
            reason="WebSocket connection establishment failed",
        )
        return

    try:
        while True:
            data = await websocket.receive_text()
            await websocket.send_text(data)
    except WebSocketDisconnect as e:
        logger.info(
            f"WebSocket disconnected for connection {NEW_CONNECTION_ID}, user {_auth_user_id}. "
            f"Code: {e.code}, Reason: {e.reason}"
        )
        # Disconnect from the websocket manager
        websocket_manager.disconnect(
            connection_id=NEW_CONNECTION_ID, user_id=_auth_user_id
        )
    except Exception as e:
        logger.error(
            f"Unexpected error in WebSocket connection {NEW_CONNECTION_ID} for user {_auth_user_id}: {e}. "
            f"traceback: {traceback.format_exc()}"
        )
        # Ensure disconnection on any other error
        websocket_manager.disconnect(
            connection_id=NEW_CONNECTION_ID, user_id=_auth_user_id
        )
        await websocket.close(
            code=status.WS_1011_INTERNAL_ERROR,
            reason=f"Internal server error: {str(e)}",
        )
