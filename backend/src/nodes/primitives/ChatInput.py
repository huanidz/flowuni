from src.nodes.NodeBase import Node, NodeSpec, NodeInput, NodeOutput
from src.schemas.flowbuilder.flow_graph_schemas import NodeData

from typing import Dict, Any
class ChatInput(Node):

    spec: NodeSpec = NodeSpec(
        name="Chat Input",
        description="A node that accepts user input and returns a message.",
        inputs=[
            NodeInput(name="message_in", type=str, description="The message to be sent.")
        ],
        outputs=[
            NodeOutput(name="message_out", type=str, description="The message received.")
        ],
        parameters={},
    )

    def process(self, inputs, parameters):
        return super().process(inputs, parameters)