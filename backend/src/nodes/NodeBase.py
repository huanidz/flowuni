# node_base.py
import json
from abc import ABC, abstractmethod
from typing import Any, Dict, Type, Optional, List

from pydantic import BaseModel


class ParameterSpec(BaseModel):
    """Describe a single node‑parameter: its type, default value, and description."""
    name: str
    type: Type
    value: Any
    default: Any
    description: str = ""

class NodeInput(BaseModel):
    """Describe a single node‑input: its type, default value, and description."""
    name: str
    type: Type
    value: Optional[Any] = None
    default: Optional[Any] = None
    description: str = ""
    required: bool = False

class NodeOutput(BaseModel):
    """Describe a single node‑output: its type, default value, and description."""
    name: str
    type: Type
    value: Optional[Any] = None
    default: Optional[Any] = None
    description: str = ""

class NodeSpec(BaseModel):
    name: str
    description: str
    inputs: List[NodeInput]
    outputs: List[NodeOutput]
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
        - inputs  (list of NodeInput objects)
        - outputs (list of NodeOutput objects)
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
        
        # Serialize inputs (now a list of NodeInput objects)
        serialized_inputs = []
        for input_spec in self.spec.inputs:
            serialized_inputs.append({
                "name": input_spec.name,
                "type": _serialize_type(input_spec.type),
                "value": input_spec.value,
                "default": input_spec.default,
                "description": input_spec.description,
                "required": input_spec.required
            })
        raw["inputs"] = serialized_inputs

        # Serialize outputs (now a list of NodeOutput objects)
        serialized_outputs = []
        for output_spec in self.spec.outputs:
            serialized_outputs.append({
                "name": output_spec.name,
                "type": _serialize_type(output_spec.type),
                "value": input_spec.value,
                "default": output_spec.default,
                "description": output_spec.description
            })
        raw["outputs"] = serialized_outputs

        # Rebuild parameters into a JSON‑safe form (unchanged from before)
        params = {}
        for name, p in self.spec.parameters.items():
            params[name] = {
                "name": p.name,
                "type": _serialize_type(p.type),
                "value": input_spec.value,
                "default": p.default,
                "description": p.description,
            }
        raw["parameters"] = params

        return raw

    def get_spec_json_str(self) -> str:
        """Pretty‑print the above dict as JSON."""
        return json.dumps(self.get_spec_json(), indent=2)