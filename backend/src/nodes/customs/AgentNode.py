from src.nodes.core.NodeInput import NodeInput
from src.nodes.core.NodeOutput import NodeOutput

# from src.nodes.HandleType import TextFieldInputHandle
from src.nodes.handles.basics.TextFieldInputHandle import TextFieldInputHandle
from src.nodes.NodeBase import Node, NodeSpec


class AgentNode(Node):
    spec: NodeSpec = NodeSpec(
        name="Agent",
        description="Agent node that use tools to process the message.",
        inputs=[
            NodeInput(
                name="input_message",
                type=TextFieldInputHandle(),
                description="The message to be processed by agent.",
            ),
            NodeInput(
                name="system_instruction",
                type=TextFieldInputHandle(),
                description="Agent instruction",
            ),
        ],
        outputs=[
            NodeOutput(
                name="response", type=str, description="The response from agent."
            )
        ],
        parameters={},
    )

    def process(self, inputs, parameters):
        return super().process(inputs, parameters)
