from typing import List

from ...models.core import EmbeddingInput, EmbeddingResponse
from .EmbeddingProviderInterface import EmbeddingProviderBase


class OpenAIEmbeddingProvider(EmbeddingProviderBase):
    def __init__(self):
        super().__init__()
        self.client = None

    def init(self, model: str, api_key: str, **kwargs):
        """Initialize the OpenAI provider with model and API key."""
        super().init(model, api_key, **kwargs)
        try:
            import openai

            self.client = openai.OpenAI(api_key=api_key)
        except ImportError:
            raise ImportError(
                "OpenAI library is not installed. Please install it with: pip install openai"
            )

    def get_embeddings(self, text: str) -> List[float]:
        """Get embeddings for the given text using OpenAI."""
        if not self.client:
            raise ValueError("Provider not initialized. Call init() first.")

        response = self.client.embeddings.create(model=self.model, input=text)
        return response.data[0].embedding

    def get_batch_embeddings(self, texts: List[str]) -> List[List[float]]:
        """Get embeddings for a batch of texts using OpenAI."""
        if not self.client:
            raise ValueError("Provider not initialized. Call init() first.")

        response = self.client.embeddings.create(model=self.model, input=texts)
        return [data.embedding for data in response.data]
