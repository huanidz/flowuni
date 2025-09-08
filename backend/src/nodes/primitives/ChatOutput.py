from src.nodes.core.NodeInput import NodeInput
from src.nodes.handles.basics.inputs.TextFieldInputHandle import TextFieldInputHandle
from src.nodes.NodeBase import Node, NodeSpec


class ChatOutput(Node):
    spec: NodeSpec = NodeSpec(
        name="Chat Output",
        description="A node that output a message.",
        inputs=[
            NodeInput(
                name="message_in",
                type=TextFieldInputHandle(multiline=True),
                description="The message to be output.",
            )
        ],
        outputs=[],
        parameters=[],
    )

    def process(self, inputs, parameters):
        return super().process(inputs, parameters)

    def build_tool(self, inputs_values, tool_configs):
        raise NotImplementedError("Subclasses must override build_tool")

    def process_tool(self, inputs_values, parameter_values, tool_inputs):
        raise NotImplementedError("Subclasses must override process_tool")
