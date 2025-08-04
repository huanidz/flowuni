from loguru import logger
from src.node_components.llm.adapters.providers.GoogleGeminiProvider import (
    GoogleGeminiProvider,
)
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
                type=DropdownInputHandle(
                    options=[
                        DropdownOption(
                            label="gemini-2.5-flash", value="gemini-2.5-flash"
                        ),
                    ]
                ),
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

    def process(self, input_values, parameter_values):
        # Log every field of input_values
        logger.info("Input values:")
        for key, value in input_values.items():
            logger.info(f"{key}: {value}")

        model = input_values["model"]
        api_key = input_values["API Key"]
        system_prompt = input_values["system_instruction"]

        llm_provider = GoogleGeminiProvider(model, system_prompt, api_key)

        resp = llm_provider.chat_completion(
            messages=[
                {
                    "role": "user",
                    "content": "Extract Jason is 25 years old.",
                }
            ],
        )

        logger.info(f"LLM response: {resp.response}")

        return super().process(input_values, parameter_values)
