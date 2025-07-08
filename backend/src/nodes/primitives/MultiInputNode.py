from src.nodes.NodeBase import Node, NodeSpec, NodeInput, NodeOutput

class MultiInputNode(Node):

    spec: NodeSpec = NodeSpec(
        name="Multiple Inputs Node",
        description="A node that accepts user input and returns a message.",
        inputs=[
            NodeInput(name="string_in", type=str, description="The first input."),
            NodeInput(name="int_in", type=int, description="The second input.")
        ],
        outputs=[
            NodeOutput(name="message_out", type=str, description="The output.")
        ],
        parameters={},
    )

    def run(self, **inputs):
        return inputs["message"]