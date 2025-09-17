from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional

from pydantic import BaseModel
from src.nodes.handles.resolvers.types import Resolver


class InputHandleTypeBase(BaseModel, ABC):
    """Base class for all input handle types"""

    # === Dynamic resolution support ===
    dynamic: bool = False
    resolver: Optional[str] = None  # Server resolver
    client_resolver: Optional[Resolver] = (
        None  # Client resolver (Code will be run at client)
    )
    load_on_init: bool = False
    reload_on_change: bool = False
    hidden: bool = False
    hide_input_field: bool = False  # Hide the input field in the node UI

    class Config:
        arbitrary_types_allowed = True

    # === Optional dynamic resolution hook ===
    def resolve(self, node_instance, inputs: Dict, parameters: Dict) -> Optional[List]:
        """
        Called when frontend requests resolution.
        Only used if dynamic=True and resolver is set.
        """
        if not self.dynamic or not self.resolver:
            return None

        resolver_fn = getattr(node_instance, self.resolver, None)
        if not callable(resolver_fn):
            raise ValueError(
                f"Resolver method '{self.resolver}' not found on node {node_instance}"
            )

        return resolver_fn(inputs, parameters)

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
