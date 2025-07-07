from src.nodes.NodeBase import Node, NodeSpec

class ChatInput(Node):

    spec: NodeSpec = NodeSpec(
        name="Chat Input",
        description="A node that accepts user input and returns a message.",
        inputs={},
        outputs={"message": str},
        parameters={},
    )
    
    def run(self, **inputs):
        return inputs["message"]