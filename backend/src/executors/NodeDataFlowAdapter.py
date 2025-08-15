from typing import Callable, Optional, Type

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
    """Adapter for node data transformation."""

    @staticmethod
    def adapt(
        output_data_to_transfer: NodeData,
        source_handle_type: Type,
        target_handle_type: Type,
    ) -> NodeData:
        """Adapt source node data to target's NodeData."""

        if not NodeDataFlowAdapter._should_adapt(
            source_handle_type, target_handle_type
        ):
            return output_data_to_transfer

        adapter_func = NodeDataFlowAdapter._find_adapter(
            source_handle_type, target_handle_type
        )

        if adapter_func:
            return NodeDataFlowAdapter._apply_adapter(
                output_data_to_transfer, adapter_func
            )

        return output_data_to_transfer

    @staticmethod
    def _should_adapt(source_handle_type: Type, target_handle_type: Type) -> bool:
        """Check if adaptation is needed and possible."""
        if not source_handle_type or not target_handle_type:
            logger.warning(
                f"Cannot adapt: invalid handle types - source: {source_handle_type}, target: {target_handle_type}"  # noqa
            )
            return False

        if source_handle_type == target_handle_type:
            logger.debug(
                f"No adaptation needed: source and target types are the same: {source_handle_type}"  # noqa
            )
            return False

        return True

    @staticmethod
    def _find_adapter(
        source_handle_type: Type, target_handle_type: Type
    ) -> Optional[Callable]:
        """Find the appropriate adapter function for the given type conversion."""
        adapter_key = (target_handle_type, source_handle_type)
        adapter_func = AdapterMatrix.MATRIX.get(adapter_key)

        if not adapter_func:
            logger.warning(
                f"No adapter found for conversion from {source_handle_type} to {target_handle_type}"  # noqa
            )

        return adapter_func

    @staticmethod
    def _apply_adapter(output_data: NodeData, adapter_func: Callable) -> NodeData:
        """Apply the adapter function to the output data."""
        output_data.output_values = adapter_func(output_data.output_values)
        return output_data
