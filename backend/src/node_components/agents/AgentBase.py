"""
Agent.py

This module defines the base class for LLM-based agents. It provides the foundational structure and methods
that can be extended or overridden by specific agent implementations.
"""

from abc import ABC, abstractmethod
from typing import Any, Dict, Generator, List

from loguru import logger
from src.node_components.llm.models.core import (
    ChatMessage,
    ChatResponse,
)
from tools.ToolBase import BaseTool, ToolParam, ToolResult, ToolUsed


class Agent(ABC):
    """
    Base class for LLM-based agents.

    Attributes:
    """

    def __init__(self):
        """
        Initializes the Agent with the given configuration and agent profile.
        """

        self.tools: Dict[str, BaseTool] = {}

    @abstractmethod
    def process_message(self, message: ChatMessage) -> ChatResponse:
        """
        Processes a message.  This method should be overridden by subclasses.

        Args:
            message (ChatMessage): The message to process.
        """
        pass

    @abstractmethod
    def process_message_generator(
        self, message: ChatMessage
    ) -> Generator[ChatResponse, None, None]:
        """
        Processes a message and yields the generated response.

        Args:
            message (ChatMessage): The message to process.

        Yields:
            ChatResponse: The generated response.
        """
        pass

    # Tools
    def add_tool(self, tool: BaseTool):
        """Thêm tool vào agent"""
        self.tools[tool.name] = tool

    def execute_tool(self, tool_name: str, parameters: Dict[str, Any]) -> ToolResult:
        """Execute một tool với parameters"""
        if tool_name not in self.tools:
            return ToolResult(False, None, f"Tool '{tool_name}' not found")

        tool = self.tools[tool_name]
        try:
            return tool.execute(**parameters)
        except Exception as e:
            return ToolResult(False, None, f"Error executing tool: {str(e)}")

    def process_tools(self, tool_useds: List[ToolUsed]) -> str:
        """
        Process tools and return the result in string format.

        Args:
            tool_useds (List[ToolUsed]): A list of tools to be executed.

        Returns:
            List[str]: A list of string representations of the tool results (This is for LLM-friendly format)
        """
        tool_results_in_str: List[str] = []

        for tool_used in tool_useds:
            tool_name = tool_used.tool_name
            tool_params: List[ToolParam] = tool_used.tool_params

            if tool_name not in self.tools:
                logger.error(
                    f"Tool '{tool_name}' not found in agent's registered tools."
                )
                tool_results_in_str.append(f"Error: Tool '{tool_name}' not found.")
                continue

            tool = self.tools[tool_name]
            tool_param_dict = {param.name: param.value for param in tool_params}

            try:
                tool_result = tool.execute(input_dict=tool_param_dict)
                result_in_str = tool.result_to_llm_friendly(tool_result=tool_result)

                # Augment more string
                result_in_str = f"Result from tool {tool_name}:\n{result_in_str}"

                tool_results_in_str.append(result_in_str)
            except Exception as e:
                logger.error(f"Error executing tool '{tool_name}': {e}")
                tool_results_in_str.append(f"Error executing tool '{tool_name}': {e}")

        tool_result_in_str = "\n".join(tool_results_in_str)
        return tool_result_in_str
