import React from 'react';
import { nodeStyles } from '@/features/flows/styles/nodeStyles';

interface NodeHeaderProps {
  label: string;
  description?: string;
  mode?: 'NormalMode' | 'ToolMode';
  onModeToggle?: () => void;
  canBeTool?: boolean;
}

export const NodeHeader: React.FC<NodeHeaderProps> = ({
  label,
  description,
  mode,
  onModeToggle,
  canBeTool,
}) => {
  const isToolMode = mode === 'ToolMode';

  // Combine base toggle styles with mode-specific styles
  const toggleStyles = {
    container: nodeStyles.toggle.container,
    switch: {
      ...nodeStyles.toggle.switch,
      ...(isToolMode ? nodeStyles.toggleToolMode.switch : nodeStyles.toggleNormalMode.switch),
    },
    slider: {
      ...nodeStyles.toggle.slider,
      ...(isToolMode ? nodeStyles.toggleToolMode.slider : nodeStyles.toggleNormalMode.slider),
    },
    label: {
      ...nodeStyles.toggle.label,
      ...(isToolMode ? nodeStyles.toggleToolMode.label : nodeStyles.toggleNormalMode.label),
    }
  };

  return (
    <div style={nodeStyles.header}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontWeight: 'bold' }}>{label}</div>
        {canBeTool && onModeToggle && (
          <div style={toggleStyles.container}>
            <span style={toggleStyles.label}>
              {isToolMode ? 'Tool Mode' : 'Normal Mode'}
            </span>
            <button
              onClick={onModeToggle}
              style={toggleStyles.switch}
              title={`Switch to ${isToolMode ? 'Normal' : 'Tool'} Mode`}
              aria-label={`Toggle between Normal and Tool mode. Currently in ${isToolMode ? 'Tool' : 'Normal'} mode`}
            >
              <div style={toggleStyles.slider} />
            </button>
          </div>
        )}
      </div>
      {description && (
        <div style={{
          fontSize: '0.65em',
          color: '#666',
          fontWeight: 'normal',
          textAlign: 'left',
          display: 'block',
          marginTop: '4px',
          paddingLeft: '0'
        }}>
          {description}
        </div>
      )}
    </div>
  );
};