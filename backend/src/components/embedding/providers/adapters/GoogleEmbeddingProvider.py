from typing import List

from ...models.core import EmbeddingInput, EmbeddingResponse
from .EmbeddingProviderInterface import EmbeddingProviderBase


class GoogleEmbeddingProvider(EmbeddingProviderBase):
    def __init__(self):
        super().__init__()
        self.client = None

    def init(self, model: str, api_key: str, **kwargs):
        """Initialize the Google provider with model and API key."""
        super().init(model, api_key, **kwargs)
        try:
            import google.generativeai as genai

            genai.configure(api_key=api_key)
            self.client = genai
        except ImportError:
            raise ImportError(
                "Google Generative AI library is not installed. Please install it with: pip install google-generativeai"
            )

    def get_embeddings(self, input: EmbeddingInput) -> EmbeddingResponse:
        """Get embeddings for the given text using Google."""
        if not self.client:
            raise ValueError("Provider not initialized. Call init() first.")

        result = self.client.embed_content(
            model=self.model, content=input.text, task_type="retrieval_document"
        )
        return EmbeddingResponse(embeddings=result["embedding"])

    def get_batch_embeddings(
        self, inputs: List[EmbeddingInput]
    ) -> List[EmbeddingResponse]:
        """Get embeddings for a batch of texts using Google."""
        if not self.client:
            raise ValueError("Provider not initialized. Call init() first.")

        responses = []
        for input in inputs:
            result = self.client.embed_content(
                model=self.model, content=input.text, task_type="retrieval_document"
            )
            responses.append(EmbeddingResponse(embeddings=result["embedding"]))
        return responses
