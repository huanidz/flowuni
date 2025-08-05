# backend/schemas/resolvers.py
from typing import Dict, Literal, Optional, Self

from pydantic import Field, model_validator

from backend.src.nodes.handles.resolvers.BaseResolver import BaseResolver


class ConditionalResolver(BaseResolver):
    type: Literal["conditional"] = "conditional"
    field_id: str = Field(
        ...,
        description="Field to watch for changes (e.g., 'provider')",
        example="provider",
    )
    cases: Dict[str, BaseResolver] = Field(
        ...,
        description="Map field values to resolver configs",
        example={
            "google": {"type": "static", "options": [...]},
            "openai": {"type": "http", "url": "..."},
        },
    )
    default_resolver: Optional[BaseResolver] = Field(
        default=None, description="Fallback resolver when no case matches"
    )

    @model_validator(mode="after")
    def ensure_dependencies(self) -> Self:
        """Auto-add watched field to dependencies"""
        if self.field_id not in self.depends_on:
            self.depends_on = [self.field_id] + self.depends_on
        return self
