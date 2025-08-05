import React from 'react';
import { HandleComponentRegistry } from '@/features/flows/handles/HandleComponentRegistry';
import { nodeStyles } from '@/features/flows/styles/nodeStyles';
import type { NodeParameterSpec } from '@/features/nodes/types';
import { NodeInputType } from '@/features/flows/handles/HandleComponentRegistry';

interface ParametersSectionProps {
  spec_parameters: NodeParameterSpec[];
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

  return (
    <div style={nodeStyles.parametersSection}>
      <div style={nodeStyles.sectionTitle}>Parameters</div>
      {spec_parameters.map((paramSpec) => {
        const InputComponent = HandleComponentRegistry[NodeInputType.TextField];
        const paramValue = parameter_values[paramSpec.name];

        return (
          <div key={paramSpec.name} style={nodeStyles.parameterItem}>
            {InputComponent && (
              <InputComponent
                label={paramSpec.name}
                description={paramSpec.description}
                value={paramValue !== undefined ? paramValue : paramSpec.default}
                onChange={(value: string) =>
                  onParameterChange(paramSpec.name, value)
                }
                nodeId={nodeId}
                parameterName={paramSpec.name}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};