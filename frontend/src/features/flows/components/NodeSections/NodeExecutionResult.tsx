import React, { useState } from 'react';
import { executionResultStyles } from '@/features/flows/styles/nodeSectionStyles';

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

  // Disable ReactFlow interactions when mouse enters the scrollable area
  const handleMouseEnter = () => {
    // Find the ReactFlow wrapper and disable wheel events
    const reactFlowWrapper = document.querySelector('.react-flow__renderer');
    if (reactFlowWrapper) {
      (reactFlowWrapper as HTMLElement).style.pointerEvents = 'none';
    }
  };

  // Re-enable ReactFlow interactions when mouse leaves
  const handleMouseLeave = () => {
    const reactFlowWrapper = document.querySelector('.react-flow__renderer');
    if (reactFlowWrapper) {
      (reactFlowWrapper as HTMLElement).style.pointerEvents = 'auto';
    }
  };

  // Alternative: Use a more targeted approach with event capture
  const handleWheelCapture = (e: React.WheelEvent) => {
    // Stop the event from reaching ReactFlow
    e.stopPropagation();
    // e.preventDefault();
    
    // Manually handle the scroll
    const target = e.currentTarget as HTMLElement;
    target.scrollTop += e.deltaY;
  };

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
        <div 
          style={{
            ...executionResultStyles.executionResultContent,
            ...statusConfig.contentStyle
          }}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onWheelCapture={handleWheelCapture}
        >
          {status === 'running' ? 'Execution in progress...' : (result || 'No output')}
        </div>
      )}
    </div>
  );
};