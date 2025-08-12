import React from 'react';
import { nodeStyles } from '@/features/flows/styles/nodeStyles';

interface NodeHeaderProps {
  label: string;
  description?: string;
  mode?: string;
  onModeChange?: (newMode: string) => void;
  canBeTool?: boolean;
  onToggleEditBoard?: () => void;
  showEditBoard?: boolean;
}

export const NodeHeader: React.FC<NodeHeaderProps> = ({
  label,
  description,
  mode,
  onModeChange,
  canBeTool,
  onToggleEditBoard,
  showEditBoard,
}) => {
  
  // Handle mode change through dropdown
  const handleModeSelect = (newMode: string) => {
    if (onModeChange) {
      onModeChange(newMode);
    }
  };

  return (
    <div style={nodeStyles.header}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontWeight: 'bold' }}>{label}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {canBeTool && onModeChange && (
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
          )}
          {onToggleEditBoard && (
            <button
              onClick={onToggleEditBoard}
              style={{
                padding: '4px 8px',
                fontSize: '0.8em',
                border: '1px solid #007bff',
                borderRadius: '4px',
                background: showEditBoard ? '#007bff' : '#fff',
                color: showEditBoard ? '#fff' : '#007bff',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              title={showEditBoard ? 'Hide Edit Board' : 'Show Edit Board'}
              aria-label={showEditBoard ? 'Hide Edit Board' : 'Show Edit Board'}
            >
              {showEditBoard ? 'Hide' : 'Edit'}
            </button>
          )}
        </div>
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