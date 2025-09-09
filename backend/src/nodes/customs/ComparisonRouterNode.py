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


class ComparisonRouterNode(Node):
    spec: NodeSpec = NodeSpec(
        name="Comparison Router",
        description="A node that compares two values and routes to True or False output based on the selected operation.",
        inputs=[
            NodeInput(
                name="input",
                type=TextFieldInputHandle(),
                description="The input value to compare.",
                required=True,
            ),
            NodeInput(
                name="operation",
                type=DropdownInputHandle(
                    options=[
                        DropdownOption(label="Equal To", value="EqualTo"),
                        DropdownOption(label="Not Equal", value="NotEqual"),
                        DropdownOption(label="Contains", value="Contains"),
                        DropdownOption(
                            label="Does Not Contain", value="DoesNotContain"
                        ),
                        DropdownOption(label="Greater Than", value="GreaterThan"),
                        DropdownOption(label="Less Than", value="LessThan"),
                        DropdownOption(label="Is Set", value="IsSet"),
                        DropdownOption(label="Is Empty", value="IsEmpty"),
                        DropdownOption(label="Starts With", value="StartsWith"),
                        DropdownOption(label="Ends With", value="EndsWith"),
                    ]
                ),
                description="The comparison operation to perform.",
                default="EqualTo",
                allow_incoming_edges=False,
                required=True,
            ),
            NodeInput(
                name="comparison_value",
                type=TextFieldInputHandle(),
                description="The value to compare against.",
                required=True,
            ),
        ],
        outputs=[
            NodeOutput(
                name="True",
                type=StringOutputHandle(),
                description="Output when comparison result is True.",
            ),
            NodeOutput(
                name="False",
                type=StringOutputHandle(),
                description="Output when comparison result is False.",
            ),
        ],
        parameters=[],
        can_be_tool=False,
    )

    def process(
        self, inputs: Dict[str, Any], parameters: Dict[str, Any]
    ) -> Dict[str, Union[str, bool]]:
        """
        Process the comparison by evaluating the input against the comparison value using the selected operation.

        Args:
            inputs: Dictionary containing the input values and operation
            parameters: Dictionary of parameters (not used in this node)

        Returns:
            Dictionary containing the comparison result (True or False)
        """
        input_value = inputs.get("input", "")
        comparison_value = inputs.get("comparison", "")
        operation = inputs.get("operation", "EqualTo")

        # Log the incoming inputs for debugging
        logger.info(
            f"Comparing values: input='{input_value}', comparison='{comparison_value}', operation='{operation}'"
        )

        result = False

        try:
            # Handle numeric operations (GreaterThan, LessThan)
            if operation in ["GreaterThan", "LessThan"]:
                try:
                    # Try to convert both values to float
                    input_num = float(input_value)
                    comparison_num = float(comparison_value)

                    if operation == "GreaterThan":
                        result = input_num > comparison_num
                    elif operation == "LessThan":
                        result = input_num < comparison_num
                except (ValueError, TypeError) as e:
                    logger.error(
                        f"Error converting to float for numeric comparison: {e}"
                    )
                    raise ValueError(
                        f"Cannot convert values to numbers for {operation} operation: {e}"
                    )
            else:
                # For all other operations, convert to string
                input_str = str(input_value)
                comparison_str = str(comparison_value)

                # Perform string-based comparisons
                if operation == "EqualTo":
                    result = input_str == comparison_str
                elif operation == "NotEqual":
                    result = input_str != comparison_str
                elif operation == "Contains":
                    result = comparison_str in input_str
                elif operation == "DoesNotContain":
                    result = comparison_str not in input_str
                elif operation == "IsSet":
                    result = input_str is not None and input_str != ""
                elif operation == "IsEmpty":
                    result = input_str == "" or input_str is None
                elif operation == "StartsWith":
                    result = input_str.startswith(comparison_str)
                elif operation == "EndsWith":
                    result = input_str.endswith(comparison_str)

        except Exception as e:
            logger.error(f"Error during comparison: {e}")
            raise ValueError(f"Comparison failed: {e}")

        logger.info(f"Comparison result: {result}")

        if result:
            return {"True": inputs.get("input", ""), "False": ""}
        else:
            return {"True": "", "False": inputs.get("input", "")}

    def build_tool(self, inputs_values: Dict[str, Any], tool_configs):
        raise NotImplementedError("Subclasses must override build_tool")

    def process_tool(
        self,
        inputs_values: Dict[str, Any],
        parameter_values: Dict[str, Any],
        tool_inputs: Dict[str, Any],
    ) -> Any:
        raise NotImplementedError("Subclasses must override process_tool")
