from src.nodes.core.NodeInput import NodeInput
from src.nodes.core.NodeOutput import NodeOutput
from src.nodes.handles.basics.inputs.TextFieldInputHandle import TextFieldInputHandle
from src.nodes.NodeBase import Node, NodeSpec


class MultiOutputNode(Node):
    spec: NodeSpec = NodeSpec(
        name="Multiple Outputs Node",
        description="A node that accepts user input and returns a message.",
        inputs=[
            NodeInput(
                name="string_in",
                type=TextFieldInputHandle(),
                description="The first input.",
            ),
            NodeInput(
                name="int_in",
                type=TextFieldInputHandle(),
                description="The second input.",
            ),
        ],
        outputs=[
            NodeOutput(name="message_out_1", type=str, description="The output."),
            NodeOutput(name="message_out_2", type=str, description="The output 2."),
        ],
        parameters={},
    )

    def process(self, inputs, parameters):
        return super().process(inputs, parameters)
