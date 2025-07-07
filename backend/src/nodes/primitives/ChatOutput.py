from src.nodes.NodeBase import Node, NodeSpec

class ChatOutput(Node):

    spec: NodeSpec = NodeSpec(
        name="Chat Output",
        description="A node that output a message.",
        inputs={"message": str},
        outputs={},
        parameters={},
    )
    
    def run(self, **inputs):
        return inputs["message"]