import React, { useMemo } from 'react';
import {
    HandleComponentRegistry,
    NodeInputType,
} from '@/features/flows/handles/HandleComponentRegistry';
import { sidebarStyles } from '@/features/flows/styles/sidebarStyles';
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
    const [expandedInputs, setExpandedInputs] = React.useState<
        Record<string, boolean>
    >({});

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

        // Handle DynamicTypeInput value format
        const inputType = spec_input.type_detail.type;
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
            disabled: isWholeAsToolMode,
            isSidebar: true, // Flag to indicate this is being used in the sidebar
        };

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
                        />
                    </div>
                    {hasInputComponent && (
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

                {hasInputComponent && isExpanded && (
                    <div style={sidebarStyles.inputComponent}>
                        <InputComponent {...inputProps} />
                    </div>
                )}
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
