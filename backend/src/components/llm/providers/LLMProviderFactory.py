from src.components.llm.providers.adapters.LLMProviderInterface import LLMProviderBase
from src.components.llm.providers.LLMProviderConsts import LLMProviderName


class LLMProviderFactory:
    def __init__(self):
        pass

    @staticmethod
    def get_provider(provider_name: str) -> LLMProviderBase:
        if provider_name == LLMProviderName.GOOGLE_GEMINI:
            from src.components.llm.providers.adapters import (
                GoogleGeminiProvider,
            )

            return GoogleGeminiProvider()
        elif provider_name == LLMProviderName.OPENROUTER:
            from src.components.llm.providers.adapters import OpenRouterProvider

            return OpenRouterProvider()
        elif provider_name == LLMProviderName.OPEN_AI:
            from src.components.llm.providers.adapters import OpenAIProvider

            return OpenAIProvider()

        else:
            raise ValueError(f"Unknown provider: {provider_name}")
