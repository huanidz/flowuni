import React from 'react';
import { sidebarStyles } from '@/features/flows/styles/sidebarStyles';

interface SidebarExecutionResultSectionProps {
  result: any;
  status: string;
}

export const SidebarExecutionResultSection: React.FC<SidebarExecutionResultSectionProps> = ({
  result,
  status
}) => {
  if (!result && !status) return null;

  const getStatusColor = () => {
    switch (status) {
      case 'success':
        return '#10b981'; // green
      case 'error':
        return '#ef4444'; // red
      case 'running':
        return '#3b82f6'; // blue
      default:
        return '#6b7280'; // gray
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'success':
        return 'Success';
      case 'error':
        return 'Error';
      case 'running':
        return 'Running';
      default:
        return 'Unknown';
    }
  };

  return (
    <div style={sidebarStyles.section}>
      <div style={sidebarStyles.sectionTitle}>Execution Result</div>
      
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        marginBottom: '12px',
        padding: '8px 12px',
        backgroundColor: '#f8f9fa',
        borderRadius: '4px',
        border: '1px solid #e0e0e0'
      }}>
        <div style={{ 
          width: '8px', 
          height: '8px', 
          borderRadius: '50%', 
          backgroundColor: getStatusColor(),
          marginRight: '8px'
        }}></div>
        <span style={{ 
          fontSize: '14px', 
          fontWeight: '500',
          color: getStatusColor()
        }}>
          {getStatusText()}
        </span>
      </div>

      {result && (
        <div style={sidebarStyles.executionResult}>
          <div style={sidebarStyles.executionResultTitle}>Result:</div>
          <div style={sidebarStyles.executionResultContent}>
            {typeof result === 'object' 
              ? JSON.stringify(result, null, 2) 
              : String(result)}
          </div>
        </div>
      )}
    </div>
  );
};