from typing import Dict, Optional, Type

from src.nodes.handles.basics import (
    BooleanInputHandle,
    DropdownInputHandle,
    FileInputHandle,
    NumberInputHandle,
    SecretTextInputHandle,
    TextFieldInputHandle,
)
from src.nodes.handles.InputHandleBase import InputHandleTypeBase


class HandleTypeRegistry:
    """Registry for all available handle types"""

    _types: Dict[str, Type[InputHandleTypeBase]] = {
        "text_field": TextFieldInputHandle,
        "dropdown": DropdownInputHandle,
        "number": NumberInputHandle,
        "file": FileInputHandle,
        "boolean": BooleanInputHandle,
        "secret_text": SecretTextInputHandle,
    }

    @classmethod
    def register(cls, handle_type: Type[InputHandleTypeBase]) -> None:
        """Register a new handle type"""
        instance = handle_type()
        cls._types[instance.get_type_name()] = handle_type

    @classmethod
    def get_handle_type(cls, type_name: str) -> Optional[Type[InputHandleTypeBase]]:
        """Get handle type class by name"""
        return cls._types.get(type_name)

    @classmethod
    def create_handle(cls, type_name: str, **kwargs) -> Optional[InputHandleTypeBase]:
        """Create handle instance by type name"""
        handle_cls = cls.get_handle_type(type_name)
        if handle_cls:
            return handle_cls(**kwargs)
        return None

    @classmethod
    def get_all_types(cls) -> Dict[str, Type[InputHandleTypeBase]]:
        """Get all registered handle types"""
        return cls._types.copy()
