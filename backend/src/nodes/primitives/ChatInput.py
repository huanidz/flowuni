from src.nodes.core.NodeOutput import NodeOutput
from src.nodes.handles.basics.outputs import StringOutputHandle
from src.nodes.NodeBase import Node, NodeSpec


class ChatInput(Node):
    spec: NodeSpec = NodeSpec(
        name="Chat Input",
        description="A node that accepts user input and returns a message.",
        inputs=[],
        outputs=[
            NodeOutput(
                name="user_message",
                type=StringOutputHandle(),
                description="The message received.",
            )
        ],
        parameters={},
    )

    def process(self, inputs, parameters):
        return super().process(inputs, parameters)

    def build_tool(self, inputs_values, tool_configs):
        raise NotImplementedError("Subclasses must override build_tool")

    def process_tool(self, inputs_values, parameter_values, tool_inputs):
        raise NotImplementedError("Subclasses must override process_tool")
