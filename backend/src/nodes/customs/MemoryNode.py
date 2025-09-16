from typing import Any, Dict, Union

from loguru import logger
from src.consts.node_consts import NODE_GROUP_CONSTS
from src.nodes.core.NodeInput import NodeInput
from src.nodes.core.NodeOutput import NodeOutput
from src.nodes.handles.basics.inputs.NumberInputHandle import NumberInputHandle
from src.nodes.handles.basics.outputs.StringOutputHandle import StringOutputHandle
from src.nodes.NodeBase import Node, NodeSpec


class MemoryNode(Node):
    spec: NodeSpec = NodeSpec(
        name="Memory",
        description="A node that stores and retrieves recent messages.",
        inputs=[
            NodeInput(
                name="recent_messages",
                type=NumberInputHandle(),
                description="Number of recent messages to retrieve.",
                default=5,
                required=True,
            ),
        ],
        outputs=[
            NodeOutput(
                name="messages",
                type=StringOutputHandle(),
                description="The retrieved recent messages.",
            )
        ],
        parameters=[],
        can_be_tool=False,
        group=NODE_GROUP_CONSTS.AGENT,
    )

    def process(
        self, inputs: Dict[str, Any], parameters: Dict[str, Any]
    ) -> Dict[str, Union[str]]:
        """
        Process the memory node by retrieving recent messages.

        Args:
            inputs: Dictionary containing the number of recent messages to retrieve
            parameters: Dictionary of parameters (not used in this node)

        Returns:
            Dictionary containing the retrieved messages
        """
        recent_messages_count = inputs.get("recent_messages", None)

        session_repo = self.context.repositories.session_repository

        session_id = self.context.session_id

        messages = session_repo.get_chat_history(
            session_id=session_id,
            num_messages=recent_messages_count,
        )

        logger.info(f"Retrieved {len(messages)} messages from session {session_id}")

        return {"messages": "test"}

    def build_tool(self, inputs_values: Dict[str, Any], tool_configs):
        raise NotImplementedError("Subclasses must override build_tool")

    def process_tool(
        self,
        inputs_values: Dict[str, Any],
        parameter_values: Dict[str, Any],
        tool_inputs: Dict[str, Any],
    ) -> Any:
        raise NotImplementedError("Subclasses must override process_tool")
