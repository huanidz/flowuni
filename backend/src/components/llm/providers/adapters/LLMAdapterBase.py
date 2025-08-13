from abc import ABC, abstractmethod
from typing import List, Optional, Type, Union

from instructor import Instructor
from pydantic import BaseModel
from src.components.llm.models.core import (
    ChatMessage,
    ChatResponse,
    GenerationParams,
)

# === LLMAdapterBase ===


class LLMAdapterBase(ABC):
    @abstractmethod
    def __init__(self) -> None:
        pass

    @abstractmethod
    def init(self, model: str, system_prompt: str = "", api_key: Optional[str] = None):
        pass

    @abstractmethod
    def chat_completion(
        self,
        messages: Union[List[ChatMessage], str],
        stream: bool = False,
        generation_parameters: GenerationParams = {},
    ) -> ChatResponse:
        pass

    @abstractmethod
    def structured_completion(
        self,
        messages: List[ChatMessage],
        output_schema: Type[BaseModel] = None,
    ) -> Type[BaseModel]:
        pass

    @abstractmethod
    def get_client(self) -> Instructor:
        raise NotImplementedError("Subclass must implement this method")


class LLMAdapter(LLMAdapterBase):
    def __init__(self) -> None:
        pass

    def init(
        self, model: str = "", system_prompt: str = "", api_key: Optional[str] = None
    ):
        self.model = model
        self.system_prompt = system_prompt
        self.api_key = api_key

    def chat_completion(
        self,
        messages: Union[List[ChatMessage], str],
        stream: bool = False,
        generation_parameters: GenerationParams = {},
    ) -> ChatResponse:
        raise NotImplementedError("Subclass must implement this method")

    def structured_completion(
        self,
        messages: List[ChatMessage],
        output_schema: Type[BaseModel] = None,
    ) -> Type[BaseModel]:
        raise NotImplementedError("Subclass must implement this method")

    def get_client(self) -> Instructor:
        raise NotImplementedError("Subclass must implement this method")
