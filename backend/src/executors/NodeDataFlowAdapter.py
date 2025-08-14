from typing import Any, Callable, Dict, Optional

from loguru import logger
from src.nodes.handles.basics.inputs import InputHandleTypeEnum
from src.nodes.handles.basics.outputs import OutputHandleTypeEnum
from src.schemas.flowbuilder.flow_graph_schemas import NodeData


class AdapterMatrix:
    """Matrix-based adapter for node data transformation."""

    @staticmethod
    def _number_to_text_field(val: float) -> str:
        return str(val)

    MATRIX = {
        (
            OutputHandleTypeEnum.NUMBER.value,
            InputHandleTypeEnum.TEXT_FIELD.value,
        ): _number_to_text_field,
    }


class NodeDataFlowAdapter:
    @staticmethod
    def _get_input_node_type(
        type_detail: Dict[str, Any],
    ) -> Optional[InputHandleTypeEnum]:
        """Extract node type from type_detail.

        Args:
            type_detail: Dictionary containing type information,
            expected to have a "type" key

        Returns:
            InputHandleTypeEnum if the type is valid, None otherwise
        """
        type_str = type_detail.get("type")
        if not type_str:
            return None

        try:
            return InputHandleTypeEnum[type_str]
        except KeyError:
            logger.warning(f"Unknown input handle type: {type_str}")
            return None

    @staticmethod
    def _get_output_node_type(
        type_detail: Dict[str, Any],
    ) -> Optional[OutputHandleTypeEnum]:
        """Extract node type from type_detail.

        Args:
            type_detail: Dictionary containing type information,
            expected to have a "type" key

        Returns:
            OutputHandleTypeEnum if the type is valid, None otherwise
        """
        type_str = type_detail.get("type")
        if not type_str:
            return None

        try:
            return OutputHandleTypeEnum[type_str]
        except KeyError:
            logger.warning(f"Unknown output handle type: {type_str}")
            return None

    @staticmethod
    def adapt(
        output_data_to_transfer: NodeData,
        source_handle_type_detail: Dict[str, Any],
        target_handle_type_detail: Dict[str, Any],
    ) -> NodeData:
        """Adapt source node data to target's NodeData."""

        input_node_type = NodeDataFlowAdapter._get_input_node_type(
            source_handle_type_detail
        )
        output_node_type = NodeDataFlowAdapter._get_output_node_type(
            target_handle_type_detail
        )

        if (
            not input_node_type
            or not output_node_type
            or input_node_type == output_node_type
        ):
            # Fallback
            logger.warning(
                f"Failed to adapt node data from {input_node_type} to {output_node_type}"
            )
            return output_data_to_transfer

        adapter_func: Callable = AdapterMatrix.MATRIX.get(
            (output_node_type.value, input_node_type.value)
        )

        if adapter_func:
            output_data_to_transfer.output_values = adapter_func(
                output_data_to_transfer.output_values
            )
            return output_data_to_transfer

        logger.warning(
            f"Failed to find adapter for {input_node_type} to {output_node_type}"
        )
        return output_data_to_transfer
