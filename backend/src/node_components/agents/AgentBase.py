"""
Agent.py

This module defines the base class for LLM-based agents. It provides the foundational structure and methods
that can be extended or overridden by specific agent implementations.
"""

from messaging.AgentMessage import AgentMessage
from instructor import Instructor
from src.dependencies.inst_dependency import instructor_service
from src.configs.GenConfig import GenConfig
import json
from abc import ABC, abstractmethod
from typing import Dict, Any, List, Generator
from vertexai.generative_models import Part

from src.consts.basic_consts import METADATA_TYPE

from tools.ToolBase import BaseTool, ToolResult, ToolUsed, ToolParam
from src.schemas.chat_schemas import ChatWebhookRequestMetadata


from loguru import logger

class AgentSettings:
    """
    Settings for LLM-based agents.

    Attributes:
        agent_profile (str): System prompt that instructs the LLM how to behave.
        llm_endpoint (str): Endpoint for the LLM.
    """

    def __init__(
        self,
        agent_id: str = "",
        agent_name: str = "",
        agent_profile: str = None,
        agent_capabilities: str = None,
    ):
        self.agent_id = agent_id
        self.agent_name = agent_name
        self.agent_profile = agent_profile
        self.agent_capabilities = agent_capabilities


class Agent(ABC):
    """
    Base class for LLM-based agents.

    Attributes:
        settings (AgentSettings): Configuration settings for the agent.
    """

    def __init__(self, settings: AgentSettings = None):
        """
        Initializes the Agent with the given configuration and agent profile.

        Args:
            settings (AgentSettings, optional): Configuration settings. Defaults to None.

        """
        self.settings = settings or AgentSettings()

        # Token usage
        self.total_input_token_usage = 0
        self.total_output_token_usage = 0

        self.input_cost_per_token_in_usd = 7.5e-08
        self.output_cost_per_token_in_usd = 3e-07
        self.total_cost_in_usd = 0

        self.repositories = {}
        self.services = {}

        self.tools: Dict[str, BaseTool] = {}

    def register_repository(self, repository_name, repository):
        self.repositories[repository_name] = repository

    def register_service(self, service_name, service):
        self.services[service_name] = service

    def get_token_usage(self) -> Dict[str, Any]:
        token_usage = {
            "total_input_token_usage": self.total_input_token_usage,
            "total_output_token_usage": self.total_output_token_usage,
            "total_cost_in_usd": self.total_cost_in_usd,
        }
        return token_usage

    def get_llm_client(self, custom_system_prompt: str = None):
        llm_client: Instructor = instructor_service.get_client(
            model_name=GenConfig.SHARED_MODEL,
            system_instruction=self._construct_system_prompt() if not custom_system_prompt else custom_system_prompt,
        )

        return llm_client


    def prepare_multimodal_contents(self, message: AgentMessage) -> List[Part]:
        """
        Prepares metadata information for the LLM-based agent.

        Args:
            message (AgentMessage): The message to process.

        Returns:
            Dict[str, Any]: A dictionary containing metadata information.
        """
        metadata_items = message.metadata.get("request_metadata", [])
        multimodal_contents: List[Part] = []

        if not metadata_items:
            return multimodal_contents

        metadata_item: ChatWebhookRequestMetadata
        for metadata_item in metadata_items:
            
            if metadata_item.type == METADATA_TYPE.IMAGE:

                image_extension = metadata_item.path.split(".")[-1]

                uri = "https://image-2.piscale.com" + metadata_item.path

                multimodal_contents.append(
                    Part.from_uri(uri=uri, mime_type=f"image/{image_extension}")
                )

            elif metadata_item.type == METADATA_TYPE.AUDIO:

                audio_extension = metadata_item.path.split(".")[-1]

                uri = "https://file-2.piscale.com" + metadata_item.path

                multimodal_contents.append(
                    Part.from_uri(uri=uri, mime_type=f"audio/{audio_extension}")
                )

        return multimodal_contents

    @abstractmethod
    def process_message(self, message: AgentMessage) -> AgentMessage:
        """
        Processes a message.  This method should be overridden by subclasses.

        Args:
            message (AgentMessage): The message to process.
        """
        pass

    @abstractmethod
    def process_message_generator(self, message: AgentMessage) -> Generator[AgentMessage, None, None]:
        """
        Processes a message and yields the generated response.

        Args:
            message (AgentMessage): The message to process.

        Yields:
            AgentMessage: The generated response.
        """
        pass
    
    @abstractmethod
    def handle_exceed_max_iteration(self, llm_client: Instructor, current_completion_inputs: List[Dict[str, str]]) -> AgentMessage:
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
                logger.error(f"Tool '{tool_name}' not found in agent's registered tools.")
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

    # Constructing
    def _construct_system_prompt(self) -> str:
        """
        Constructs the system prompt for the agent.
        Returns the system prompt as a string.
        """

        system_prompt_template = self.settings.agent_profile

        if not system_prompt_template:
            logger.warning("AgentSettings.agent_profile is empty. Using default system prompt.")

        tools_description = "\n".join([
            f"- `{tool.name}`: {tool.description}\n  Parameters: {json.dumps(tool.parameters, indent=2)}"
            for tool in self.tools.values()
        ])

        system_prompt = system_prompt_template.replace(
            "[!!REPLACE_TOOL_PROMPT!!]", tools_description
        )

        # logger.debug(f"🟥Agent {self.settings.agent_name}'s system prompt:\n{system_prompt}")

        return system_prompt