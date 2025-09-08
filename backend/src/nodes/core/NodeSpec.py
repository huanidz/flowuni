from typing import List

from pydantic import BaseModel, Field, model_validator
from src.nodes.core.NodeInput import NodeInput
from src.nodes.core.NodeOutput import NodeOutput
from src.nodes.core.NodeParameterSpec import ParameterSpec


class NodeSpec(BaseModel):
    """Complete specification for a node including inputs, outputs, and parameters."""

    name: str = Field(..., description="Node name")
    description: str = Field(..., description="Node description")
    inputs: List[NodeInput] = Field(default_factory=list, description="Node inputs")
    outputs: List[NodeOutput] = Field(default_factory=list, description="Node outputs")
    parameters: List[ParameterSpec] = Field(
        default_factory=list, description="Node parameters"
    )
    can_be_tool: bool = Field(
        default=False, description="Whether node can be used as a tool"
    )

    # TODO: Disable validation for now, this will need to be enable to ensure the fetching methods is properly implemented

    # @model_validator(mode="before")
    # def validate_resolvers_exist(cls, values):
    #     node_inputs = values.get("inputs", [])
    #     node_class = values.get("node_class")  # optional: attach during node init

    #     for inp in node_inputs:
    #         handle = inp.type
    #         if handle.dynamic and handle.resolver:
    #             if not hasattr(node_class, handle.resolver):
    #                 raise ValueError(
    #                     f"Resolver '{handle.resolver}' not found in {node_class}"
    #                 )
    @model_validator(mode="before")
    @classmethod
    def validate_unique_input_names(cls, values):
        """Validate that all input names are unique within the node specification.

        This validator ensures that no two inputs have the same name, which would
        cause ambiguity in the node's interface. The validation occurs during
        model instantiation.

        Args:
            values: Dictionary of field values being validated

        Returns:
            The input values if validation passes

        Raises:
            ValueError: If duplicate input names are found
        """
        inputs = values.get("inputs", [])
        seen_names = set()
        inp: NodeInput
        for inp in inputs:
            name = inp.name
            if name in seen_names:
                raise ValueError(f"Duplicate input name detected: {name}")
            seen_names.add(name)
        return values

    @model_validator(mode="before")
    @classmethod
    def validate_unique_output_names(cls, values):
        """Validate that all output names are unique within the node specification.

        This validator ensures that no two outputs have the same name, which would
        cause ambiguity in the node's interface. The validation occurs during
        model instantiation.

        Args:
            values: Dictionary of field values being validated

        Returns:
            The input values if validation passes

        Raises:
            ValueError: If duplicate output names are found
        """
        outputs = values.get("outputs", [])
        seen_names = set()
        out: NodeOutput
        for out in outputs:
            name = out.name
            if name in seen_names:
                raise ValueError(f"Duplicate output name detected: {name}")
            seen_names.add(name)
        return values

    @model_validator(mode="before")
    @classmethod
    def validate_unique_parameter_names(cls, values):
        """Validate that all parameter names are unique within the node specification.

        This validator ensures that no two parameters have the same name, which would
        cause ambiguity in the node's interface. The validation occurs during
        model instantiation.

        Args:
            values: Dictionary of field values being validated

        Returns:
            The input values if validation passes

        Raises:
            ValueError: If duplicate parameter names are found
        """
        parameters = values.get("parameters", [])
        seen_names = set()
        param: ParameterSpec
        for param in parameters:
            name = param.name
            if name in seen_names:
                raise ValueError(f"Duplicate parameter name detected: {name}")
            seen_names.add(name)
        return values
