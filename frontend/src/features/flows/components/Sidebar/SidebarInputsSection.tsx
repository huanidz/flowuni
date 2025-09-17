import React, { useMemo } from 'react';
import { Handle, Position, useEdges } from '@xyflow/react';
import {
    HandleComponentRegistry,
    NodeInputType,
} from '@/features/flows/handles/HandleComponentRegistry';
import { sidebarStyles } from '@/features/flows/styles/sidebarStyles';
import { nodeStyles } from '@/features/flows/styles/nodeStyles';
import type { NodeInput } from '@/features/nodes/types';
import { HandleInfo } from '../NodeUI/HandleInfo';
import { NODE_DATA_MODE } from '@/features/flows/consts';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface SidebarInputsSectionProps {
    spec_inputs: NodeInput[];
    input_values: Record<string, any>;
    nodeId: string;
    onInputValueChange: (inputName: string, value: any) => void;
    node_mode: string;
}

export const SidebarInputsSection: React.FC<SidebarInputsSectionProps> = ({
    spec_inputs,
    input_values,
    nodeId,
    onInputValueChange,
    node_mode,
}) => {
    const edges = useEdges();
    const [expandedInputs, setExpandedInputs] = React.useState<
        Record<string, boolean>
    >({});

    const targetHandleEdges = useMemo(() => {
        return new Set(
            edges
                .filter(edge => edge.target === nodeId && edge.targetHandle)
                .map(edge => edge.targetHandle!)
        );
    }, [edges, nodeId]);

    if (spec_inputs.length === 0) return null;

    const toggleInputExpanded = (inputName: string) => {
        setExpandedInputs(prev => ({
            ...prev,
            [inputName]: !prev[inputName],
        }));
    };

    const renderInput = (spec_input: NodeInput, index: number) => {
        const InputComponent =
            HandleComponentRegistry[spec_input.type_detail.type];
        const hasInputComponent = !!InputComponent;
        const inputValue = input_values[spec_input.name];
        const isExpanded = expandedInputs[spec_input.name] !== false;
        const isWholeAsToolMode =
            node_mode === NODE_DATA_MODE.TOOL &&
            spec_input.enable_as_whole_for_tool;

        // Note: SidebarInputsSection doesn't have access to edge connections
        // so we can't check isConnected like in InputsSection

        // Handle DynamicTypeInput value format
        const inputType = spec_input.type_detail.type;
        const effectiveValue =
            inputType === NodeInputType.DynamicType &&
            inputValue &&
            typeof inputValue === 'object' &&
            inputValue.selected_type
                ? inputValue
                : (inputValue ?? spec_input.default ?? '');

        const handleId = `${spec_input.name}-index:${index}`;
        const isConnected = targetHandleEdges.has(handleId);

        // Check if input field should be hidden
        const hideInputField =
            spec_input.type_detail.defaults?.hide_input_field || false;

        const inputProps = {
            label: spec_input.name,
            value: effectiveValue,
            onChange: (value: any) =>
                onInputValueChange(spec_input.name, value),
            nodeId,
            type_detail: spec_input.type_detail,
            disabled: isWholeAsToolMode || isConnected,
            isSidebar: true, // Flag to indicate this is being used in the sidebar
        };

        // Don't show the toggle button if input field is hidden
        const showToggleButton = hasInputComponent && !hideInputField;

        return (
            <div key={`input-${index}`} style={sidebarStyles.inputItem}>
                <div style={sidebarStyles.inputHeader}>
                    <div style={sidebarStyles.inputInfo}>
                        <HandleInfo
                            name={spec_input.name}
                            description={spec_input.description}
                            required={spec_input.required}
                            helperText={
                                isWholeAsToolMode ? 'Tool Parameter' : ''
                            }
                            allow_multiple_incoming_edges={
                                spec_input.allow_multiple_incoming_edges
                            }
                        />
                    </div>
                    {showToggleButton && (
                        <button
                            onClick={() => toggleInputExpanded(spec_input.name)}
                            style={sidebarStyles.toggleButton}
                            onMouseDown={e => e.preventDefault()}
                            title={
                                isExpanded ? 'Collapse input' : 'Expand input'
                            }
                        >
                            {isExpanded ? (
                                <ChevronDown size={16} />
                            ) : (
                                <ChevronRight size={16} />
                            )}
                        </button>
                    )}
                </div>

                {hasInputComponent && isExpanded && !hideInputField && (
                    <div style={sidebarStyles.inputComponent}>
                        <InputComponent {...inputProps} />
                    </div>
                )}

                {/* No need to display Handle in sidebar */}
                {/* {!isWholeAsToolMode && spec_input.allow_incoming_edges && (
                    <Handle
                        type="target"
                        position={Position.Left}
                        id={handleId}
                        style={nodeStyles.handle.input}
                    />
                )} */}
            </div>
        );
    };

    return (
        <div style={sidebarStyles.section}>
            {/* <div style={sidebarStyles.sectionTitle}>Inputs</div> */}
            {spec_inputs.map(renderInput)}
        </div>
    );
};
