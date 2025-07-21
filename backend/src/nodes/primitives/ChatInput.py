from src.nodes.NodeBase import Node, NodeSpec, NodeInput, NodeOutput


class ChatInput(Node):
    spec: NodeSpec = NodeSpec(
        name="Chat Input",
        description="A node that accepts user input and returns a message.",
        inputs=[],
        outputs=[
            NodeOutput(
                name="user_message", type=str, description="The message received."
            )
        ],
        parameters={},
    )

    def process(self, inputs, parameters):
        return super().process(inputs, parameters)
