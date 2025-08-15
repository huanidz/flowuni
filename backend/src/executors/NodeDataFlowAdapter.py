from typing import Any, Callable, Optional, Type

from loguru import logger
from src.nodes.handles.basics.inputs import InputHandleTypeEnum
from src.nodes.handles.basics.outputs import OutputHandleTypeEnum
from src.schemas.flowbuilder.flow_graph_schemas import NodeData


class AdapterMatrix:
    """Matrix-based adapter for node data transformation."""

    @staticmethod
    def _default_adapter(val: Any) -> Any:
        return val

    @staticmethod
    def _number_to_text_field(val: float) -> str:
        return str(val)

    @staticmethod
    def _number_to_bool(val: float) -> bool:
        return bool(val)

    @staticmethod
    def _string_to_number(val: str) -> float:
        return float(val)

    @staticmethod
    def _string_to_bool(val: str) -> bool:
        return bool(val)

    MATRIX = {
        # Source: NUMBER
        (
            OutputHandleTypeEnum.NUMBER.value,
            InputHandleTypeEnum.TEXT_FIELD.value,
        ): _number_to_text_field,
        (
            OutputHandleTypeEnum.NUMBER.value,
            InputHandleTypeEnum.BOOLEAN.value,
        ): _number_to_bool,
        (
            OutputHandleTypeEnum.NUMBER.value,
            InputHandleTypeEnum.DROPDOWN.value,
        ): _number_to_text_field,
        # Source: TextField
        (
            OutputHandleTypeEnum.STRING.value,
            InputHandleTypeEnum.NUMBER.value,
        ): _string_to_number,
        (
            OutputHandleTypeEnum.STRING.value,
            InputHandleTypeEnum.BOOLEAN.value,
        ): _string_to_bool,
        (
            OutputHandleTypeEnum.STRING.value,
            InputHandleTypeEnum.DROPDOWN.value,
        ): _default_adapter,
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

        logger.info(f"👉 source_handle_type: {source_handle_type}")
        logger.info(f"👉 target_handle_type: {target_handle_type}")

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
    def _apply_adapter(output_data: Any, adapter_func: Callable) -> Any:
        """Apply the adapter function to the output data."""
        output_data = adapter_func(output_data)

        logger.debug(f"Adapted output data value is: {output_data}")
        return output_data
