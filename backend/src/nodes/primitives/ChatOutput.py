from src.nodes.NodeBase import Node, NodeSpec, NodeInput, NodeOutput

class ChatOutput(Node):

    spec: NodeSpec = NodeSpec(
        name="Chat Output",
        description="A node that output a message.",
        inputs=[
            NodeInput(type=str, description="The message to be output.")
        ],
        outputs=[],
        parameters={},
    )
    
    def run(self, **inputs):
        return inputs["message"]