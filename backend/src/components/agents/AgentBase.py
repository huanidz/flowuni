"""
Agent.py

This module defines the base class for LLM-based agents. It provides the foundational structure and methods
that can be extended or overridden by specific agent implementations.
"""

from abc import ABC
from typing import List

from loguru import logger
from src.components.agents.schemas.AgentOutputSchema import AgentOutputSchema
from src.components.llm.models.core import (
    ChatMessage,
    ChatResponse,
)
from src.components.llm.providers.adapters.LLMAdapterBase import LLMAdapter
from src.helpers.ToolHelper import ToolHelper
from src.schemas.nodes.node_data_parsers import ToolDataParser


class Agent(ABC):
    """
    Base class for LLM-based agents.

    Attributes:
    """

    def __init__(
        self,
        llm_provider: LLMAdapter,
        system_prompt: str = "",
        tools: List[ToolDataParser] = [],
    ):
        """
        Initializes the Agent with the given configuration and agent profile.
        """

        self.llm_provider = llm_provider
        self.system_prompt = system_prompt
        self.tools = tools

    def chat(self, message: ChatMessage, streaming: bool = False) -> ChatResponse:
        """
        Processes a message.  This method should be overridden by subclasses.

        Args:
            message (ChatMessage): The message to process.
        """
        TOOL_PROMPT = ToolHelper.get_tools_string_representation(tools=self.tools)

        SYS_PROMPT = self.system_prompt + "\n\n" + TOOL_PROMPT

        logger.info(f"System Prompt: {SYS_PROMPT}")

        self.llm_provider.init(
            model=self.llm_provider.model,
            system_prompt=SYS_PROMPT,
            api_key=self.llm_provider.api_key,
        )

        agent_response: AgentOutputSchema = self.llm_provider.structured_completion(
            messages=[message], output_schema=AgentOutputSchema
        )

        logger.info(f"Agent Response: {agent_response.model_dump_json(indent=2)}")

        return ChatResponse(content=agent_response.final_response)

    # def process_tools(self, tool_useds: List[ToolUsed]) -> str:
    #     """
    #     Process tools and return the result in string format.

    #     Args:
    #         tool_useds (List[ToolUsed]): A list of tools to be executed.

    #     Returns:
    #         List[str]: A list of string representations of the tool results (This is for LLM-friendly format)
    #     """
    #     tool_results_in_str: List[str] = []

    #     for tool_used in tool_useds:
    #         tool_name = tool_used.tool_name
    #         tool_params: List[ToolParam] = tool_used.tool_params

    #         if tool_name not in self.tools:
    #             logger.error(
    #                 f"Tool '{tool_name}' not found in agent's registered tools."
    #             )
    #             tool_results_in_str.append(f"Error: Tool '{tool_name}' not found.")
    #             continue

    #         tool = self.tools[tool_name]
    #         tool_param_dict = {param.name: param.value for param in tool_params}

    #         try:
    #             tool_result = tool.execute(input_dict=tool_param_dict)
    #             result_in_str = tool.result_to_llm_friendly(tool_result=tool_result)

    #             # Augment more string
    #             result_in_str = f"Result from tool {tool_name}:\n{result_in_str}"

    #             tool_results_in_str.append(result_in_str)
    #         except Exception as e:
    #             logger.error(f"Error executing tool '{tool_name}': {e}")
    #             tool_results_in_str.append(f"Error executing tool '{tool_name}': {e}")

    #     tool_result_in_str = "\n".join(tool_results_in_str)
    #     return tool_result_in_str
