from __future__ import annotations

from typing import TYPE_CHECKING, List, Optional

from loguru import logger
from src.components.llm.models.core import ChatMessage, GenerationParams
from src.components.llm.providers.adapters.LLMProviderInterface import LLMProviderBase

if TYPE_CHECKING:
    import instructor
    from openai import OpenAI


class OpenRouterRole:
    SYSTEM = "system"
    ASSISTANT = "assistant"
    USER = "user"


class OpenRouterProvider(LLMProviderBase):
    """
    OpenRouter provider adapter for LLM integration.

    This adapter provides a clean interface to interact with OpenRouter models
    through the instructor library for structured outputs.
    """

    def init(
        self,
        model: str = "",
        system_prompt: str = "",
        api_key: Optional[str] = None,
    ) -> None:
        """
        Initialize the OpenRouter provider adapter.

        Args:
            model: The model name to use (e.g., "anthropic/claude-3-opus")
            system_prompt: System prompt to include in conversations
            api_key: OpenRouter API key for authentication
        """
        super().init(model, system_prompt, api_key)

        self.roles = OpenRouterRole

        self._client: Optional[instructor.Instructor] = None

        logger.info(f"Initialized OpenRouterProvider with model: {model}")

    def get_client(self) -> instructor.Instructor:
        """
        Get the instructor client for OpenRouter.

        Returns:
            Instructor client configured for OpenRouter

        Raises:
            ValueError: If client cannot be initialized
        """
        if self._client is None:
            try:
                import instructor
                from openai import OpenAI

                model_client = OpenAI(
                    api_key=self.api_key,
                    base_url="https://openrouter.ai/api/v1",
                )

                self._client = instructor.from_openai(
                    client=model_client,
                    mode=instructor.Mode.JSON,
                )

                logger.debug("Successfully initialized OpenRouter client")

            except Exception as e:
                logger.error(f"Failed to initialize OpenRouter client: {e}")
                raise ValueError(f"Failed to initialize OpenRouter client: {e}")

        return self._client

    def structured_completion(self, messages: List[ChatMessage], output_schema):
        llm_client: instructor.Instructor = self.get_client()

        # Fix roles in messages
        messages = [self.role_fix(msg) for msg in messages]

        constructed_messages = []

        constructed_messages.append(
            {
                "role": "system",
                "content": self.system_prompt,
            }
        )

        for message in messages:
            message_item = {"role": message.role, "content": message.content}
            constructed_messages.append(message_item)

        structured_response = llm_client.chat.completions.create(
            model=self.model,
            messages=constructed_messages,
            response_model=output_schema,
        )

        return structured_response

    def chat_completion(
        self,
        messages: List[ChatMessage],
        stream: bool = False,
        generation_parameters: GenerationParams = None,
    ):
        """
        Perform a chat completion with the OpenRouter model.

        Args:
            messages: List of chat messages
            stream: Whether to stream the response
            generation_parameters: Parameters for generation

        Returns:
            ChatResponse object with the generated content
        """
        if generation_parameters is None:
            generation_parameters = GenerationParams()

        llm_client: instructor.Instructor = self.get_client()

        # Fix roles in messages
        messages = [self.role_fix(msg) for msg in messages]

        constructed_messages = []

        constructed_messages.append(
            {
                "role": "system",
                "content": self.system_prompt,
            }
        )

        for message in messages:
            message_item = {"role": message.role, "content": message.content}
            constructed_messages.append(message_item)

        # Build generation parameters
        gen_params = {
            "temperature": generation_parameters.temperature,
            "max_tokens": generation_parameters.max_tokens,
            "top_p": generation_parameters.top_p,
        }

        response = llm_client.chat.completions.create(
            model=self.model,
            messages=constructed_messages,
            **gen_params,
            stream=stream,
        )

        if stream:
            return response
        else:
            from src.components.llm.models.core import ChatResponse

            return ChatResponse(content=response.choices[0].message.content)

    def role_fix(self, chat_message: ChatMessage) -> ChatMessage:
        """
        Fix the role of a chat message to match OpenRouter's expected roles.

        Args:
            chat_message: The chat message to fix

        Returns:
            The chat message with the corrected role
        """
        if chat_message.role == "assistant":
            chat_message.role = self.roles.ASSISTANT
        elif chat_message.role == "model":
            chat_message.role = self.roles.ASSISTANT
        elif chat_message.role == "user":
            chat_message.role = self.roles.USER
        elif chat_message.role == "system":
            chat_message.role = self.roles.SYSTEM
        else:
            logger.warning(f"Unknown role '{chat_message.role}', defaulting to 'user'")
            chat_message.role = self.roles.USER
        return chat_message
