import json

from src.components.agents.AgentBase import Agent
from src.components.llm.models.core import (
    ChatMessage,
    ChatResponse,
)
from src.components.llm.providers.adapters.LLMAdapterBase import LLMAdapter
from src.components.llm.providers.LLMProvider import LLMProvider
from src.components.llm.providers.LLMProviderConsts import LLMProviderName
from src.nodes.core.NodeInput import NodeInput
from src.nodes.core.NodeOutput import NodeOutput
from src.nodes.handles.agents.AgentToolInputHandle import AgentToolInputHandle
from src.nodes.handles.basics.inputs.DropdownInputHandle import (
    DropdownInputHandle,
    DropdownOption,
)
from src.nodes.handles.basics.inputs.SecretTextInputHandle import SecretTextInputHandle
from src.nodes.handles.basics.inputs.TextFieldInputHandle import TextFieldInputHandle
from src.nodes.handles.basics.outputs.DataOutputHandle import DataOutputHandle
from src.nodes.handles.resolvers.basics import (
    ConditionalResolver,
    HttpResolver,
    StaticResolver,
)
from src.nodes.NodeBase import Node, NodeSpec
from src.schemas.nodes.node_data_parsers import ToolDataParser


class AgentNode(Node):
    spec: NodeSpec = NodeSpec(
        name="Agent",
        description="Agent node that use tools to process the message.",
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
            NodeInput(
                name="tools",
                type=AgentToolInputHandle(),
                description="Agent tools",
                allow_multiple_incoming_edges=True,
            ),
        ],
        outputs=[
            NodeOutput(
                name="response",
                type=DataOutputHandle(),
                description="The response from agent.",
            )
        ],
        parameters={},
    )

    def process(self, input_values, parameter_values):
        provider = input_values["provider"]
        model = input_values["model"]
        api_key = input_values["API Key"]
        system_prompt = input_values["system_instruction"]
        input_message = input_values["input_message"]

        tools = json.loads(input_values["tools"])
        tools = [ToolDataParser(**tool) for tool in tools]

        llm_provider: LLMAdapter = LLMProvider.get_provider(provider_name=provider)
        llm_provider.init(
            model=model,
            system_prompt=system_prompt,
            api_key=api_key,
        )
        agent = Agent(
            llm_provider=llm_provider,
            system_prompt=system_prompt,
            tools=tools,
        )

        chat_message = ChatMessage(role="user", content=input_message)
        chat_response: ChatResponse = agent.chat(message=chat_message)

        return {"response": chat_response.content}
