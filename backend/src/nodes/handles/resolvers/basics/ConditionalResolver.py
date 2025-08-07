# Use string annotations to avoid runtime import loop
from typing import Any, Dict, Literal, Optional

from pydantic import Field
from src.nodes.handles.resolvers.BaseResolver import BaseResolver

# if TYPE_CHECKING:
#     from src.nodes.handles.resolvers.types import Resolver


class ConditionalResolver(BaseResolver):
    type: Literal["conditional"] = "conditional"
    field_id: str = Field(
        ...,
        description="Field to watch for changes (e.g., 'provider')",
        example="provider",
    )

    # This is a 'Any' type to avoid circular import
    # TODO: Improve this structure of this import-related type.
    """
    cases: Dict[str, Resolver] = Field() --> Error
    cases: Dict[str, "Resolver"] = Field() --> Error
    """
    cases: Dict[str, Any] = Field(
        ...,
        description="Map field values to resolver configs",
        example={
            "google": {"type": "static", "options": "..."},
            "openai": {"type": "http", "url": "..."},
        },
    )
    default_resolver: Optional[Any] = Field(
        default=None, description="Fallback resolver when no case matches"
    )

    # @model_validator(mode="after")
    # def ensure_dependencies(self) -> Self:
    #     """Auto-add watched field to dependencies"""
    #     if self.field_id not in self.depends_on:
    #         self.depends_on = [self.field_id] + self.depends_on
    #     return self
