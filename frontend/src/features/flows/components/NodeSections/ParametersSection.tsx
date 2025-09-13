import React from 'react';
import { HandleComponentRegistry } from '@/features/flows/handles/HandleComponentRegistry';
import { nodeStyles } from '@/features/flows/styles/nodeStyles';
import type { NodeInput } from '@/features/nodes/types';
import { HandleInfo } from '../NodeUI/HandleInfo';

interface ParametersSectionProps {
    spec_parameters: NodeInput[];
    parameter_values: Record<string, any>;
    nodeId: string;
    onParameterChange: (paramName: string, value: any) => void;
}

export const ParametersSection: React.FC<ParametersSectionProps> = ({
    spec_parameters,
    parameter_values,
    nodeId,
    onParameterChange,
}) => {
    if (spec_parameters.length === 0) return null;

    const renderParameter = (paramSpec: NodeInput, index: number) => {
        const InputComponent =
            HandleComponentRegistry[paramSpec.type_detail.type];
        const paramValue = parameter_values[paramSpec.name];

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
        };

        return (
            <div key={`param-${index}`} style={nodeStyles.parameterItem}>
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        marginBottom: '4px',
                    }}
                >
                    <HandleInfo
                        name={paramSpec.name}
                        description={paramSpec.description}
                        required={false} // Parameters are never required
                        helperText=""
                        allow_multiple_incoming_edges={false} // Parameters never allow multiple edges
                    />
                </div>

                {InputComponent && (
                    <div style={nodeStyles.inputComponent}>
                        <InputComponent {...inputProps} />
                    </div>
                )}
            </div>
        );
    };

    return (
        <div style={nodeStyles.parametersSection}>
            <div style={nodeStyles.sectionTitle}>Parameters</div>
            {spec_parameters.map(renderParameter)}
        </div>
    );
};
