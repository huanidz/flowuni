from src.nodes.core.NodeInput import NodeInput
from src.nodes.core.NodeOutput import NodeOutput
from src.nodes.handles.basics.inputs.TextFieldInputHandle import TextFieldInputHandle
from src.nodes.NodeBase import Node, NodeSpec


class MultiInputNode(Node):
    spec: NodeSpec = NodeSpec(
        name="Multiple Inputs Node",
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
        outputs=[NodeOutput(name="message_out", type=str, description="The output.")],
        parameters=[],
    )

    def process(self, inputs, parameters):
        return super().process(inputs, parameters)

    def build_tool(self, inputs_values, tool_configs):
        return

    def process_tool(self, inputs_values, parameter_values, tool_inputs):
        return
