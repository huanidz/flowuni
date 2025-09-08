from typing import Any, Dict, Union

from loguru import logger
from src.nodes.core.NodeInput import NodeInput
from src.nodes.core.NodeOutput import NodeOutput
from src.nodes.handles.basics.inputs.DropdownInputHandle import (
    DropdownInputHandle,
    DropdownOption,
)
from src.nodes.handles.basics.inputs.TextFieldInputHandle import TextFieldInputHandle
from src.nodes.handles.basics.outputs import StringOutputHandle
from src.nodes.NodeBase import Node, NodeSpec


class StringAggregatorNode(Node):
    spec: NodeSpec = NodeSpec(
        name="String Aggregator",
        description="A node that aggregates multiple strings into one with configurable delimiter and options.",  # noqa E501
        inputs=[
            NodeInput(
                name="strings",
                type=TextFieldInputHandle(),
                description="The strings to be aggregated (comma-separated or newline-separated).",  # noqa E501
            ),
            NodeInput(
                name="delimiter",
                type=TextFieldInputHandle(),
                description="The delimiter to use between strings (default: ', ').",
                default=", ",
                allow_incoming_edges=False,
            ),
            NodeInput(
                name="aggregation_mode",
                type=DropdownInputHandle(
                    options=[
                        DropdownOption(label="Join", value="join"),
                        DropdownOption(label="Concat", value="concat"),
                        DropdownOption(label="Unique", value="unique"),
                    ]
                ),
                description="Aggregation mode for combining strings.",
                default="join",
                allow_incoming_edges=False,
            ),
            NodeInput(
                name="filter_empty",
                type=TextFieldInputHandle(),
                description="Filter out empty strings (true/false). Default: true.",
                default="true",
                allow_incoming_edges=False,
            ),
        ],
        outputs=[
            NodeOutput(
                name="aggregated_string",
                type=StringOutputHandle(),
                description="The aggregated result string.",
            ),
        ],
        parameters={},
        can_be_tool=False,
    )

    def process(
        self, inputs: Dict[str, Any], parameters: Dict[str, Any]
    ) -> Dict[str, Union[str]]:
        """
        Process the string aggregation by combining multiple strings.

        Args:
            inputs: Dictionary containing the strings and aggregation options
            parameters: Dictionary of parameters (not used in this node)

        Returns:
            Dictionary containing the aggregated string
        """
        strings_input = inputs.get("strings", "")
        delimiter = inputs.get("delimiter", ", ")
        aggregation_mode = inputs.get("aggregation_mode", "join").lower()
        filter_empty = str(inputs.get("filter_empty", "true")).lower() == "true"

        # Log the incoming inputs for debugging
        logger.info(
            f"Aggregating str(s) with mode: {aggregation_mode}, delimiter: '{delimiter}'"  # noqa E501
        )

        # Parse the strings input
        if not strings_input:
            return {"aggregated_string": ""}

        # Split strings by common delimiters (comma, newline, or whitespace)
        import re

        strings = re.split(r"[,;\n\t]+", str(strings_input))

        # Clean up each string
        processed_strings = []
        for s in strings:
            cleaned = s.strip()
            if cleaned or not filter_empty:
                processed_strings.append(cleaned)

        if not processed_strings:
            return {"aggregated_string": ""}

        # Apply aggregation mode
        if aggregation_mode == "concat":
            # Concatenate without delimiter
            result = "".join(processed_strings)
        elif aggregation_mode == "unique":
            # Remove duplicates while preserving order
            seen = set()
            unique_strings = []
            for s in processed_strings:
                if s not in seen:
                    seen.add(s)
                    unique_strings.append(s)
            result = delimiter.join(unique_strings)
        else:  # Default: join
            # Join with delimiter
            result = delimiter.join(processed_strings)

        logger.info(f"Aggregation result: '{result}'")
        return {"aggregated_string": result}

    def build_tool(self, inputs_values: Dict[str, Any], tool_configs):
        raise NotImplementedError("Subclasses must override process_tool")

    def process_tool(
        self,
        inputs_values: Dict[str, Any],
        parameter_values: Dict[str, Any],
        tool_inputs: Dict[str, Any],
    ) -> Any:
        raise NotImplementedError("Subclasses must override process_tool")
