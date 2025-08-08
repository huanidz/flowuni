import React from 'react';
import { nodeStyles } from '@/features/flows/styles/nodeStyles';

interface NodeHeaderProps {
  label: string;
  description?: string;
  mode?: string;
  onModeChange?: (newMode: string) => void;
  canBeTool?: boolean;
}

export const NodeHeader: React.FC<NodeHeaderProps> = ({
  label,
  description,
  mode,
  onModeChange,
  canBeTool,
}) => {
  const isToolMode = mode === 'ToolMode';
  
  // Handle mode change through dropdown
  const handleModeSelect = (newMode: string) => {
    if (onModeChange) {
      onModeChange(newMode);
    }
  };

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
        {canBeTool && onModeChange && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <select
              value={mode}
              onChange={(e) => handleModeSelect(e.target.value)}
              style={{
                padding: '4px 8px',
                fontSize: '0.8em',
                border: '1px solid #ccc',
                borderRadius: '4px',
                background: '#fff',
                cursor: 'pointer',
              }}
              title="Change node mode"
              aria-label="Change node mode"
            >
              <option value="NormalMode">Normal Mode</option>
              <option value="ToolMode">Tool Mode</option>
            </select>
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