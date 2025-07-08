from src.nodes.NodeBase import Node, NodeSpec

class MultiInputNode(Node):

    spec: NodeSpec = NodeSpec(
        name="Multiple Inputs Node",
        description="A node that accepts user input and returns a message.",
        inputs={"message": str, "test": int},
        outputs={"message": str},
        parameters={},
    )

    def run(self, **inputs):
        return inputs["message"]