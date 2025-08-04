from src.nodes.core.NodeInput import NodeInput
from src.nodes.core.NodeOutput import NodeOutput
from src.nodes.handles.basics.DropdownInputHandle import (
    DropdownInputHandle,
    DropdownOption,
)
from src.nodes.handles.basics.SecretTextInputHandle import SecretTextInputHandle

# from src.nodes.HandleType import TextFieldInputHandle
from src.nodes.handles.basics.TextFieldInputHandle import TextFieldInputHandle
from src.nodes.NodeBase import Node, NodeSpec


class AgentNode(Node):
    spec: NodeSpec = NodeSpec(
        name="Agent",
        description="Agent node that use tools to process the message.",
        inputs=[
            NodeInput(
                name="provider",
                type=DropdownInputHandle(
                    options=[
                        DropdownOption(label="OpenAI", value="OpenAI"),
                        DropdownOption(label="Google", value="Google"),
                    ]
                ),
                description="LLM provider",
                allow_incoming_edges=False,
            ),
            NodeInput(
                name="model",
                type=DropdownInputHandle(options=[]),
                description="LLM model",
                allow_incoming_edges=False,
            ),
            NodeInput(
                name="API Key",
                type=SecretTextInputHandle(allow_visible_toggle=True, multiline=False),
                description="LLM API Key",
                allow_incoming_edges=False,
            ),
            NodeInput(
                name="input_message",
                type=TextFieldInputHandle(),
                description="The message to be processed by agent.",
            ),
            NodeInput(
                name="system_instruction",
                type=TextFieldInputHandle(),
                description="Agent instruction",
                default="You are a helpful assistant.",
                allow_incoming_edges=False,
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
