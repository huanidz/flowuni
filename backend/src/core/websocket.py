import json
from datetime import datetime
from typing import Dict, Optional, Set

from fastapi import WebSocket
from loguru import logger
from redis import Redis


class ConnectionManager:
    """Manages WebSocket connections and messaging."""

    def __init__(self):
        """Initialize the connection manager."""
        self.active_connections: Dict[str, WebSocket] = {}
        self.user_connections: Dict[
            int, Set[str]
        ] = {}  # user_id -> set of connection_ids
        self.redis_client: Optional[Redis] = None

    async def connect(self, websocket: WebSocket, connection_id: str, user_id: int):
        """
        Accept a WebSocket connection and register it.

        Args:
            websocket: The WebSocket connection
            connection_id: Unique identifier for the connection
            user_id: ID of the authenticated user
        """
        await websocket.accept()
        self.active_connections[connection_id] = websocket

        # Register connection for the user
        if user_id not in self.user_connections:
            self.user_connections[user_id] = set()
        self.user_connections[user_id].add(connection_id)

        logger.info(
            f"WebSocket connection established: {connection_id} for user: {user_id}"
        )

        # Send welcome message
        await self.send_personal_message(
            {
                "type": "connection_established",
                "connection_id": connection_id,
                "timestamp": datetime.utcnow().isoformat(),
                "message": "WebSocket connection established successfully",
            },
            connection_id,
        )

    def disconnect(self, connection_id: str, user_id: int):
        """
        Remove a WebSocket connection.

        Args:
            connection_id: ID of the connection to remove
            user_id: ID of the user who disconnected
        """
        if connection_id in self.active_connections:
            del self.active_connections[connection_id]

        if user_id in self.user_connections:
            self.user_connections[user_id].discard(connection_id)
            if not self.user_connections[user_id]:  # Remove user if no connections left
                del self.user_connections[user_id]

        logger.info(f"WebSocket connection closed: {connection_id} for user: {user_id}")

    async def send_personal_message(self, message: dict, connection_id: str):
        """
        Send a message to a specific connection.

        Args:
            message: Message to send
            connection_id: ID of the connection to send to
        """
        if connection_id in self.active_connections:
            try:
                await self.active_connections[connection_id].send_text(
                    json.dumps(message)
                )
            except Exception as e:
                logger.error(f"Error sending message to {connection_id}: {e}")
                # Remove the connection if it's broken
                if connection_id in self.active_connections:
                    del self.active_connections[connection_id]

    async def handle_flow_execution_result(
        self, task_id: str, result: dict, user_id: int
    ):
        """
        Handle flow execution results and send them to the appropriate user.

        Args:
            task_id: ID of the flow execution task
            result: Execution result data
            user_id: ID of the user who initiated the execution
        """
        message = {
            "type": "flow_execution_result",
            "task_id": task_id,
            "result": result,
            "timestamp": datetime.utcnow().isoformat(),
        }

        await self.send_user_message(message, user_id)


# Global connection manager instance
manager = ConnectionManager()
