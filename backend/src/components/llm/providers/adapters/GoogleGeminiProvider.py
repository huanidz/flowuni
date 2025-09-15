from __future__ import annotations

from typing import TYPE_CHECKING, List, Optional

from loguru import logger
from src.components.llm.models.core import ChatMessage, GenerationParams
from src.components.llm.providers.adapters.LLMProviderInterface import LLMProviderBase

if TYPE_CHECKING:
    import instructor
    from google.genai import types


class GeminiRole:
    SYSTEM = "system"
    ASSISTANT = "model"
    USER = "user"


class GoogleGeminiProvider(LLMProviderBase):
    """
    Google Gemini provider adapter for LLM integration.

    This adapter provides a clean interface to interact with Google's Gemini models
    through the instructor library for structured outputs.
    """

    def init(
        self,
        model: str = "",
        system_prompt: str = "",
        api_key: Optional[str] = None,
    ) -> None:
        """
        Initialize the Google Gemini provider adapter.

        Args:
            model: The model name to use (e.g., "gemini-pro")
            system_prompt: System prompt to include in conversations
            api_key: Google API key for authentication
            max_retries: Maximum number of retry attempts for API calls
            timeout: Timeout for API calls in seconds
        """
        super().init(model, system_prompt, api_key)

        self.roles = GeminiRole

        self._client: Optional[instructor.Instructor] = None

        logger.info(f"Initialized GoogleGeminiProviderAdapter with model: {model}")

    def get_client(self) -> instructor.Instructor:
        """
        Get the instructor client for Google Gemini.

        Returns:
            Instructor client configured for Google Gemini

        Raises:
            ValueError: If client cannot be initialized
        """
        if self._client is None:
            try:
                import instructor
                from google import genai

                model_client = genai.Client(
                    api_key=self.api_key,
                )

                self._client = instructor.from_genai(
                    client=model_client,
                    mode=instructor.Mode.GENAI_STRUCTURED_OUTPUTS,
                )

                logger.debug("Successfully initialized Google Gemini client")

            except Exception as e:
                logger.error(f"Failed to initialize Google Gemini client: {e}")
                raise ValueError(f"Failed to initialize Google Gemini client: {e}")

        return self._client

    def structured_completion(self, messages: List[ChatMessage], output_schema):
        llm_client: instructor.Instructor = self.get_client()

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

        structured_response = llm_client.create(
            model=self.model,
            messages=constructed_messages,
            response_model=output_schema,
        )

        return structured_response

    def _build_generation_config(
        self, generation_parameters: GenerationParams
    ) -> types.GenerateContentConfig:
        """
        Build generation configuration from parameters.

        Args:
            generation_parameters: Generation parameters

        Returns:
            GenerateContentConfig object
        """
        config_dict = (
            generation_parameters
            if isinstance(generation_parameters, dict)
            else generation_parameters.model_dump()
        )

        # Map standard parameters to Gemini-specific parameters
        from google.genai import types

        thinking_config = types.ThinkingConfig(thinking_budget=0)

        logger.info(f"System Prompt: {self.system_prompt}")

        return types.GenerateContentConfig(
            temperature=config_dict.get("temperature", 0.7),
            top_k=config_dict.get("top_k", 40),
            top_p=config_dict.get("top_p", 0.95),
            max_output_tokens=config_dict.get("max_tokens", 512),
            presence_penalty=config_dict.get("presence_penalty", 0.0),
            frequency_penalty=config_dict.get("frequency_penalty", 1.1),
            system_instruction=self.system_prompt,
            thinking_config=thinking_config,
        )
