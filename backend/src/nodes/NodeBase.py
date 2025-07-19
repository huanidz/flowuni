# node_base.py
import json
from abc import ABC, abstractmethod
from typing import Any, Dict, Type, Optional, List

from pydantic import BaseModel, Field

from src.schemas.flowbuilder.flow_graph_schemas import NodeData

from src.exceptions.node_exceptions import NodeValidationError

class ParameterSpec(BaseModel):
    """Specification for a node parameter with type, default value, and description."""
    name: str = Field(..., description="Parameter name")
    type: Type = Field(..., description="Expected parameter type")
    value: Any = Field(..., description="Current parameter value")
    default: Any = Field(..., description="Default parameter value")
    description: str = Field(default="", description="Parameter description")


class NodeInput(BaseModel):
    """Specification for a node input with validation and metadata."""
    name: str = Field(..., description="Input name")
    type: Type = Field(..., description="Expected input type")
    value: Optional[Any] = Field(default=None, description="Current input value")
    default: Optional[Any] = Field(default=None, description="Default input value")
    description: str = Field(default="", description="Input description")
    required: bool = Field(default=False, description="Whether input is required")


class NodeOutput(BaseModel):
    """Specification for a node output with type information and metadata."""
    name: str = Field(..., description="Output name")
    type: Type = Field(..., description="Expected output type")
    value: Optional[Any] = Field(default=None, description="Current output value")
    default: Optional[Any] = Field(default=None, description="Default output value")
    description: str = Field(default="", description="Output description")


class NodeSpec(BaseModel):
    """Complete specification for a node including inputs, outputs, and parameters."""
    name: str = Field(..., description="Node name")
    description: str = Field(..., description="Node description")
    inputs: List[NodeInput] = Field(default_factory=list, description="Node inputs")
    outputs: List[NodeOutput] = Field(default_factory=list, description="Node outputs")
    parameters: Dict[str, ParameterSpec] = Field(default_factory=dict, description="Node parameters")
    can_be_tool: bool = Field(default=False, description="Whether node can be used as a tool")

class Node(ABC):
    """Abstract base class for all nodes in the processing graph."""
    
    spec: NodeSpec

    def __init_subclass__(cls, **kwargs):
        """Validate node specification when subclass is created."""
        super().__init_subclass__(**kwargs)
        cls._validate_node_spec()

    @classmethod
    def _validate_node_spec(cls) -> None:
        """Validate that the node specification is properly defined."""
        spec = getattr(cls, "spec", None)
        if spec is None:
            raise NodeValidationError(f"{cls.__name__} must define a `spec` attribute")

        if spec.can_be_tool:
            cls._validate_tool_requirements(spec)

    @classmethod
    def _validate_tool_requirements(cls, spec: NodeSpec) -> None:
        """Validate requirements for nodes that can be used as tools."""
        if not spec.outputs:
            raise NodeValidationError(
                f"{cls.__name__} marked as tool but has no outputs"
            )
        if not spec.inputs and not spec.parameters:
            raise NodeValidationError(
                f"{cls.__name__} marked as tool but has no inputs or parameters"
            )

    def _extract_input_values(self, node_data: 'NodeData') -> Dict[str, Any]:
        """Extract and validate input values from node data."""
        input_values = node_data.input_values or {}
        extracted_inputs = {}
        
        for input_spec in self.spec.inputs:
            value = input_values.get(input_spec.name, input_spec.default)
            
            if value is None and input_spec.required:
                raise NodeValidationError(f"Missing required input: '{input_spec.name}'")
            
            extracted_inputs[input_spec.name] = value
            
        return extracted_inputs

    def _extract_parameter_values(self, node_data: 'NodeData') -> Dict[str, Any]:
        """Extract parameter values from node data with defaults."""
        param_values = node_data.parameters or {}
        return {
            name: param_values.get(name, spec.default)
            for name, spec in self.spec.parameters.items()
        }

    def _build_output_mapping(self, result: Any) -> Dict[str, Any]:
        """Convert processing result into properly mapped output values."""
        if not self.spec.outputs:
            return {}

        if len(self.spec.outputs) == 1:
            return self._handle_single_output(result)
        
        return self._handle_multiple_outputs(result)

    def _handle_single_output(self, result: Any) -> Dict[str, Any]:
        """Handle case where node has exactly one output."""
        output_name = self.spec.outputs[0].name
        
        if isinstance(result, dict):
            # If result is a dict, try to extract by output name, fallback to the dict itself
            return {output_name: result.get(output_name, result)}
        
        # For non-dict results, use the value directly
        return {output_name: result}

    def _handle_multiple_outputs(self, result: Any) -> Dict[str, Any]:
        """Handle case where node has multiple outputs."""
        if not isinstance(result, dict):
            raise NodeValidationError(
                "Multiple outputs require the result to be a dictionary"
            )

        declared_outputs = {output.name for output in self.spec.outputs}
        result_keys = set(result.keys())
        
        self._validate_output_completeness(declared_outputs, result_keys)
        
        return {name: result[name] for name in declared_outputs}

    def _validate_output_completeness(self, declared: set, actual: set) -> None:
        """Validate that all required outputs are present and no extra outputs exist."""
        missing = declared - actual
        if missing:
            raise NodeValidationError(f"Missing output keys: {sorted(missing)}")

        extra = actual - declared
        if extra:
            raise NodeValidationError(f"Unexpected output keys: {sorted(extra)}")

    @abstractmethod
    def process(self, inputs: Dict[str, Any], parameters: Dict[str, Any]) -> Any:
        """
        Process inputs and parameters to produce outputs.
        
        Args:
            inputs: Dictionary of input values
            parameters: Dictionary of parameter values
            
        Returns:
            Processing result (single value for single output, dict for multiple outputs)
        """
        pass

    def execute(self, node_data: 'NodeData') -> 'NodeData':
        """
        Execute the node with given data and return updated node data.
        
        Args:
            node_data: Input node data containing values and parameters
            
        Returns:
            Updated node data with processing results
        """
        inputs = self._extract_input_values(node_data)
        parameters = self._extract_parameter_values(node_data)
        
        result = self.process(inputs, parameters)
        output_values = self._build_output_mapping(result)
        
        return self._create_result_node_data(node_data, output_values)

    def _create_result_node_data(self, original: 'NodeData', outputs: Dict[str, Any]) -> 'NodeData':
        """Create result node data with outputs."""
        return NodeData(
            label=original.label,
            node_type=original.node_type,
            input_values=outputs,  # Outputs become inputs for next node
            parameters=original.parameters
        )

    # Deprecated methods for backwards compatibility
    def get_input_map(self, node_data: 'NodeData') -> Dict[str, Any]:
        """Deprecated: Use _extract_input_values instead."""
        return self._extract_input_values(node_data)

    def get_parameter_map(self, node_data: 'NodeData') -> Dict[str, Any]:
        """Deprecated: Use _extract_parameter_values instead."""
        return self._extract_parameter_values(node_data)

    def build_output_map(self, result: Any) -> Dict[str, Any]:
        """Deprecated: Use _build_output_mapping instead."""
        return self._build_output_mapping(result)

    def run(self, node_data: 'NodeData') -> 'NodeData':
        """Deprecated: Use execute instead."""
        return self.execute(node_data)

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
                "value": output_spec.value,
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