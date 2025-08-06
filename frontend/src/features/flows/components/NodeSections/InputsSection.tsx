import React, { useMemo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { HandleComponentRegistry } from '@/features/flows/handles/HandleComponentRegistry';
import { nodeStyles } from '@/features/flows/styles/nodeStyles';
import type { NodeInput } from '@/features/nodes/types';
import { HandleInfo } from '../NodeUI/HandleInfo';
import { useEdges } from '@xyflow/react';

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
  const edges = useEdges();

  if (spec_inputs.length === 0) return null;

  // Pre-compute edge lookup for this specific node
  const targetHandleEdges = useMemo(() => {
    const lookup = new Set<string>();
    edges.forEach(edge => {
      if (edge.targetHandle && edge.target === nodeId) {
        lookup.add(edge.targetHandle);
      }
    });
    return lookup;
  }, [edges, nodeId]);

  return (
    <div style={nodeStyles.inputsSection}>
      <div style={nodeStyles.sectionTitle}>Inputs</div>
      {spec_inputs.map((spec_input, index) => {
        const InputComponent = HandleComponentRegistry[spec_input.type_detail.type];
        const inputValue = input_values[spec_input.name];
        const handleId = `${spec_input.name}-index:${index}`;
        const isExistIncomingEdge = targetHandleEdges.has(handleId);
        const allowIncomingEdges = spec_input.allow_incoming_edges;

        return (
          <div key={`input-${index}`} style={nodeStyles.inputItem}>
            {allowIncomingEdges && (
              <Handle
                type="target"
                position={Position.Left}
                id={handleId}
                style={nodeStyles.handle.input}
              />
            )}

            <HandleInfo
              name={spec_input.name}
              description={spec_input.description}
              required={spec_input.required}
            />

            {InputComponent && (
              <div style={nodeStyles.inputComponent}>
                <InputComponent
                  label={spec_input.name}
                  value={inputValue !== undefined ? inputValue : spec_input.default || ''}
                  onChange={(value: string) =>
                    onInputValueChange(spec_input.name, value)
                  }
                  nodeId={nodeId}
                  type_detail={spec_input.type_detail}
                  disabled={isExistIncomingEdge}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};