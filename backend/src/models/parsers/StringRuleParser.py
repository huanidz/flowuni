from typing import Literal

from pydantic import BaseModel


class StringRuleParser(BaseModel):
    operation: Literal[
        "contains",
        "equals",
        "starts_with",
        "ends_with",
        "not_contains",
        "length_gt",
        "length_lt",
        "length_eq",
    ]
    value: str
