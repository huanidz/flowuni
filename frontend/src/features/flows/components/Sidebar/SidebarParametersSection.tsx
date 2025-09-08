import React from 'react';
import { HandleComponentRegistry } from '@/features/flows/handles/HandleComponentRegistry';
import { sidebarStyles } from '@/features/flows/styles/sidebarStyles';
import type { NodeInput } from '@/features/nodes/types';
import { HandleInfo } from '../NodeUI/HandleInfo';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface SidebarParametersSectionProps {
    spec_parameters: NodeInput[];
    parameter_values: Record<string, any>;
    nodeId: string;
    onParameterChange: (paramName: string, value: any) => void;
}

export const SidebarParametersSection: React.FC<
    SidebarParametersSectionProps
> = ({ spec_parameters, parameter_values, nodeId, onParameterChange }) => {
    const [expandedParameters, setExpandedParameters] = React.useState<
        Record<string, boolean>
    >({});

    if (spec_parameters.length === 0) return null;

    const toggleParameterExpanded = (paramName: string) => {
        setExpandedParameters(prev => ({
            ...prev,
            [paramName]: !prev[paramName],
        }));
    };

    const renderParameter = (paramSpec: NodeInput, index: number) => {
        const InputComponent =
            HandleComponentRegistry[paramSpec.type_detail.type];
        const hasInputComponent = !!InputComponent;
        const paramValue = parameter_values[paramSpec.name];
        const isExpanded = expandedParameters[paramSpec.name] !== false;

        // Handle DynamicTypeInput value format
        const inputType = paramSpec.type_detail.type;
        const effectiveValue =
            inputType === 'DynamicTypeInputHandle' &&
            paramValue &&
            typeof paramValue === 'object' &&
            paramValue.selected_type
                ? paramValue
                : (paramValue ?? paramSpec.default ?? '');

        const inputProps = {
            label: paramSpec.name,
            value: effectiveValue,
            onChange: (value: any) => onParameterChange(paramSpec.name, value),
            nodeId,
            disabled: false,
            type_detail: paramSpec.type_detail,
            isSidebar: true,
        };

        return (
            <div key={`param-${index}`} style={sidebarStyles.inputItem}>
                <div style={sidebarStyles.inputHeader}>
                    <div style={sidebarStyles.inputInfo}>
                        <HandleInfo
                            name={paramSpec.name}
                            description={paramSpec.description}
                            required={false} // Parameters are never required
                            helperText=""
                            allow_multiple_incoming_edges={false} // Parameters never allow multiple edges
                        />
                    </div>
                    {hasInputComponent && (
                        <button
                            onClick={() =>
                                toggleParameterExpanded(paramSpec.name)
                            }
                            style={sidebarStyles.toggleButton}
                            onMouseDown={e => e.preventDefault()}
                            title={
                                isExpanded
                                    ? 'Collapse parameter'
                                    : 'Expand parameter'
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
            {spec_parameters.map(renderParameter)}
        </div>
    );
};
