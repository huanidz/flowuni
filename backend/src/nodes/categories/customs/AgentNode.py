import json
from typing import List

from src.components.agents.AgentBase import Agent
from src.components.llm.models.core import (
    ChatMessage,
    ChatResponse,
)
from src.components.llm.providers.adapters.LLMProviderInterface import LLMProviderBase
from src.components.llm.providers.LLMProviderFactory import LLMProviderFactory
from src.consts.node_consts import NODE_GROUP_CONSTS
from src.models.parsers.LLMProviderParser import LLMProviderParser
from src.models.parsers.SessionChatHistoryParser import (
    SessionChatHistoryListParser,
)
from src.nodes.core.NodeIcon import NodeIconIconify
from src.nodes.core.NodeInput import NodeInput
from src.nodes.core.NodeOutput import NodeOutput
from src.nodes.core.NodeParameterSpec import ParameterSpec
from src.nodes.handles.agents.AgentToolInputHandle import AgentToolInputHandle
from src.nodes.handles.basics.inputs import (
    LLMProviderInputHandle,
    NumberInputHandle,
    TextFieldInputHandle,
)
from src.nodes.handles.basics.outputs.DataOutputHandle import DataOutputHandle
from src.nodes.NodeBase import Node, NodeSpec
from src.schemas.nodes.node_data_parsers import ToolDataParser


class AgentNode(Node):
    spec: NodeSpec = NodeSpec(
        name="Agent",
        description="Agent node that use tools to process the message.",
        inputs=[
            NodeInput(
                name="llm_provider",
                type=LLMProviderInputHandle(),
                description="LLM provider",
                required=True,
            ),
            NodeInput(
                name="chat_history",
                type=TextFieldInputHandle(multiline=True, hide_input_field=True),
                description="The chat history for the agent.",
                required=False,
            ),
            NodeInput(
                name="input_message",
                type=TextFieldInputHandle(),
                description="The message to be processed by agent.",
                required=True,
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
        parameters=[
            ParameterSpec(
                name="max_loop",
                type=NumberInputHandle(
                    min_value=1, max_value=10, integer_only=True, step=1
                ),
                description="Max loop of the Agent. Leave -1 as no-limit. We will have a hard limit within to avoid stuck.",
                default=3,
                allow_incoming_edges=False,
            ),
        ],
        can_be_tool=False,
        group=NODE_GROUP_CONSTS.AGENT,
        icon=NodeIconIconify(icon_value="mage:robot-happy"),
    )

    def process(self, input_values, parameter_values):
        llm_provider = input_values["llm_provider"]
        system_prompt = input_values["system_instruction"]
        input_message = input_values["input_message"]

        agent_max_loop = parameter_values["max_loop"]
        if int(agent_max_loop) == -1:
            agent_max_loop == 10
        else:
            agent_max_loop = int(agent_max_loop)

        if not llm_provider:
            raise ValueError(
                "LLM provider is required. Please use a LLMProvider node to connect to this input."  # noqa
            )

        parsed_provider = LLMProviderParser.model_validate_json(llm_provider)

        chat_history = input_values.get("chat_history", None)
        prev_histories: List[ChatMessage] = []
        if chat_history:
            chat_history_list = SessionChatHistoryListParser.model_validate_json(
                chat_history
            )
            # Access all elements except the last due to first item is inserted in the chat/ (user message) # noqa
            prev_histories: List[ChatMessage] = chat_history_list.to_chat_messages()[
                ::-1
            ]

        tools = []
        tools_value = input_values["tools"]
        if not tools_value:
            tools = []
        else:
            tools = json.loads(input_values["tools"])
            tools = [ToolDataParser(**tool) for tool in tools]

        llm_provider_instance: LLMProviderBase = LLMProviderFactory.get_provider(
            provider_name=parsed_provider.provider
        )
        llm_provider_instance.init(
            model=parsed_provider.model,
            system_prompt=system_prompt,
            api_key=parsed_provider.api_key,
        )
        agent = Agent(
            llm_provider=llm_provider_instance,
            system_prompt=system_prompt,
            tools=tools,
            max_loop_count=agent_max_loop,
        )

        chat_message = ChatMessage(role="user", content=input_message)
        chat_response: ChatResponse = agent.chat(
            message=chat_message, prev_histories=prev_histories
        )

        return {"response": chat_response.content}

    def build_tool(self):
        raise NotImplementedError("Subclasses must override build_tool")

    def process_tool(self):
        raise NotImplementedError("Subclasses must override process_tool")
