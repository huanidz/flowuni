from src.nodes.NodeBase import Node, NodeSpec, NodeInput


class ChatOutput(Node):
    spec: NodeSpec = NodeSpec(
        name="Chat Output",
        description="A node that output a message.",
        inputs=[
            NodeInput(
                name="message_in", type=str, description="The message to be output."
            )
        ],
        outputs=[],
        parameters={},
    )

    def process(self, inputs, parameters):
        return super().process(inputs, parameters)
