"""
Agent.py

This module defines the base class for LLM-based agents. It provides the foundational structure
and methods that can be extended or overridden by specific agent implementations.
"""

from abc import ABC
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Dict, List, Optional, Tuple

from loguru import logger
from src.components.agents.schemas.AgentOutputSchema import AgentOutputSchema
from src.components.llm.models.core import (
    ChatMessage,
    ChatResponse,
)
from src.components.llm.providers.adapters.LLMAdapterBase import LLMAdapter
from src.helpers.ToolHelper import ToolHelper
from src.nodes.NodeRegistry import NodeRegistry
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

        # Get structured completion from LLM
        agent_response: AgentOutputSchema = self.llm_provider.structured_completion(
            messages=[message], output_schema=AgentOutputSchema
        )
        logger.info(f"Agent Response: {agent_response.model_dump_json(indent=2)}")

        # Handle response based on whether tools were called
        if not agent_response.planned_tool_calls:
            return ChatResponse(content=agent_response.final_response)

        # Execute all planned tool calls in parallel
        tool_results = self._execute_tools_parallel(
            agent_response.planned_tool_calls, max_workers=max_workers
        )

        # Format the results
        formatted_results = self._format_multiple_tool_results(tool_results)

        return ChatResponse(content=formatted_results)

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

    def _execute_single_tool(self, tool_call) -> Tuple[str, str]:
        """
        Execute a single tool call.

        Args:
            tool_call: The tool call to execute

        Returns:
            Tuple[str, str]: (tool_name, execution_result)
        """
        try:
            origin_map = self.tools_map[tool_call.tool_name]

            origin_tool_name, tool = next(iter(origin_map.items()))

            llm_tool_params = tool_call.tool_params

            default_input_values = tool.input_values
            llm_input_values = {
                llm_param.name: llm_param.value for llm_param in llm_tool_params
            }

            # Override default input values with LLM input values
            final_input_values = {**default_input_values, **llm_input_values}

            node_registry = NodeRegistry()
            node_instance = node_registry.create_node_instance(name=origin_tool_name)

            result = node_instance.process(final_input_values, tool.parameter_values)
            logger.info(f"Tool '{tool_call.tool_name}' executed successfully")
            return tool_call.tool_name, str(result)

        except Exception as e:
            error_msg = f"Error executing tool '{tool_call.tool_name}': {str(e)}"
            logger.error(error_msg)
            return tool_call.tool_name, f"[ERROR] {error_msg}"

    def _execute_tools_parallel(
        self, tool_calls: List, max_workers: Optional[int] = None
    ) -> List[Tuple[str, str]]:
        """
        Execute multiple tool calls in parallel using ThreadPoolExecutor.

        Args:
            tool_calls: List of tool calls to execute
            max_workers: Maximum number of worker threads. Defaults=None (uses default).

        Returns:
            List[Tuple[str, str]]: List of (tool_name, result) tuples in execution order
        """
        if not tool_calls:
            return []

        if len(tool_calls) == 1:
            # Single tool, no need for parallelization
            return [self._execute_single_tool(tool_calls[0])]

        logger.info(f"Executing {len(tool_calls)} tools in parallel")

        results = []
        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            # Submit all tool executions
            future_to_tool = {
                executor.submit(self._execute_single_tool, tool_call): tool_call
                for tool_call in tool_calls
            }

            # Collect results as they complete
            for future in as_completed(future_to_tool):
                tool_call = future_to_tool[future]
                try:
                    result = future.result()
                    results.append(result)
                except Exception as e:
                    error_msg = (
                        f"Unexpected error with tool '{tool_call.tool_name}': {str(e)}"
                    )
                    logger.error(error_msg)
                    results.append((tool_call.tool_name, f"[ERROR] {error_msg}"))

        return results

    def _format_multiple_tool_results(self, tool_results: List[Tuple[str, str]]) -> str:
        """
        Format multiple tool execution results into a readable response.

        Args:
            tool_results: List of (tool_name, result) tuples

        Returns:
            str: Formatted results string
        """
        if not tool_results:
            return "No tools were executed."

        if len(tool_results) == 1:
            tool_name, result = tool_results[0]
            return f"Tool '{tool_name}' result:\n{result}"

        formatted_parts = [f"Executed {len(tool_results)} tools:\n"]

        for i, (tool_name, result) in enumerate(tool_results, 1):
            formatted_parts.append(f"{i}. Tool '{tool_name}':")
            formatted_parts.append(f"   {result}\n")

        return "\n".join(formatted_parts)
