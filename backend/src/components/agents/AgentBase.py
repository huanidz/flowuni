"""
Agent.py

This module defines the base class for LLM-based agents. It provides the foundational structure
and methods that can be extended or overridden by specific agent implementations.
"""

from abc import ABC
from typing import Dict, List, Optional

from loguru import logger

# from src.components.agents.schemas.AgentOutputSchema import AgentOutputSchema
from src.components.llm.models.core import (
    ChatMessage,
    ChatResponse,
)
from src.components.llm.providers.adapters.LLMAdapterBase import LLMAdapter
from src.helpers.PydanticChatSchemaConstructor import PydanticChatSchemaConstructor
from src.helpers.PydanticSchemaConverter import PydanticSchemaConverter
from src.helpers.ToolHelper import ToolHelper
from src.schemas.nodes.node_data_parsers import ToolDataParser


class Agent(ABC):
    """
    Base class for LLM-based agents.

    This class provides the foundational structure for creating LLM-based agents
    with tool integration capabilities.

    Attributes:
        llm_provider (LLMAdapter): The LLM provider adapter for handling completions
        system_prompt (str): The system prompt for the agent
        tools (List[ToolDataParser]): List of available tools for the agent
        tools_map (Dict[str, ToolDataParser]): Mapping of tool names to tool parsers
    """

    def __init__(
        self,
        llm_provider: LLMAdapter,
        system_prompt: str = "",
        tools: List[ToolDataParser] = None,
    ) -> None:
        """
        Initialize the Agent with the given configuration.

        Args:
            llm_provider (LLMAdapter): The LLM provider adapter
            system_prompt (str, optional): The system prompt. Defaults to "".
            tools (List[ToolDataParser], optional): List of tools. Defaults to None.
        """
        self.llm_provider = llm_provider
        self.system_prompt = system_prompt
        self.tools = tools or []
        self.tools_map = self._build_tools_map()

    def chat(
        self,
        message: ChatMessage,
        streaming: bool = False,
        max_workers: Optional[int] = None,
    ) -> ChatResponse:
        """
        Process a message and return a response.

        Args:
            message (ChatMessage): The message to process
            streaming (bool, optional): Whether to use streaming. Defaults to False.
            max_workers (int, optional): Maximum number of worker threads for parallel tool execution.

        Returns:
            ChatResponse: The agent's response
        """  # noqa
        # Prepare system prompt with tools
        system_prompt = self._prepare_system_prompt()
        logger.info(f"System Prompt: {system_prompt}")

        # Initialize LLM provider
        self._initialize_llm_provider(system_prompt)

        ENABLE_REASONING = True
        ENABLE_TOOL_USE = True

        AgentResponseSchema = PydanticChatSchemaConstructor.create_agent_response_model(
            enable_reasoning=ENABLE_REASONING, enable_tool_use=ENABLE_TOOL_USE
        )

        chat_messages = [message]

        # Get structured completion from LLM
        agent_response = self.llm_provider.structured_completion(
            messages=chat_messages, output_schema=AgentResponseSchema
        )
        logger.info(f"Agent Response: {agent_response.model_dump_json(indent=2)}")

        if ENABLE_TOOL_USE:
            if not agent_response.planned_tool_calls:
                return ChatResponse(content=agent_response.final_response)

            for tool_call in agent_response.planned_tool_calls:
                tool_call_name = tool_call.tool_name

                IM_EXECUTING_TOOL_MESSAGE = f"Im executing tool {tool_call.tool_name}"

                chat_messages = [
                    *chat_messages,
                    ChatMessage(
                        role=self.llm_provider.roles.ASSISTANT,
                        content=IM_EXECUTING_TOOL_MESSAGE,
                    ),
                ]

                logger.info(f"👉 self.tools_map: {self.tools_map}")

                # Get target tool schema
                tool_origin_parser_pair: ToolDataParser = self.tools_map[tool_call_name]

                tool_origin, tool = next(iter(tool_origin_parser_pair.items()))
                import json

                ToolSchema = PydanticSchemaConverter.load(json.dumps(tool.tool_schema))

                logger.info(f"👉 ToolSchema: {ToolSchema.model_json_schema()}")

                tool_call_response = self.llm_provider.structured_completion(
                    messages=chat_messages, output_schema=ToolSchema
                )
                logger.info(
                    f"Agent Response: {tool_call_response.model_dump_json(indent=2)}"
                )

            return ChatResponse(content="DONE")

        return ChatResponse(content=agent_response.final_response)

    def _build_tools_map(self) -> Dict[str, Dict[str, ToolDataParser]]:
        """
        Build a mapping of tool names to tool parsers.

        Returns:
            Dict[str, ToolDataParser]: Mapping of tool names to parsers
        """

        return {tool.tool_name: {tool.tool_origin: tool} for tool in self.tools}

    def _prepare_system_prompt(self) -> str:
        """
        Prepare the complete system prompt including tools representation.

        Returns:
            str: The complete system prompt
        """
        tool_prompt = ToolHelper.get_tools_string_representation(tools=self.tools)
        return f"{self.system_prompt}\n\n{tool_prompt}"

    def _initialize_llm_provider(self, system_prompt: str) -> None:
        """
        Initialize the LLM provider with the system prompt.

        Args:
            system_prompt (str): The system prompt to use
        """
        self.llm_provider.init(
            model=self.llm_provider.model,
            system_prompt=system_prompt,
            api_key=self.llm_provider.api_key,
        )
