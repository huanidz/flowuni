"""
Agent.py

This module defines the base class for LLM-based agents. It provides the foundational structure
and methods that can be extended or overridden by specific agent implementations.
"""  # noqa

from abc import ABC
from typing import Any, Dict, List, Optional

from loguru import logger
from src.components.llm.models.core import ChatMessage, ChatResponse
from src.components.llm.providers.adapters.LLMProviderInterface import LLMProviderBase
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
        llm_provider (LLMProviderBase): The LLM provider adapter for handling completions
        system_prompt (str): The system prompt for the agent
        tools (List[ToolDataParser]): List of available tools for the agent
        tools_map (Dict[str, Dict[str, ToolDataParser]]): Mapping of tool names to tool parsers
        max_loop_count (int): Maximum number of agent planning/execution loops before stopping
    """  # noqa

    def __init__(
        self,
        llm_provider: LLMProviderBase,
        system_prompt: str = "",
        tools: Optional[List[ToolDataParser]] = None,
        max_loop_count: int = 3,  # NEW
    ) -> None:
        """
        Initialize the Agent with the given configuration.

        Args:
            llm_provider (LLMProviderBase): The LLM provider adapter
            system_prompt (str, optional): The system prompt. Defaults to "".
            tools (List[ToolDataParser], optional): List of tools. Defaults to None.
            max_loop_count (int, optional): Maximum number of plan/act loops before we force finalization.
                Defaults to 3.
        """
        self.llm_provider = llm_provider
        self.system_prompt = system_prompt
        self.tools = tools or []
        self.tools_map = self._build_tools_map()
        self.max_loop_count = max_loop_count  # NEW

    def chat(
        self,
        message: ChatMessage,
        prev_histories: Optional[List[ChatMessage]] = None,
        streaming: bool = False,
        max_workers: Optional[int] = None,
    ) -> ChatResponse:
        # Setup the conversation
        agent_response_schema, chat_messages = self._setup_agent_conversation(
            message=message, prev_histories=prev_histories
        )

        # Initial plan
        agent_response = self.llm_provider.structured_completion(
            messages=chat_messages, output_schema=agent_response_schema
        )
        logger.info(f"Agent Response: {agent_response.model_dump_json(indent=2)}")
        loop_counter = 0
        self._append_loop_trace(
            chat_messages, agent_response, loop_counter, phase="plan"
        )

        # Plan/Act loop
        while True:
            logger.info(f"<><><> Chat messages: {chat_messages}")

            # Execute tools if any are planned for this iteration
            if getattr(agent_response, "planned_tool_calls", None):
                agent_response = self._handle_tool_execution(
                    agent_response, chat_messages, agent_response_schema
                )
                logger.info(
                    f"🔁 Post-tool LLM response: {agent_response.model_dump_json(indent=2)}"
                )
                # Snapshot after tools
                self._append_loop_trace(
                    chat_messages, agent_response, loop_counter, phase="post-tools"
                )

            # Read the stop/continue signal (default to FINALIZE if missing)
            next_action = getattr(agent_response, "next_action", "FINALIZE")
            logger.info(f"⛳ next_action={next_action}, loop={loop_counter}")

            if next_action == "FINALIZE":
                self._append_loop_trace(
                    chat_messages,
                    agent_response,
                    loop_counter,
                    phase="stop",
                    note="finalize",
                )
                break

            loop_counter += 1
            if loop_counter >= self.max_loop_count:
                logger.info(
                    f"⏹️ Reached max_loop_count ({self.max_loop_count}). Forcing finalize."
                )
                self._append_loop_trace(
                    chat_messages,
                    agent_response,
                    loop_counter,
                    phase="stop",
                    note=f"max_loop_count={self.max_loop_count}",
                )
                break

            if next_action == "RETRY":
                # Record the choice to retry before asking for a new plan
                self._append_loop_trace(
                    chat_messages,
                    agent_response,
                    loop_counter,
                    phase="retry",
                    note="retry requested",
                )
                agent_response = self.llm_provider.structured_completion(
                    messages=chat_messages, output_schema=agent_response_schema
                )
                logger.info(
                    f"🔂 Retry-step LLM response: {agent_response.model_dump_json(indent=2)}"
                )
                # Capture the new plan after retry decision
                self._append_loop_trace(
                    chat_messages,
                    agent_response,
                    loop_counter,
                    phase="plan",
                    note="post-retry plan",
                )
                continue

            # Default path (CONTINUE without explicit retry): ask the LLM for next step
            agent_response = self.llm_provider.structured_completion(
                messages=chat_messages, output_schema=agent_response_schema
            )
            logger.info(
                f"🔂 Next-step LLM response: {agent_response.model_dump_json(indent=2)}"
            )
            self._append_loop_trace(
                chat_messages,
                agent_response,
                loop_counter,
                phase="plan",
                note="continued planning",
            )

        logger.info("💬 Returning final response")
        return ChatResponse(content=agent_response.final_response)

    def chat_structured(
        self,
        message: ChatMessage,
        output_schema,
        prev_histories: Optional[List[ChatMessage]] = None,
    ) -> any:
        """
        Process a message and return a structured response.

        Args:
            message (ChatMessage): The message to process
            output_schema: The Pydantic model/schema for structured output
            prev_histories (List[ChatMessage], optional): Previous chat histories. Defaults to None.
        Returns:
            any: The structured response as per the output schema
        """  # noqa

        # Setup the conversation
        _, chat_messages = self._setup_agent_conversation(
            message=message, prev_histories=prev_histories
        )

        # Get the structured response
        structured_response = self.llm_provider.structured_completion(
            messages=chat_messages, output_schema=output_schema
        )
        logger.info(
            f"Structured Response: {structured_response.model_dump_json(indent=2)}"
        )

        return structured_response

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

    def _setup_agent_conversation(
        self, message: ChatMessage, prev_histories: List[ChatMessage] = []
    ) -> tuple:
        """
        Set up the agent for conversation by preparing system prompt and response schema.

        Args:
            message (ChatMessage): The initial message to process

        Returns:
            tuple: (agent_response_schema, chat_messages list)
        """  # noqa
        # Step 1: Prepare the system prompt with available tools
        system_prompt = self._prepare_system_prompt()
        logger.info(f"System Prompt: {system_prompt}")

        # Step 2: Initialize the LLM provider with our system prompt
        self._initialize_llm_provider(system_prompt)

        # Step 3: Configure agent capabilities
        enable_reasoning = True
        enable_tool_use = True

        # Step 4: Create the response schema based on our configuration
        agent_response_schema = (
            PydanticChatSchemaConstructor.create_agent_response_model(
                enable_reasoning=enable_reasoning, enable_tool_use=enable_tool_use
            )
        )

        # Step 5: Start our conversation with the initial message
        if prev_histories:
            chat_messages = prev_histories + [message]
        else:
            chat_messages = [message]

        return agent_response_schema, chat_messages

    def _execute_single_tool(self, tool_call, chat_messages: List[ChatMessage]):
        """
        Execute a single tool call and return the result.

        Args:
            tool_call: The tool call to execute
            chat_messages: The conversation history to update

        Returns:
            The result of the tool execution
        """
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
            logger.error(f"❌ Tool '{tool_call_name}' not found in available tools")
            return None

        # Get the tool configuration
        tool_origin_parser_pair = self.tools_map[tool_call_name]
        origin_tool_name, tool_parser = next(iter(tool_origin_parser_pair.items()))
        logger.info(f"✅ Found tool: {origin_tool_name}")

        # Create an instance of the node that will execute our tool
        node_registry = NodeRegistry()
        node_instance = node_registry.create_node_instance(name=origin_tool_name)

        if not node_instance:
            logger.error(f"❌ Could not create node instance for {origin_tool_name}")
            raise ValueError(f"Node {origin_tool_name} not found in registry")

        # Execute the tool based on whether it has a schema or not
        if tool_parser.tool_schema:
            # Tool needs the LLM to provide structured input
            logger.info("🧠 Tool requires LLM to generate structured input")

            tool_schema_model = PydanticSchemaConverter.load_from_dict(
                tool_parser.tool_schema
            )
            logger.info(f"📋 Tool Schema: {tool_schema_model.model_json_schema()}")

            tool_call_response = self.llm_provider.structured_completion(
                messages=chat_messages, output_schema=tool_schema_model
            )
            logger.info(
                f"🎯 LLM tool inputs: {tool_call_response.model_dump_json(indent=2)}"
            )

            processed_result = node_instance.process_tool(
                inputs_values=tool_parser.input_values,
                parameter_values=tool_parser.parameter_values,
                tool_inputs=tool_call_response.model_dump(),
            )
        else:
            # Tool can run with pre-configured parameters
            logger.info("⚡ Tool can run directly with existing parameters")
            processed_result = node_instance.process_tool(
                inputs_values=tool_parser.input_values,
                parameter_values=tool_parser.parameter_values,
                tool_inputs={},
            )

        logger.info(f"✨ Tool execution completed with result: {processed_result}")
        return processed_result

    def _handle_tool_execution(
        self, agent_response, chat_messages: List[ChatMessage], agent_response_schema
    ):
        logger.info(
            f"Agent wants to execute {len(agent_response.planned_tool_calls)} tool(s)"
        )

        all_tool_results = []

        for tool_call in agent_response.planned_tool_calls:
            processed_result = self._execute_single_tool(tool_call, chat_messages)

            if processed_result is None:
                continue

            # Collect results for later aggregation
            all_tool_results.append(
                {
                    "tool_name": tool_call.tool_name,
                    "result": processed_result,
                }
            )

            # Append tool result into the conversation (better role assignment)
            tool_result_message = (
                f"Tool '{tool_call.tool_name}' executed with result: {processed_result}"
            )
            chat_messages.append(
                ChatMessage(
                    role=self.llm_provider.roles.USER,  # instead of USER
                    content=tool_result_message,
                )
            )

        if not all_tool_results:
            fallback_msg = ChatMessage(
                role=self.llm_provider.roles.ASSISTANT,
                content="I couldn’t execute any of the requested tools. Some error occurred. Please try again.",
            )
            chat_messages.append(fallback_msg)
            return self.llm_provider.structured_completion(
                messages=chat_messages, output_schema=agent_response_schema
            )

        # Once all tool calls are executed, ask the LLM for a follow-up structured response
        agent_response = self.llm_provider.structured_completion(
            messages=chat_messages, output_schema=agent_response_schema
        )

        return agent_response

    def _summarize_planned_tools(self, agent_response: Any) -> str:
        tools = getattr(agent_response, "planned_tool_calls", None) or []
        names = []
        for t in tools:
            # Support both dict-like and object-like access
            name = getattr(t, "tool_name", None)
            if not name and isinstance(t, dict):
                name = t.get("tool_name")
            if name:
                names.append(name)
        return ", ".join(names) if names else "(none)"

    def _append_loop_trace(
        self,
        chat_messages: List[ChatMessage],
        agent_response: Any,
        loop_counter: int,
        phase: str,
        note: Optional[str] = None,
    ) -> None:
        """
        Append a compact loop-state snapshot so the LLM sees in-between decisions.
        phase ∈ {"plan", "post-tools", "retry", "stop"}
        """
        reasoning = getattr(agent_response, "reasoning", "")
        next_action = getattr(agent_response, "next_action", "FINALIZE")
        tools_summary = self._summarize_planned_tools(agent_response)

        parts = [
            f"[loop:{loop_counter}]",
            f"[phase:{phase}]",
            f"[next_action:{next_action}]",
            f"[planned_tools:{tools_summary}]",
        ]
        if note:
            parts.append(f"[note:{note}]")
        header = " ".join(parts)

        # Keep it assistant-role so provider context stays consistent
        chat_messages.append(
            ChatMessage(
                role=self.llm_provider.roles.ASSISTANT,
                content=f"{header}\nReasoning: {reasoning}".strip(),
            )
        )
