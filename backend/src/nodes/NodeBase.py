# node_base.py
import json
from abc import ABC, abstractmethod
from typing import Any, Dict, Optional, Type, Union, get_args

from pydantic import BaseModel
from src.exceptions.node_exceptions import NodeValidationError
from src.nodes.core.NodeInput import NodeInput
from src.nodes.core.NodeOutput import NodeOutput
from src.nodes.core.NodeSpec import NodeSpec
from src.nodes.handles.HandleBase import HandleTypeBase
from src.schemas.flowbuilder.flow_graph_schemas import NodeData
from src.schemas.nodes.node_schemas import (
    NodeInputSchema,
    NodeOutputSchema,
    NodeParameterSchema,
)


class Node(ABC):
    """Abstract base class for all nodes in the processing graph."""

    spec: NodeSpec

    # ============================================================================
    # CLASS SETUP AND VALIDATION
    # ============================================================================

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

    # ============================================================================
    # INPUT/OUTPUT HANDLING
    # ============================================================================

    def get_input_handle(self, input_name: str) -> Optional[Type[HandleTypeBase]]:
        """Get the handle type for a specific input."""
        input: NodeInput
        for input in self.spec.inputs:
            if input.name == input_name:
                return input.type
        return None

    def _extract_input_values(self, node_data: "NodeData") -> Dict[str, Any]:
        """Extract and validate input values from node data."""
        input_values = node_data.input_values or {}
        extracted_inputs = {}

        for input_spec in self.spec.inputs:
            value = input_values.get(input_spec.name, input_spec.default)

            if value is None and input_spec.required:
                raise NodeValidationError(
                    f"Missing required input: '{input_spec.name}'"
                )

            extracted_inputs[input_spec.name] = value

        return extracted_inputs

    def _extract_parameter_values(self, node_data: "NodeData") -> Dict[str, Any]:
        """Extract parameter values from node data with defaults."""
        param_values = node_data.parameter_values or {}
        return {
            name: param_values.get(name, spec.default)
            for name, spec in self.spec.parameters.items()
        }

    # ============================================================================
    # OUTPUT MAPPING AND VALIDATION
    # ============================================================================

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
            # If result is a dict, try to extract by output name,
            # fallback to the dict itself
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

    # ============================================================================
    # CORE EXECUTION
    # ============================================================================

    @abstractmethod
    def process(
        self, inputs_values: Dict[str, Any], parameter_values: Dict[str, Any]
    ) -> Any:
        """
        Process inputs_values and parameter_values to produce outputs.

        Args:
            inputs_values: Dictionary of input values
            parameter_values: Dictionary of parameter values

        Returns:
            Processing result
            (single value for single output, dict for multiple outputs)
        """
        pass

    def execute(self, node_data: "NodeData") -> "NodeData":
        """
        Execute the node with given data and return updated node data.

        Args:
            node_data: Input node data containing values and parameters

        Returns:
            Updated node data with processing results
        """
        input_values = self._extract_input_values(node_data)
        parameter_values = self._extract_parameter_values(node_data)

        result = self.process(input_values, parameter_values)
        output_values = self._build_output_mapping(result)

        return self._create_result_node_data(node_data, output_values)

    def _create_result_node_data(
        self, original: "NodeData", outputs: Dict[str, Any]
    ) -> "NodeData":
        """Create result node data with outputs."""
        return NodeData(
            label=original.label,
            node_type=original.node_type,
            input_values=original.input_values,
            output_values=outputs,
            parameter_values=original.parameter_values,
        )

    # def build_tool()

    # ============================================================================
    # SPEC SERIALIZATION
    # ============================================================================

    def get_spec_json(self) -> Dict[str, Any]:
        """
        Return a JSON‑serializable dict describing:
        - name, description
        - inputs  (list of NodeInput objects)
        - outputs (list of NodeOutput objects)
        - parameters (param → {type name, default, description})
        """
        raw = self.spec.model_dump()

        # logger.info(f"Serializing node spec: {raw}")

        # Serialize inputs, outputs, and parameters
        raw["inputs"] = self._serialize_inputs()
        raw["outputs"] = self._serialize_outputs()
        raw["parameters"] = self._serialize_parameters()

        return raw

    def _serialize_inputs(self) -> list:
        """Serialize input specifications."""
        serialized_inputs = []
        input_spec: NodeInput
        for input_spec in self.spec.inputs:
            serialized_inputs.append(
                NodeInputSchema(
                    name=input_spec.name,
                    type_detail=self._serialize_type(input_spec.type),
                    value=input_spec.value,
                    default=input_spec.default,
                    description=input_spec.description,
                    required=input_spec.required,
                    allow_incoming_edges=input_spec.allow_incoming_edges,
                    enable_for_tool=input_spec.enable_for_tool,
                ).model_dump()
            )
        return serialized_inputs

    def _serialize_outputs(self) -> list:
        """Serialize output specifications."""
        serialized_outputs = []
        output_spec: NodeOutput
        for output_spec in self.spec.outputs:
            serialized_outputs.append(
                NodeOutputSchema(
                    name=output_spec.name,
                    type_detail=self._serialize_type(output_spec.type),
                    value=output_spec.value,
                    default=output_spec.default,
                    description=output_spec.description,
                    enable_for_tool=output_spec.enable_for_tool,
                ).model_dump()
            )
        return serialized_outputs

    def _serialize_parameters(self) -> Dict[str, Any]:
        """Serialize parameter specifications."""
        params = {}
        for name, p in self.spec.parameters.items():
            params[name] = NodeParameterSchema(
                name=p.name,
                type_detail=self._serialize_type(p.type),
                value=p.value,
                default=p.default,
                description=p.description,
            ).model_dump()
        return params

    def _serialize_type(self, t: Union[Type, BaseModel]) -> Dict[str, Any]:
        """
        Serialize type information for JSON output.

        If t is a Pydantic _instance_, we want both its schema AND
        any non‑None field values the user pre‑set.  Otherwise,
        if it's a Pydantic _class_, we only embed its schema.
        """
        # Handle Union types
        # if get_origin(t) is Union:
        #     return self._serialize_union_type(t)

        # instance of a BaseModel → include schema and configured defaults
        if isinstance(t, BaseModel):
            schema = t.model_json_schema()
            # only include fields that have been explicitly set
            defaults = {k: v for k, v in t.model_dump().items() if v is not None}

            # Extract defs if they exist
            defs = schema.pop("$defs", {})
            # Resolve any refs and inline the definitions
            resolved_schema = self._resolve_refs(schema, defs)

            return {
                "type": t.__class__.__name__,
                # "schema": resolved_schema,
                "defaults": defaults or {},
            }
        # class‐only case → just schema
        if isinstance(t, type) and issubclass(t, BaseModel):
            schema = t.model_json_schema()
            defs = schema.pop("$defs", {})
            resolved_schema = self._resolve_refs(schema, defs)
            return {"type": t.__name__, "schema": resolved_schema}
        # fallback
        return {"type": getattr(t, "__name__", str(t)), "schema": {}}

    def _serialize_union_type(self, union_type: Type) -> Dict[str, Any]:
        """
        Serialize Union type information for JSON output.

        Args:
            union_type: A Union type (e.g., Union[str, int, List[str]])

        Returns:
            Dictionary containing the union type information and schema
        """
        # Get the individual types from the union
        union_args = get_args(union_type)

        # Handle Optional types (Union[T, None])
        if len(union_args) == 2 and type(None) in union_args:
            # This is an Optional type, handle it as a nullable type
            actual_type = (
                union_args[0] if union_args[1] is type(None) else union_args[1]
            )
            serialized_type = self._serialize_type(actual_type)
            # Add null to the schema
            if "schema" in serialized_type and isinstance(
                serialized_type["schema"], dict
            ):
                if "anyOf" not in serialized_type["schema"]:
                    serialized_type["schema"]["anyOf"] = []
                serialized_type["schema"]["anyOf"].append({"type": "null"})
            else:
                serialized_type["schema"] = {"anyOf": [{"type": "null"}]}
            return serialized_type

        # Handle general Union types
        schemas = []
        type_names = []

        for arg in union_args:
            if arg is type(None):
                continue  # Skip None for non-Optional unions

            serialized_arg = self._serialize_type(arg)
            type_names.append(serialized_arg.get("type", str(arg)))

            # Extract the schema from the serialized type
            if "schema" in serialized_arg and serialized_arg["schema"]:
                schemas.append(serialized_arg["schema"])
            else:
                # If no schema, create a basic type schema
                arg_type = getattr(arg, "__name__", str(arg))
                schemas.append({"type": arg_type})

        if not schemas:
            return {"type": "Union", "schema": {}}

        # Create the union schema
        if len(schemas) == 1:
            union_schema = schemas[0]
        else:
            union_schema = {"anyOf": schemas}

        return {"type": "Union", "schema": union_schema, "union_types": type_names}

    def _resolve_refs(
        self, schema: Dict[str, Any], defs: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Recursively resolve $ref pointers in the schema by inlining the definition.
        """
        if not isinstance(schema, dict):
            return schema

        # Base case: resolve $ref
        if "$ref" in schema:
            ref_path = schema["$ref"]
            if ref_path.startswith("#/$defs/"):
                def_name = ref_path.split("/")[-1]
                if def_name in defs:
                    # Recursively resolve refs in the resolved definition
                    return self._resolve_refs(defs[def_name], defs)
            # If we can't resolve, return schema as-is
            return schema

        # Recursively process all values in the dictionary
        result = {}
        for k, v in schema.items():
            if k == "$defs":
                # Skip defs since we're inlining them
                continue
            if isinstance(v, dict):
                result[k] = self._resolve_refs(v, defs)
            elif isinstance(v, list):
                result[k] = [self._resolve_refs(item, defs) for item in v]
            else:
                result[k] = v
        return result

    def get_spec_json_str(self) -> str:
        """Pretty‑print the spec dict as JSON."""
        return json.dumps(self.get_spec_json(), indent=2)

    # ============================================================================
    # DEPRECATED METHODS (for backwards compatibility)
    # ============================================================================

    def get_input_map(self, node_data: "NodeData") -> Dict[str, Any]:
        """Deprecated: Use _extract_input_values instead."""
        return self._extract_input_values(node_data)

    def get_parameter_map(self, node_data: "NodeData") -> Dict[str, Any]:
        """Deprecated: Use _extract_parameter_values instead."""
        return self._extract_parameter_values(node_data)

    def build_output_map(self, result: Any) -> Dict[str, Any]:
        """Deprecated: Use _build_output_mapping instead."""
        return self._build_output_mapping(result)

    def run(self, node_data: "NodeData") -> "NodeData":
        """Deprecated: Use execute instead."""
        return self.execute(node_data)
