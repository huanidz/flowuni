import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { nodeStyles } from '@/features/flows/styles/nodeStyles';
import type { NodeOutput } from '@/features/nodes/types';
import { HandleInfo } from '../NodeUI/HandleInfo';

interface OutputsSectionProps {
  spec_outputs: NodeOutput[];
}

export const OutputsSection: React.FC<OutputsSectionProps> = ({ spec_outputs }) => {
  if (spec_outputs.length === 0) return null;

  return (
    <div style={nodeStyles.outputsSection}>
      <div style={nodeStyles.sectionTitle}>Outputs</div>
      {spec_outputs.map((spec_output, index) => (
        <div key={`output-${index}`} style={nodeStyles.outputItem}>
          <HandleInfo
            name={spec_output.name}
            description={spec_output.description}
            required={false} // Only for UI (but in fact, the output handle must also be exist on a node.)
          />

          <div style={{ position: 'relative', width: '12px', height: '24px' }}>
            <Handle
              type="source"
              position={Position.Right}
              id={`${spec_output.name}-index:${index}`}
              style={nodeStyles.handle.output}
            />
          </div>
        </div>
      ))}
    </div>
  );
};