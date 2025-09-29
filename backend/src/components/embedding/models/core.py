from typing import List

from pydantic import BaseModel


class EmbeddingInput(BaseModel):
    text: str

    class Config:
        arbitrary_types_allowed = True


class EmbeddingResponse(BaseModel):
    embeddings: List[float]

    class Config:
        arbitrary_types_allowed = True
