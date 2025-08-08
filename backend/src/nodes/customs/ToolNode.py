from src.nodes.core.NodeInput import NodeInput
from src.nodes.core.NodeOutput import NodeOutput
from src.nodes.handles.basics.TextFieldInputHandle import TextFieldInputHandle
from src.nodes.NodeBase import Node, NodeSpec


class ToolNode(Node):
    spec: NodeSpec = NodeSpec(
        name="Tool",
        description="Tool node that use tools to process the message.",
        inputs=[
            NodeInput(
                name="input_message",
                type=TextFieldInputHandle(),
                description="The message to be processed by agent.",
                enable_for_tool=True,
            ),
            NodeInput(
                name="system_instruction",
                type=TextFieldInputHandle(),
                description="Agent instruction",
            ),
        ],
        outputs=[
            NodeOutput(
                name="tool_result",
                type=str,
                description="The response from agent.",
                enable_for_tool=True,
            ),
            NodeOutput(
                name="tool_result2",
                type=str,
                description="The response from agent.",
                enable_for_tool=True,
            ),
        ],
        parameters={},
        can_be_tool=True,
    )

    def process(self, inputs, parameters):
        return super().process(inputs, parameters)
