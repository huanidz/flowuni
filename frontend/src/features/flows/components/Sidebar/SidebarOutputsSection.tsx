import React from 'react';
import { sidebarStyles } from '@/features/flows/styles/sidebarStyles';
import type { NodeOutput } from '@/features/nodes/types';
import { NODE_DATA_MODE } from '@/features/flows/consts';

interface SidebarOutputsSectionProps {
  spec_outputs: NodeOutput[];
  node_mode: string;
  output_values: Record<string, any>;
}

export const SidebarOutputsSection: React.FC<SidebarOutputsSectionProps> = ({ 
  spec_outputs, 
  node_mode,
  output_values
}) => {
  const isTool = node_mode === NODE_DATA_MODE.TOOL;
  
  if (spec_outputs.length === 0 && !isTool) return null;

  return (
    <div style={sidebarStyles.section}>
      <div style={sidebarStyles.sectionTitle}>Outputs</div>
      
      {/* TOOL mode: render only the tool handle */}
      {isTool && (
        <div key="tool-output" style={sidebarStyles.outputItem}>
          <div style={sidebarStyles.outputLabel}>
            Tool
            <div style={{ fontSize: '12px', color: '#666', fontStyle: 'italic', marginTop: '4px' }}>
              ({spec_outputs.map(output => output.name).join(', ')})
            </div>
          </div>
          <div style={sidebarStyles.outputValue}>
            Connect this to Agent Tool handle to enable tool using for that Agent
          </div>
        </div>
      )}

      {/* NORMAL mode: render spec outputs */}
      {!isTool && spec_outputs.map((spec_output, index) => (
        <div key={`output-${index}`} style={sidebarStyles.outputItem}>
          <div style={sidebarStyles.outputLabel}>
            {spec_output.name}
            {spec_output.description && (
              <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                {spec_output.description}
              </div>
            )}
          </div>
          <div style={sidebarStyles.outputValue}>
            {output_values[spec_output.name] !== undefined 
              ? JSON.stringify(output_values[spec_output.name])
              : 'No output value'
            }
          </div>
        </div>
      ))}
    </div>
  );
};