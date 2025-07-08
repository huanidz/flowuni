from enum import Enum
from typing import Type

class TextFieldInputHandle(Type):
    text: str

class HandleType(Enum):
    INPUT = str
    TEXT_FIELD_INPUT = TextFieldInputHandle