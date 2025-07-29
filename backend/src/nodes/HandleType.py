# Base handle type
from enum import Enum
from typing import Any, Dict, Type

# --- Define custom handle types here ---


class TextFieldInputHandle(Type):
    text: str


class DropdownInputHandle(Type):
    options: Dict[str, Any]
    value: str


# --- Wrap everything here for other to import ---
class HandleType(Enum):
    TEXT_FIELD_INPUT = TextFieldInputHandle
    DROPDOWN_INPUT = DropdownInputHandle
