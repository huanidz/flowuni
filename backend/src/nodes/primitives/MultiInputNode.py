from src.nodes.NodeBase import Node, NodeSpec, NodeInput, NodeOutput

class MultiInputNode(Node):

    spec: NodeSpec = NodeSpec(
        name="Multiple Inputs Node",
        description="A node that accepts user input and returns a message.",
        inputs=[
            NodeInput(type=str, description="The first input."),
            NodeInput(type=int, description="The second input.")
        ],
        outputs=[
            NodeOutput(type=str, description="The output.")
        ],
        parameters={},
    )

    def run(self, **inputs):
        return inputs["message"]