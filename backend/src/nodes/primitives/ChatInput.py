from src.nodes.NodeBase import Node, NodeSpec, NodeInput, NodeOutput

class ChatInput(Node):

    spec: NodeSpec = NodeSpec(
        name="Chat Input",
        description="A node that accepts user input and returns a message.",
        inputs=[
            NodeInput(type=str, description="The message to be sent.")
        ],
        outputs=[
            NodeOutput(type=str, description="The message received.")
        ],
        parameters={},
    )

    def run(self, **inputs):
        return inputs["message"]