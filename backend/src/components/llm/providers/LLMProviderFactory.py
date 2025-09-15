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

        else:
            raise ValueError(f"Unknown provider: {provider_name}")
