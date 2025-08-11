from abc import ABC, abstractmethod

from pydantic import BaseModel


class OutputHandleTypeBase(BaseModel, ABC):
    """Base class for all input handle types"""

    class Config:
        arbitrary_types_allowed = True

    @abstractmethod
    def get_type_name(self) -> str:
        """Return the type name for serialization"""
        pass
