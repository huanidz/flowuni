from src.nodes.NodeBase import Node, NodeSpec, NodeInput, NodeOutput
from src.nodes.HandleType import TextFieldInputHandle


class ToolNode(Node):
    spec: NodeSpec = NodeSpec(
        name="Tool",
        description="Tool node that use tools to process the message.",
        inputs=[
            NodeInput(
                name="input_message",
                type=TextFieldInputHandle,
                description="The message to be processed by agent.",
            ),
            NodeInput(
                name="system_instruction",
                type=TextFieldInputHandle,
                description="Agent instruction",
            ),
        ],
        outputs=[
            NodeOutput(
                name="tool_result", type=str, description="The response from agent."
            )
        ],
        parameters={},
    )

    def process(self, inputs, parameters):
        return super().process(inputs, parameters)
