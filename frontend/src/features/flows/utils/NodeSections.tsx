// NodeSections.tsx
import React, { useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import { NodeInputType } from '@/features/flows/handles/HandleComponentRegistry';
import { HandleComponentRegistry } from '@/features/flows/handles/HandleComponentRegistry';
import { nodeStyles } from '@/features/flows/styles/nodeStyles';
import { executionResultStyles } from '@/features/flows/styles/nodeSectionStyles';
import type { NodeParameterSpec, NodeInput, NodeOutput } from '@/features/nodes/types';


// Parameters Section Component
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

// Inputs Section Component
interface InputsSectionProps {
  spec_inputs: NodeInput[];
  input_values: Record<string, any>;
  nodeId: string;
  onInputValueChange: (inputName: string, value: any) => void;
}

export const InputsSection: React.FC<InputsSectionProps> = ({
  spec_inputs,
  input_values,
  nodeId,
  onInputValueChange,
}) => {
  if (spec_inputs.length === 0) return null;

  return (
    <div style={nodeStyles.inputsSection}>
      <div style={nodeStyles.sectionTitle}>Inputs</div>
      {spec_inputs.map((spec_input, index) => {
        const InputComponent = HandleComponentRegistry[spec_input.type_detail.type];

        console.log("input_values", input_values);

        const inputValue = input_values[spec_input.name];

        return (
          <div key={`input-${index}`} style={nodeStyles.inputItem}>
            <Handle
              type="target"
              position={Position.Left}
              id={`${spec_input.name}-index:${index}`}
              style={nodeStyles.handle.input}
            />

            <div style={nodeStyles.inputInfo}>
              <strong>{spec_input.name}</strong>
              {spec_input.description && (
                <span style={nodeStyles.description}>
                  {' '}
                  - {spec_input.description}
                </span>
              )}
              {spec_input.required && <span style={nodeStyles.required}> *</span>}
            </div>

            {InputComponent && (
              <div style={nodeStyles.inputComponent}>
                <InputComponent
                  label=""
                  value={inputValue !== undefined ? inputValue : spec_input.default || ''}
                  onChange={(value: string) =>
                    onInputValueChange(spec_input.name, value)
                  }
                  nodeId={nodeId}
                  type_detail={spec_input.type_detail}
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
  spec_outputs: NodeOutput[];
}

export const OutputsSection: React.FC<OutputsSectionProps> = ({ spec_outputs }) => {
  if (spec_outputs.length === 0) return null;

  return (
    <div style={nodeStyles.outputsSection}>
      <div style={nodeStyles.sectionTitle}>Outputs</div>
      {spec_outputs.map((output, index) => (
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
              <span style={nodeStyles.description}>
                {' '}
                - {output.description}
              </span>
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

export const NodeHeader: React.FC<NodeHeaderProps> = ({
  label,
  description,
}) => (
  <div style={nodeStyles.header}>
    <div>{label}</div>
    {description && (
      <div style={{ fontSize: '0.65em', color: '#666', fontWeight: 'normal' }}>
        {description}
      </div>
    )}
  </div>
);


// Execution Result Section Component
interface NodeExecutionResultProps {
  result?: string | null;
  status?: string;
}

export const NodeExecutionResult: React.FC<NodeExecutionResultProps> = ({ 
  result, 
  status = 'success' 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Don't show if no result and not running
  if (!result && status !== 'running') return null;

  // Get status configuration from external styles
  const statusConfig = executionResultStyles.status[status as keyof typeof executionResultStyles.status] || executionResultStyles.status.success;

  return (
    <div style={executionResultStyles.section}>
      <div
        style={executionResultStyles.sectionTitle}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span style={statusConfig.iconStyle}>{statusConfig.iconText}</span>
        <span style={{ marginRight: '6px' }}>
          {isExpanded ? '▼' : '▶'}
        </span>
        {statusConfig.title}
      </div>
      
      {isExpanded && (
        <div style={{
          ...executionResultStyles.executionResultContent,
          ...statusConfig.contentStyle
        }}>
          {status === 'running' ? 'Execution in progress...' : (result || 'No output')}
        </div>
      )}
    </div>
  );
};
