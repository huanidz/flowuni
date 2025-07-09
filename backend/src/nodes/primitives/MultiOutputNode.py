from src.nodes.NodeBase import Node, NodeSpec, NodeInput, NodeOutput

class MultiOutputNode(Node):

    spec: NodeSpec = NodeSpec(
        name="Multiple Outputs Node",
        description="A node that accepts user input and returns a message.",
        inputs=[
            NodeInput(name="string_in", type=str, description="The first input."),
            NodeInput(name="int_in", type=int, description="The second input.")
        ],
        outputs=[
            NodeOutput(name="message_out_1", type=str, description="The output."),
            NodeOutput(name="message_out_2", type=str, description="The output 2.")
        ],
        parameters={},
    )

    def process(self, inputs, parameters):
        return super().process(inputs, parameters)