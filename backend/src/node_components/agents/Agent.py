from instructor import Instructor
from .Agent import Agent, AgentSettings

from .messaging.AgentMessage import AgentMessage
from .prompts.GENERIC_DEFAULT import GENERIC_DEFAULT_PROMPTS
from src.configs.GenConfig import GenConfig

from src.node_components.agents.schemas.AgentOutputSchema import AgentOutputSchema

from src.helpers.MessageConstructor import MessageConstructor

from loguru import logger

from typing import List, Dict, Generator

from uuid import uuid4

class LawAgent(Agent):
    def __init__(self, 
                 agent_name: str = "Agent", 
                 profile: str = GENERIC_DEFAULT_PROMPTS.PROFILE):
        super().__init__()

        self.settings = AgentSettings(
            agent_id=str(uuid4()),
            agent_name="Law Agent",
            agent_profile=GENERIC_DEFAULT_PROMPTS.PROFILE,
        )

        self.max_iteration = 6
    
    def process_message(self, message: AgentMessage) -> AgentMessage:

        llm_client: Instructor = self.get_llm_client()

        completion_inputs = MessageConstructor.construct_completion_inputs(chat_history=message.metadata["chat_history"], new_content=message.content)

        for i in range(self.max_iteration):

            # logger.info(f"🔴Completion_inputs STEP {i}: {completion_inputs}")

            resp = llm_client.create(
                messages=completion_inputs,
                response_model=AgentOutputSchema,
                generation_config=GenConfig.HIGH_DETERMINISTIC,
                max_retries=3,
            )
            logger.info(f"==>> resp: {resp.model_dump_json(indent=4)}")

            if not resp.tool_useds:
                logger.info("No tool used. Process message done.")
                agent_response_message = AgentMessage(
                    content=resp.response,
                )
                return agent_response_message   

            completion_inputs.append(
                {"role": "assistant", "content": resp.response}
            )

            tool_results_in_str = self.process_tools(tool_useds=resp.tool_useds)

            completion_inputs.append(
                {
                    "role": "user", 
                    "content": tool_results_in_str
                }
            )

        logger.warning(f"Maximum iteration {self.max_iteration} reached.")
        agent_response_message = self.handle_exceed_max_iteration(current_completion_inputs=completion_inputs)

        return agent_response_message

    def process_message_generator(self, message: AgentMessage) -> Generator[AgentMessage, None, None]:
        """
        Processes a message and yields the generated response.
        
        Args:
            message (AgentMessage): The message to process.
        
        Yields:
            AgentMessage: The generated response.
        """
        llm_client: Instructor = self.get_llm_client()

        multimodal_contents = self.prepare_multimodal_contents(message=message)
        if multimodal_contents and not message.content:
            message.content = " " # Must not be empty

        completion_inputs = MessageConstructor.construct_completion_inputs(
            chat_history=message.metadata["chat_history"], 
            new_content=message.content,
            multimodal_contents=multimodal_contents
        )

        for i in range(self.max_iteration):

            resp = llm_client.create(
                messages=completion_inputs,
                response_model=AgentOutputSchema,
                generation_config=GenConfig.HIGH_DETERMINISTIC,
                max_retries=3,
            )
            logger.info(f"==>> resp: {resp.model_dump_json(indent=4)}")

            agent_response_message = AgentMessage(
                content=resp.final_response,
            )
            
            yield agent_response_message

            if not resp.planned_tool_calls:
                break

            completion_inputs.append(
                {"role": "assistant", "content": resp.final_response}
            )

            tool_used_str = '\n'.join([tool_used._to_llm_friendly() for tool_used in resp.planned_tool_calls])
            tool_results_in_str = self.process_tools(tool_useds=resp.planned_tool_calls)

            completion_inputs.append(
                {"role": "user", "content": tool_used_str + "\n" + tool_results_in_str}
            )

        else:
            # Handle max iteration case
            agent_response_message = self.handle_exceed_max_iteration(
                current_completion_inputs=completion_inputs
            )
            yield agent_response_message

    def handle_exceed_max_iteration(self, current_completion_inputs: List[Dict[str, str]]) -> AgentMessage:

        exceed_system_prompt = self._construct_system_prompt() + "\n" + GENERIC_DEFAULT_PROMPTS.EXCEED_MAX_ITERATION

        llm_client: Instructor = self.get_llm_client(custom_system_prompt=exceed_system_prompt)

        resp = llm_client.create(
            messages=current_completion_inputs,
            response_model=AgentOutputSchema,
            generation_config=GenConfig.HIGH_DETERMINISTIC,
            max_retries=3,
        )

        logger.info(f"==>> exceed resp: {resp.model_dump_json(indent=4)}")

        agent_response_message = AgentMessage(
            content=resp.final_response,
        )

        return agent_response_message
