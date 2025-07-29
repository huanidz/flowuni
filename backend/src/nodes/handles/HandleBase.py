from abc import ABC, abstractmethod
from typing import Any, Dict

from pydantic import BaseModel


class HandleTypeBase(BaseModel, ABC):
    """Base class for all input handle types"""

    @abstractmethod
    def get_type_name(self) -> str:
        """Return the type name for serialization"""
        pass

    @abstractmethod
    def validate_value(self, value: Any) -> bool:
        """Validate if a value is acceptable for this handle type"""
        pass

    @abstractmethod
    def get_default_value(self) -> Any:
        """Return the default value for this handle type"""
        pass

    @abstractmethod
    def to_json_schema(self) -> Dict[str, Any]:
        """Return JSON schema representation for frontend"""
        pass
