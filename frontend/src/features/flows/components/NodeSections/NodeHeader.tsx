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
        <div style={{ fontWeight: 'bold', fontSize: '12px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '120px' }} title={label}>
          {label}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
          {canBeTool && onModeChange && (
            <select
              value={mode}
              onChange={(e) => handleModeSelect(e.target.value)}
              style={{
                padding: '2px 6px',
                fontSize: '10px',
                border: '1px solid #ccc',
                borderRadius: '3px',
                background: '#fff',
                cursor: 'pointer',
                minWidth: '0',
              }}
              title="Change node mode"
              aria-label="Change node mode"
            >
              <option value="NormalMode">Normal</option>
              <option value="ToolMode">Tool</option>
            </select>
          )}
          {onToggleEditBoard && (
            <button
              onClick={onToggleEditBoard}
              style={{
                padding: '2px 6px',
                fontSize: '10px',
                border: '1px solid #007bff',
                borderRadius: '3px',
                background: showEditBoard ? '#007bff' : '#fff',
                color: showEditBoard ? '#fff' : '#007bff',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                minWidth: '0',
              }}
              title={showEditBoard ? 'Hide Edit Board' : 'Show Edit Board'}
              aria-label={showEditBoard ? 'Hide Edit Board' : 'Show Edit Board'}
            >
              {showEditBoard ? '✕' : '✎'}
            </button>
          )}
        </div>
      </div>
      {description && (
        <div style={{
          fontSize: '9px',
          color: '#666',
          fontWeight: 'normal',
          textAlign: 'left',
          display: 'block',
          marginTop: '2px',
          paddingLeft: '0',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          maxWidth: '180px'
        }} title={description}>
          {description}
        </div>
      )}
    </div>
  );
};