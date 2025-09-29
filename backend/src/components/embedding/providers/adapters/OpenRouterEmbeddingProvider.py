from typing import List

from ...models.core import EmbeddingInput, EmbeddingResponse
from .EmbeddingProviderInterface import EmbeddingProviderBase


class OpenRouterEmbeddingProvider(EmbeddingProviderBase):
    def __init__(self):
        super().__init__()
        self.client = None

    def init(self, model: str, api_key: str, **kwargs):
        """Initialize the OpenRouter provider with model and API key."""
        super().init(model, api_key, **kwargs)
        try:
            import openai

            self.client = openai.OpenAI(
                api_key=api_key, base_url="https://openrouter.ai/api/v1"
            )
        except ImportError:
            raise ImportError(
                "OpenAI library is not installed. Please install it with: pip install openai"
            )

    def get_embeddings(self, input: EmbeddingInput) -> EmbeddingResponse:
        """Get embeddings for the given text using OpenRouter."""
        if not self.client:
            raise ValueError("Provider not initialized. Call init() first.")

        response = self.client.embeddings.create(model=self.model, input=input.text)
        return EmbeddingResponse(embeddings=response.data[0].embedding)

    def get_batch_embeddings(
        self, inputs: List[EmbeddingInput]
    ) -> List[EmbeddingResponse]:
        """Get embeddings for a batch of texts using OpenRouter."""
        if not self.client:
            raise ValueError("Provider not initialized. Call init() first.")

        texts = [input.text for input in inputs]
        response = self.client.embeddings.create(model=self.model, input=texts)
        return [EmbeddingResponse(embeddings=data.embedding) for data in response.data]
