from abc import ABC, abstractmethod
from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    from src.models.alchemy.session.SessionChatHistoryModel import (
        SessionChatHistoryModel,
    )
    from src.models.parsers.SessionChatHistoryParser import SessionChatHistoryParser


class SqlModelSerializer(ABC):
    @abstractmethod
    @staticmethod
    def serialize(instance: Any) -> str:
        pass

    @abstractmethod
    @staticmethod
    def deserialize(json_str_data: str) -> Any:
        pass


class SessionChatHistoryModelSerializer(SqlModelSerializer):
    def serialize(instance: SessionChatHistoryModel) -> str:
        parser_data = SessionChatHistoryParser.model_validate(instance)
        return parser_data.model_dump_json()

    def deserialize(json_str_data: str) -> SessionChatHistoryParser:
        return SessionChatHistoryParser.model_validate_json(json_str_data)
