from loguru import logger
from src.components.llm.providers.LLMProviderConsts import LLMProviderName
from src.consts.node_consts import NODE_GROUP_CONSTS
from src.models.parsers.LLMProviderParser import LLMProviderParser
from src.nodes.core.NodeIcon import NodeIconIconify
from src.nodes.core.NodeInput import NodeInput
from src.nodes.core.NodeOutput import NodeOutput
from src.nodes.handles.basics.inputs.DropdownInputHandle import (
    DropdownInputHandle,
    DropdownOption,
)
from src.nodes.handles.basics.inputs.SecretTextInputHandle import SecretTextInputHandle
from src.nodes.handles.basics.outputs import LLMProviderOutputHandle
from src.nodes.handles.resolvers.basics import (
    ConditionalResolver,
    HttpResolver,
    StaticResolver,
)
from src.nodes.NodeBase import Node, NodeSpec


class LLMProviderNode(Node):
    spec: NodeSpec = NodeSpec(
        name="LLM Provider",
        description="LLM provider node that uses provider, model, and API key.",
        inputs=[
            NodeInput(
                name="provider",
                type=DropdownInputHandle(
                    options=[
                        DropdownOption(label=str(provider), value=str(provider))
                        for provider in LLMProviderName.get_all()
                    ]
                ),
                description="LLM provider",
                allow_incoming_edges=False,
                required=True,
            ),
            NodeInput(
                name="model",
                type=DropdownInputHandle(
                    options=[],
                    client_resolver=ConditionalResolver(
                        type="conditional",
                        field_id="provider",
                        cases={
                            "openrouter": HttpResolver(
                                type="http",
                                url="https://openrouter.ai/api/v1/models",
                                method="GET",
                                response_path="$.data.*.id",
                                error_path="error.message",
                            ),
                            "google-gemini": StaticResolver(
                                type="static",
                                options=[
                                    {
                                        "value": "gemini-2.5-flash",
                                        "label": "gemini-2.5-flash",
                                    },
                                    {
                                        "value": "gemini-2.5-pro",
                                        "label": "gemini-2.5-pro",
                                    },
                                ],
                            ),
                        },
                    ),
                    searchable=True,
                    sort_options=True,
                ),
                description="LLM model",
                allow_incoming_edges=False,
                required=True,
            ),
            NodeInput(
                name="API Key",
                type=SecretTextInputHandle(allow_visible_toggle=True, multiline=False),
                description="LLM API Key",
                allow_incoming_edges=False,
                required=True,
            ),
        ],
        outputs=[
            NodeOutput(
                name="llm",
                type=LLMProviderOutputHandle(),
                description="The configured LLM provider.",
            )
        ],
        parameters=[],
        can_be_tool=False,
        icon=NodeIconIconify(icon_value="carbon:machine-learning-model"),
        group=NODE_GROUP_CONSTS.PROVIDER,
    )

    def process(self, input_values, parameter_values):
        provider = input_values["provider"]
        model = input_values["model"]
        api_key = input_values["API Key"]

        if not provider or not model or not api_key:
            raise ValueError("Provider, model, and API key are required inputs.")

        llm_provider_data = {
            "provider": provider,
            "model": model,
            "api_key": api_key,
        }

        # Validate inputs using LLMProviderParser
        try:
            parsed_data = LLMProviderParser(**llm_provider_data)
        except Exception as e:
            logger.error(f"Input validation error: {e}")
            raise ValueError(f"Invalid input data: {e}")

        return {"llm": parsed_data.model_dump_json()}

    def build_tool(self):
        raise NotImplementedError("Subclasses must override build_tool")

    def process_tool(self):
        raise NotImplementedError("Subclasses must override process_tool")
