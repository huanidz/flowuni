from typing import Any, List, Literal

from pydantic import Field

from backend.src.nodes.handles.resolvers.BaseResolver import BaseResolver


class StaticResolver(BaseResolver):
    type: Literal["static"] = "static"

    options: List[Any] = Field(
        ...,
        description="List of {value, label, [optional metadata]} objects",
        example=[
            {"value": "gpt-4", "label": "GPT-4", "cost": 30},
            {"value": "claude-2", "label": "Claude 2", "cost": 15},
        ],
    )
