from __future__ import annotations

from typing import TYPE_CHECKING, Any, Dict, List, Optional, Union

from loguru import logger
from src.node_components.llm.models.core import (
    ChatMessage,
    ChatResponse,
    GenerationParams,
    LLMResponse,
    UsageMetrics,
)
from src.node_components.llm.providers.adapters.LLMAdapterBase import LLMAdapter

if TYPE_CHECKING:
    import instructor
    from google.genai import types


class GoogleGeminiProvider(LLMAdapter):
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
        self._validate_inputs(model, api_key)

        super().init(model, system_prompt, api_key)

        self._client: Optional[instructor.Instructor] = None

        logger.info(f"Initialized GoogleGeminiProviderAdapter with model: {model}")

    def _validate_inputs(self, model: str, api_key: Optional[str]) -> None:
        """Validate input parameters."""
        if not model or not isinstance(model, str):
            raise ValueError("Model name must be a non-empty string")

        if not api_key:
            raise ValueError("API key is required for Google Gemini provider")

        if not model.startswith("gemini-"):
            logger.warning(
                f"Model name '{model}' doesn't follow the typical 'gemini-' prefix pattern"
            )

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

    def _prepare_messages(
        self, messages: Union[List[ChatMessage], str]
    ) -> List[Dict[str, str]]:
        """
        Prepare messages for the API call.

        Args:
            messages: Messages to send (list of ChatMessage objects or string)

        Returns:
            List of message dictionaries formatted for the API
        """
        if isinstance(messages, str):
            logger.debug("Received string message, converting to user message")
            return [{"role": "user", "content": messages}]

        if not messages:
            logger.warning("Empty messages list provided")
            return []

        formatted_messages = []
        for message in messages:
            if not hasattr(message, "role") or not hasattr(message, "content"):
                logger.warning(f"Invalid message format: {message}")
                continue

            formatted_messages.append(
                {"role": message.role, "content": message.content}
            )

        # Add system prompt if provided and no system message exists
        if self.system_prompt and not any(
            msg["role"] == "system" for msg in formatted_messages
        ):
            formatted_messages.insert(
                0, {"role": "system", "content": self.system_prompt}
            )
            logger.debug("Added system prompt to messages")

        return formatted_messages

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

        return types.GenerateContentConfig(
            temperature=config_dict.get("temperature", 0.7),
            top_k=config_dict.get("top_k", 40),
            top_p=config_dict.get("top_p", 0.95),
            max_output_tokens=config_dict.get("max_tokens", 512),
            presence_penalty=config_dict.get("presence_penalty", 0.0),
            frequency_penalty=config_dict.get("frequency_penalty", 1.1),
            thinking_config=thinking_config,
        )

    def _extract_usage_metrics(self, response: Any) -> UsageMetrics:
        """
        Extract usage metrics from the response.

        Args:
            response: The response object from the API

        Returns:
            UsageMetrics object
        """
        try:
            # Gemini API usage metrics might be in different formats
            # This is a basic implementation - adjust based on actual response structure
            return UsageMetrics(
                prompt_tokens=getattr(response, "prompt_tokens", None),
                completion_tokens=getattr(response, "completion_tokens", None),
                total_tokens=getattr(response, "total_tokens", None),
            )
        except Exception as e:
            logger.warning(f"Failed to extract usage metrics: {e}")
            return UsageMetrics()

    def chat_completion(
        self,
        messages: Union[List[ChatMessage], str],
        stream: bool = False,
        generation_parameters: Union[GenerationParams, Dict[str, Any]] = None,
    ) -> ChatResponse:
        """
        Get chat completion from Google Gemini.

        Args:
            messages: Messages to send (list of ChatMessage objects or string)
            stream: Whether to stream the response (currently not supported)
            generation_parameters: Parameters for generation

        Returns:
            ChatResponse object with the generated content and usage metrics

        Raises:
            ValueError: If input validation fails
            RuntimeError: If API call fails
        """
        if stream:
            logger.warning("Streaming is not yet supported for Google Gemini provider")

        if generation_parameters is None:
            generation_parameters = GenerationParams()

        try:
            completion_messages = self._prepare_messages(messages)
            if not completion_messages:
                raise ValueError("No valid messages to process")

            llm_client = self.get_client()
            generation_config = self._build_generation_config(generation_parameters)

            logger.debug(
                f"Sending request to model {self.model} with {len(completion_messages)} messages"
            )

            resp = llm_client.messages.create(
                model=self.model,
                messages=completion_messages,
                response_model=LLMResponse,
                config=generation_config,
            )

            usage_metrics = self._extract_usage_metrics(resp)

            chat_response = ChatResponse(
                content=resp.response,
                usage=usage_metrics,
            )

            logger.info(f"Successfully received response from {self.model}")
            return chat_response

        except Exception as e:
            # Lazy import google exceptions
            from google.api_core import exceptions as google_exceptions

            if isinstance(e, google_exceptions.GoogleAPIError):
                logger.error(f"Google API error: {e}")
                raise RuntimeError(f"Google API error: {e}")
            logger.error(f"Google API error: {e}")
            raise RuntimeError(f"Google API error: {e}")

        except Exception as e:
            logger.error(f"Unexpected error in chat completion: {e}")
            raise RuntimeError(f"Unexpected error: {e}")
