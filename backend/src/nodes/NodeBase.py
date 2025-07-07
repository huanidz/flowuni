# node_base.py
import json
from abc import ABC, abstractmethod
from typing import Any, Dict, Type

from pydantic import BaseModel


class ParameterSpec(BaseModel):
    """Describe a single node‑parameter: its type, default value, and description."""
    type: Type
    default: Any
    description: str = ""


class NodeSpec(BaseModel):
    name: str
    description: str
    inputs: Dict[str, Type]
    outputs: Dict[str, Type]
    parameters: Dict[str, ParameterSpec]


class Node(ABC):
    spec: NodeSpec

    @abstractmethod
    def run(self, **inputs) -> Any:
        ...

    def get_spec_json(self) -> Dict[str, Any]:
        """
        Return a JSON‑serializable dict describing:
         - name, description
         - inputs  (port → type name)
         - outputs (port → type name)
         - parameters (param → {type name, default, description})
        """
        def _serialize_type(t: Type) -> Any:
            # If it's a Pydantic model, embed its JSON schema:
            if isinstance(t, type) and issubclass(t, BaseModel):
                return {
                    "type": t.__name__,
                    "schema": t.model_json_schema()
                }
            # Otherwise just return the class name:
            return getattr(t, "__name__", str(t))

        raw = self.spec.model_dump()  # gives you a dict with raw types still in it
        # replace inputs/outputs with their stringified versions:
        raw["inputs"] = {k: _serialize_type(v) for k, v in self.spec.inputs.items()}
        raw["outputs"] = {k: _serialize_type(v) for k, v in self.spec.outputs.items()}

        # rebuild parameters into a JSON‑safe form:
        params = {}
        for name, p in self.spec.parameters.items():
            params[name] = {
                "type": _serialize_type(p.type),
                "default": p.default,
                "description": p.description,
            }
        raw["parameters"] = params

        return raw

    def get_spec_json_str(self) -> str:
        """Pretty‑print the above dict as JSON."""
        return json.dumps(self.get_spec_json(), indent=2)