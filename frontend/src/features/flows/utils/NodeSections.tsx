// NodeSections.tsx
import React, { useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import { NodeInputType } from '@/features/flows/handles/HandleComponentRegistry';
import { HandleComponentRegistry } from '@/features/flows/handles/HandleComponentRegistry';
import { nodeStyles } from '@/styles/nodeStyles';
import type { NodeParameterSpec, NodeInput, NodeOutput } from '@/features/nodes/types';


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
  onParameterChange,
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
                onChange={(value: string) =>
                  onParameterChange(paramName, value)
                }
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
  onInputValueChange,
}) => {
  if (inputs.length === 0) return null;

  return (
    <div style={nodeStyles.inputsSection}>
      <div style={nodeStyles.sectionTitle}>Inputs</div>
      {inputs.map((input, index) => {
        const InputComponent = HandleComponentRegistry[input.type_detail.type];

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
                <span style={nodeStyles.description}>
                  {' '}
                  - {input.description}
                </span>
              )}
              {input.required && <span style={nodeStyles.required}> *</span>}
            </div>

            {InputComponent && (
              <div style={nodeStyles.inputComponent}>
                <InputComponent
                  label=""
                  value={input_values[input.name] || input.default || ''}
                  onChange={(value: string) =>
                    onInputValueChange(input.name, value)
                  }
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

  // Status-based styling and content
  const getStatusConfig = () => {
    switch (status) {
      case 'running':
        return {
          title: 'Executing...',
          icon: (
            <span style={{
              display: 'inline-block',
              width: '12px',
              height: '12px',
              border: '2px solid #f3f3f3',
              borderTop: '2px solid #3498db',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              marginRight: '6px'
            }}>
            </span>
          ),
          contentStyle: {
            color: '#666',
            backgroundColor: '#f0f8ff',
            border: '1px solid #3498db'
          }
        };
      case 'failed':
        return {
          title: 'Execution Failed',
          icon: <span style={{ marginRight: '6px', color: '#e74c3c' }}>❌</span>,
          contentStyle: {
            color: '#721c24',
            backgroundColor: '#f8d7da',
            border: '1px solid #f5c6cb'
          }
        };
      default: // 'success'
        return {
          title: 'Execution Result',
          icon: <span style={{ marginRight: '6px', color: '#27ae60' }}>✅</span>,
          contentStyle: {
            color: '#333',
            backgroundColor: '#f9f9f9',
            border: 'none'
          }
        };
    }
  };

  const statusConfig = getStatusConfig();

  return (
    <div style={nodeStyles.executionResultSection}>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
      
      <div 
        style={{
          ...nodeStyles.sectionTitle,
          display: 'flex',
          alignItems: 'center',
          cursor: 'pointer',
          userSelect: 'none'
        }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {statusConfig.icon}
        <span style={{ marginRight: '6px' }}>
          {isExpanded ? '▼' : '▶'}
        </span>
        {statusConfig.title}
      </div>
      
      {isExpanded && (
        <div style={{
          ...nodeStyles.executionResultContent,
          ...statusConfig.contentStyle,
          maxHeight: '200px',
          overflowY: 'auto',
          overflowX: 'hidden'
        }}>
          {status === 'running' ? 'Execution in progress...' : (result || 'No output')}
        </div>
      )}
    </div>
  );
};
