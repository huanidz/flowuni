// NodeSections.tsx
import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { NodeInputType } from '@/types/NodeIOHandleType';
import { HandleComponentRegistry } from '@/components/handles/HandleComponentRegistry';
import { nodeStyles } from '@/styles/nodeStyles';

interface NodeParameterSpec {
  name: string;
  value: string;
  default: any;
  type?: string;
  description?: string;
  [key: string]: any;
}

interface NodeInput {
  name: string;
  type: string;
  value?: string;
  default?: any;
  description?: string;
  required?: boolean;
}

interface NodeOutput {
  name: string;
  type: string;
  value?: string;
  default?: any;
  description?: string;
}

// Parameters Section Component
interface ParametersSectionProps {
  parameters: Record<string, NodeParameterSpec>;
  parameterValues: Record<string, any>;
  nodeId: string;
  onParameterChange: (paramName: string, value: any) => void;
}

export const ParametersSection: React.FC<ParametersSectionProps> = ({
  parameters,
  parameterValues,
  nodeId,
  onParameterChange
}) => {
  if (Object.keys(parameters).length === 0) return null;

  return (
    <div style={nodeStyles.parametersSection}>
      <div style={nodeStyles.sectionTitle}>Parameters</div>
      {Object.entries(parameters).map(([paramName, paramSpec]) => {
        const InputComponent = HandleComponentRegistry[NodeInputType.TextField];
        
        return (
          <div key={paramName} style={nodeStyles.parameterItem}>
            {InputComponent && (
              <InputComponent
                label={paramSpec.name}
                description={paramSpec.description}
                value={parameterValues[paramName] || paramSpec.default}
                onChange={(value: string) => onParameterChange(paramName, value)}
                nodeId={nodeId}
                parameterName={paramName}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

// Inputs Section Component
interface InputsSectionProps {
  inputs: NodeInput[];
  input_values: Record<string, any>;
  nodeId: string;
  onInputValueChange: (inputName: string, value: any) => void;
}

export const InputsSection: React.FC<InputsSectionProps> = ({
  inputs,
  input_values,
  nodeId,
  onInputValueChange
}) => {
  if (inputs.length === 0) return null;

  return (
    <div style={nodeStyles.inputsSection}>
      <div style={nodeStyles.sectionTitle}>Inputs</div>
      {inputs.map((input, index) => {
        const InputComponent = HandleComponentRegistry[input.type];

        return (
          <div key={`input-${index}`} style={nodeStyles.inputItem}>
            <Handle
              type="target"
              position={Position.Left}
              id={`${input.name}-index:${index}`}
              style={nodeStyles.handle.input}
            />

            <div style={nodeStyles.inputInfo}>
              <strong>{input.name}</strong>
              {input.description && (
                <span style={nodeStyles.description}> - {input.description}</span>
              )}
              {input.required && <span style={nodeStyles.required}> *</span>}
            </div>

            {InputComponent && (
              <div style={nodeStyles.inputComponent}>
                <InputComponent
                  label=""
                  value={input_values[input.name] || input.default || ""}
                  onChange={(value: string) => onInputValueChange(input.name, value)}
                  nodeId={nodeId}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

// Outputs Section Component
interface OutputsSectionProps {
  outputs: NodeOutput[];
}

export const OutputsSection: React.FC<OutputsSectionProps> = ({ outputs }) => {
  if (outputs.length === 0) return null;

  return (
    <div style={nodeStyles.outputsSection}>
      <div style={nodeStyles.sectionTitle}>Outputs</div>
      {outputs.map((output, index) => (
        <div key={`output-${index}`} style={nodeStyles.outputItem}>
          <Handle
            type="source"
            position={Position.Right}
            id={`${output.name}-index:${index}`}
            style={nodeStyles.handle.output}
          />
          <span style={nodeStyles.outputLabel}>
            <strong>{output.name}</strong>
            {output.description && (
              <span style={nodeStyles.description}> - {output.description}</span>
            )}
          </span>
        </div>
      ))}
    </div>
  );
};

// Node Header Component
interface NodeHeaderProps {
  label: string;
  description?: string;
}

export const NodeHeader: React.FC<NodeHeaderProps> = ({ label, description }) => (
  <div style={nodeStyles.header}>
    <div>{label}</div>
    {description && <div style={{ fontSize: '0.65em', color: '#666', fontWeight: 'normal' }}>{description}</div>}
  </div>
);