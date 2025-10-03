import React, { useMemo } from 'react';
import { Handle, Position, useEdges } from '@xyflow/react';
import {
    HandleComponentRegistry,
    NodeInputType,
} from '@/features/flows/handles/HandleComponentRegistry';
import { nodeStyles } from '@/features/flows/styles/nodeStyles';
import { nodeInputSectionStyles } from '@/features/flows/styles/nodeInputSectionStyles';
import type { NodeInput } from '@/features/nodes/types';
import { HandleInfo } from '../NodeUI/HandleInfo';
import { NODE_DATA_MODE } from '@/features/flows/consts';
import { ChevronDown, ChevronRight } from 'lucide-react';

// Configuration for default showInputComponent state by input type
const INPUT_TYPE_DEFAULT_COLLAPSE: Record<string, boolean> = {
    [NodeInputType.Table]: false,
    [NodeInputType.DynamicType]: true,
    [NodeInputType.KeyValue]: false,
    // All other types default to true (not explicitly listed)
};

interface InputsSectionProps {
    spec_inputs: NodeInput[];
    input_values: Record<string, any>;
    nodeId: string;
    onInputValueChange: (inputName: string, value: any) => void;
    node_mode: string;
}

export const InputsSection: React.FC<InputsSectionProps> = ({
    spec_inputs,
    input_values,
    nodeId,
    onInputValueChange,
    node_mode,
}) => {
    const edges = useEdges();

    const targetHandleEdges = useMemo(() => {
        return new Set(
            edges
                .filter(edge => edge.target === nodeId && edge.targetHandle)
                .map(edge => edge.targetHandle!)
        );
    }, [edges, nodeId]);

    if (spec_inputs.length === 0) return null;

    // If all inputs are hidden via type_detail.defaults.hidden, don't render this section
    const anyVisibleInputs = spec_inputs.some(
        si => !((si.type_detail as any)?.defaults?.hidden ?? false)
    );

    const renderInput = (spec_input: NodeInput, index: number) => {
        const InputComponent =
            HandleComponentRegistry[spec_input.type_detail.type];

        const hasInputComponent = !!InputComponent;
        const inputValue = input_values[spec_input.name];
        const handleId = `${spec_input.name}-index:${index}`;
        const isConnected = targetHandleEdges.has(handleId);
        const isWholeAsToolMode =
            node_mode === NODE_DATA_MODE.TOOL &&
            spec_input.enable_as_whole_for_tool;
        const allow_multiple_incoming_edges =
            spec_input.allow_multiple_incoming_edges;
        const inputType = spec_input.type_detail.type;
        const isHidden =
            (spec_input.type_detail as any)?.defaults?.hidden ?? false;
        const hideInputField =
            (spec_input.type_detail as any)?.defaults?.hide_input_field ??
            false;
        const defaultVisibility =
            INPUT_TYPE_DEFAULT_COLLAPSE[inputType] ?? true;
        const [showInputComponent, setShowInputComponent] =
            React.useState(defaultVisibility);

        // Handle DynamicTypeInput value format
        const effectiveValue =
            inputType === NodeInputType.DynamicType &&
            inputValue &&
            typeof inputValue === 'object' &&
            inputValue.selected_type
                ? inputValue
                : (inputValue ?? spec_input.default ?? '');

        const inputProps = {
            label: spec_input.name,
            value: effectiveValue,
            onChange: (value: any) =>
                onInputValueChange(spec_input.name, value),
            nodeId,
            type_detail: spec_input.type_detail,
            disabled: isWholeAsToolMode || isConnected,
            isWholeAsToolMode: isWholeAsToolMode,
        };

        const toggleInputComponent = () => {
            setShowInputComponent(!showInputComponent);
        };

        // Don't show the toggle button if input field is hidden
        const showToggleButton = hasInputComponent && !hideInputField;

        return (
            <div
                key={`input-${index}`}
                style={isHidden ? { display: 'none' } : nodeStyles.inputItem}
            >
                <div style={nodeInputSectionStyles.inputItemContainer}>
                    <HandleInfo
                        name={spec_input.name}
                        description={spec_input.description}
                        required={spec_input.required}
                        helperText={isWholeAsToolMode ? 'Tool Parameter' : ''}
                        allow_multiple_incoming_edges={
                            allow_multiple_incoming_edges
                        }
                    />
                    {!hideInputField && showToggleButton && (
                        <button
                            onClick={toggleInputComponent}
                            style={nodeInputSectionStyles.toggleButton}
                            onMouseDown={e => e.preventDefault()}
                            title={
                                showInputComponent ? 'Hide input' : 'Show input'
                            }
                        >
                            {showInputComponent ? (
                                <ChevronDown size={14} />
                            ) : (
                                <ChevronRight size={14} />
                            )}
                        </button>
                    )}
                </div>

                {!isWholeAsToolMode && spec_input.allow_incoming_edges && (
                    <Handle
                        type="target"
                        className="node-input-handle"
                        position={Position.Left}
                        id={handleId}
                        style={nodeStyles.handle.input}
                    />
                )}

                {hasInputComponent && !hideInputField && (
                    <div
                        style={{
                            ...nodeInputSectionStyles.animatedInputComponent,
                            ...(showInputComponent &&
                                nodeInputSectionStyles.animatedInputComponentVisible),
                        }}
                    >
                        <div style={nodeStyles.inputComponent}>
                            <InputComponent {...inputProps} />
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div style={nodeStyles.inputsSection}>
            <div
                style={
                    !anyVisibleInputs
                        ? { display: 'none' }
                        : nodeStyles.sectionTitle
                }
            >
                Inputs
            </div>
            {spec_inputs.map(renderInput)}
        </div>
    );
};
