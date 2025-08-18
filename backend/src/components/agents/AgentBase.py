"""
Agent.py

This module defines the base class for LLM-based agents. It provides the foundational structure
and methods that can be extended or overridden by specific agent implementations.
"""  # noqa

from abc import ABC
from typing import Dict, List, Optional

from loguru import logger
from src.components.llm.models.core import ChatMessage, ChatResponse
from src.components.llm.providers.adapters.LLMAdapterBase import LLMAdapter
from src.helpers.PydanticChatSchemaConstructor import PydanticChatSchemaConstructor
from src.helpers.PydanticSchemaConverter import PydanticSchemaConverter
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
        tools_map (Dict[str, Dict[str, ToolDataParser]]): Mapping of tool names to tool parsers
    """  # noqa

    def __init__(
        self,
        llm_provider: LLMAdapter,
        system_prompt: str = "",
        tools: Optional[List[ToolDataParser]] = None,
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
        # Step 1: Prepare the system prompt with available tools
        system_prompt = self._prepare_system_prompt()
        logger.info(f"System Prompt: {system_prompt}")

        # Step 2: Initialize the LLM provider with our system prompt
        self._initialize_llm_provider(system_prompt)

        # Step 3: Configure agent capabilities - these flags control what the agent can do # noqa
        enable_reasoning = True  # Allow the agent to show its reasoning process
        enable_tool_use = True  # Allow the agent to use tools

        # Step 4: Create the response schema based on our configuration
        agent_response_schema = (
            PydanticChatSchemaConstructor.create_agent_response_model(
                enable_reasoning=enable_reasoning, enable_tool_use=enable_tool_use
            )
        )

        # Step 5: Start our conversation with the initial message
        chat_messages = [message]

        # Step 6: Get the agent's initial response (this might include planned tool calls) # noqa
        agent_response = self.llm_provider.structured_completion(
            messages=chat_messages, output_schema=agent_response_schema
        )
        logger.info(f"Agent Response: {agent_response.model_dump_json(indent=2)}")

        # Step 7: Handle tool execution if the agent wants to use tools
        if enable_tool_use and agent_response.planned_tool_calls:
            logger.info(
                f"Agent wants to execute {len(agent_response.planned_tool_calls)} tool(s)"  # noqa
            )

            # Process each tool call one by one
            processed_result = None
            for tool_call in agent_response.planned_tool_calls:
                tool_call_name = tool_call.tool_name
                logger.info(f"🔧 Processing tool call: {tool_call_name}")

                # Let the conversation know we're executing a tool
                execution_message = f"Executing tool: {tool_call_name}"
                chat_messages.append(
                    ChatMessage(
                        role=self.llm_provider.roles.ASSISTANT,
                        content=execution_message,
                    )
                )

                # Find the tool in our available tools
                if tool_call_name not in self.tools_map:
                    logger.error(
                        f"❌ Tool '{tool_call_name}' not found in available tools"
                    )
                    continue

                # Get the tool configuration
                tool_origin_parser_pair = self.tools_map[tool_call_name]
                origin_tool_name, tool_parser = next(
                    iter(tool_origin_parser_pair.items())
                )
                logger.info(f"✅ Found tool: {origin_tool_name}")

                # Create an instance of the node that will execute our tool
                node_registry = NodeRegistry()
                node_instance = node_registry.create_node_instance(
                    name=origin_tool_name
                )

                if not node_instance:
                    logger.error(
                        f"❌ Could not create node instance for {origin_tool_name}"
                    )
                    raise ValueError(f"Node {origin_tool_name} not found in registry")

                # Execute the tool - there are two scenarios:
                # 1. Tool has a schema (needs LLM to fill out parameters)
                # 2. Tool has no schema (can run directly with existing parameters)

                if tool_parser.tool_schema:
                    # Scenario 1: Tool needs the LLM to provide structured input
                    logger.info("🧠 Tool requires LLM to generate structured input")

                    # Convert the tool schema to a Pydantic model
                    tool_schema_model = PydanticSchemaConverter.load_from_dict(
                        tool_parser.tool_schema
                    )
                    logger.info(
                        f"📋 Tool Schema: {tool_schema_model.model_json_schema()}"
                    )

                    # Ask the LLM to fill out the tool parameters based on the conversation # noqa
                    tool_call_response = self.llm_provider.structured_completion(
                        messages=chat_messages, output_schema=tool_schema_model
                    )
                    logger.info(
                        f"🎯 LLM provided tool inputs: {tool_call_response.model_dump_json(indent=2)}"  # noqa
                    )

                    # Execute the tool with LLM-generated inputs
                    processed_result = node_instance.process_tool(
                        inputs_values=tool_parser.input_values,
                        parameter_values=tool_parser.parameter_values,
                        tool_inputs=tool_call_response.model_dump(),
                    )
                else:
                    # Scenario 2: Tool can run with pre-configured parameters
                    logger.info("⚡ Tool can run directly with existing parameters")

                    processed_result = node_instance.process_tool(
                        inputs_values=tool_parser.input_values,
                        parameter_values=tool_parser.parameter_values,
                        tool_inputs={},  # No additional inputs needed
                    )

                logger.info(
                    f"✨ Tool execution completed with result: {processed_result}"
                )

            # Return the result of the last tool execution
            return ChatResponse(content=str(processed_result))

        # Step 8: If no tools were used, just return the agent's direct response
        logger.info("💬 Returning direct response (no tools used)")
        return ChatResponse(content=agent_response.final_response)

    def _build_tools_map(self) -> Dict[str, Dict[str, ToolDataParser]]:
        """
        Build a mapping of tool names to tool parsers for quick lookup.

        This creates a dictionary where:
        - Key: tool_name (what the agent calls the tool)
        - Value: another dictionary with tool_origin -> ToolDataParser

        Returns:
            Dict[str, Dict[str, ToolDataParser]]: The tools mapping
        """
        tools_mapping = {}
        for tool in self.tools:
            tools_mapping[tool.tool_name] = {tool.tool_origin: tool}
        return tools_mapping

    def _prepare_system_prompt(self) -> str:
        """
        Create the complete system prompt by combining the base prompt with tool descriptions.

        This method takes the agent's base system prompt and adds descriptions of all
        available tools so the agent knows what it can use.

        Returns:
            str: The complete system prompt ready for the LLM
        """  # noqa
        # Get a formatted string representation of all available tools
        tools_description = ToolHelper.get_tools_string_representation(tools=self.tools)

        # Combine the base prompt with tool descriptions
        full_system_prompt = f"{self.system_prompt}\n\n{tools_description}"
        return full_system_prompt

    def _initialize_llm_provider(self, system_prompt: str) -> None:
        """
        Set up the LLM provider with our configuration.

        This prepares the LLM with the system prompt and other necessary settings
        so it's ready to generate responses.

        Args:
            system_prompt (str): The complete system prompt to use
        """
        self.llm_provider.init(
            model=self.llm_provider.model,
            system_prompt=system_prompt,
            api_key=self.llm_provider.api_key,
        )
