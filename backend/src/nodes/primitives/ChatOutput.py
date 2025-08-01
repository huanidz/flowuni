from src.nodes.core.NodeInput import NodeInput
from src.nodes.handles.basics.TextFieldInputHandle import TextFieldInputHandle
from src.nodes.NodeBase import Node, NodeSpec


class ChatOutput(Node):
    spec: NodeSpec = NodeSpec(
        name="Chat Output",
        description="A node that output a message.",
        inputs=[
            NodeInput(
                name="message_in",
                type=TextFieldInputHandle(),
                description="The message to be output.",
            )
        ],
        outputs=[],
        parameters={},
    )

    def process(self, inputs, parameters):
        return super().process(inputs, parameters)
