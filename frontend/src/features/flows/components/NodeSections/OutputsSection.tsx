import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { nodeStyles } from '@/features/flows/styles/nodeStyles';
import type { NodeOutput } from '@/features/nodes/types';
import { HandleInfo } from '../NodeUI/HandleInfo';

import { NODE_DATA_MODE } from '../../consts';

interface OutputsSectionProps {
  spec_outputs: NodeOutput[];
  node_mode: string;
}

export const OutputsSection: React.FC<OutputsSectionProps> = ({ spec_outputs, node_mode }) => {
  const isTool = node_mode === NODE_DATA_MODE.TOOL;
  
  if (spec_outputs.length === 0 && !isTool) return null;

  return (
    <div style={nodeStyles.outputsSection}>
      <div style={nodeStyles.sectionTitle}>Outputs</div>
      
      {/* TOOL mode: render only the tool handle */}
      {isTool && (
        <div key="tool-output" style={nodeStyles.outputItem}>
          <div style={{ marginTop: '8px', fontSize: '12px', color: '#666', fontStyle: 'italic', marginRight: '8px' }}>
            ({spec_outputs.map(output => output.name).join(', ')})
          </div>
          <HandleInfo
            name="Tool"
            description="Connect this to Agent Tool handle to enable tool using for that Agent"
            required={false}
          />

          <div style={{ position: 'relative', width: '12px', height: '24px' }}>
            <Handle
              type="source"
              position={Position.Right}
              id="output-tool-0"  // Use consistent ID structure
              style={nodeStyles.handle.output}
              isConnectable={true}
            />
          </div>
        </div>
      )}

      {/* NORMAL mode: render spec outputs */}
      {!isTool && spec_outputs.map((spec_output, index) => (
        <div key={`output-${index}`} style={nodeStyles.outputItem}>
          <HandleInfo
            name={spec_output.name}
            description={spec_output.description}
            required={false}
          />

          <div style={{ position: 'relative', width: '12px', height: '24px' }}>
            <Handle
              type="source"
              position={Position.Right}
              id={`output-${index}`}  // Use consistent ID structure
              style={nodeStyles.handle.output}
              isConnectable={true}
            />
          </div>
        </div>
      ))}
    </div>
  );
};