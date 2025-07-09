# node_base.py
import json
from abc import ABC, abstractmethod
from typing import Any, Dict, Type, Optional, List

from pydantic import BaseModel

from src.schemas.flowbuilder.flow_graph_schemas import NodeData

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

    def get_input_map(self, node_data: NodeData) -> Dict[str, Any]:
        input_values = node_data.input_values or {}
        inputs = {}
        for input_spec in self.spec.inputs:
            val = input_values.get(input_spec.name, input_spec.default)
            if val is None and input_spec.required:
                raise ValueError(f"Missing required input: '{input_spec.name}'")
            inputs[input_spec.name] = val
        return inputs

    def get_parameter_map(self, node_data: NodeData) -> Dict[str, Any]:
        param_values = node_data.parameters or {}
        return {
            name: param_values.get(name, spec.default)
            for name, spec in self.spec.parameters.items()
        }

    def build_output_map(self, result: Any) -> Dict[str, Any]:
        outputs = self.spec.outputs
        if len(outputs) == 0:
            return {}

        if len(outputs) == 1:
            if not isinstance(result, dict):
                return {outputs[0].name: result}
            # Even if it's a dict, extract the value by name
            return {outputs[0].name: result.get(outputs[0].name)}

        if not isinstance(result, dict):
            raise ValueError("Multiple outputs require the result to be a dictionary.")

        declared = [o.name for o in outputs]
        missing = [name for name in declared if name not in result]
        if missing:
            raise ValueError(f"Missing output keys: {missing}")

        extra = set(result.keys()) - set(declared)
        if extra:
            raise ValueError(f"Unexpected output keys: {extra}")

        return {name: result[name] for name in declared}

    def run(self, node_data: NodeData) -> NodeData:
        inputs = self.get_input_map(node_data)
        parameters = self.get_parameter_map(node_data)

        result = self.process(inputs, parameters)
        output_values = self.build_output_map(result)

        return NodeData(
            label=node_data.label,
            node_type=node_data.node_type,
            input_values=output_values,
            parameters=node_data.parameters
        )

    @abstractmethod
    def process(self, inputs: Dict[str, Any], parameters: Dict[str, Any]) -> Any:
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