import React, { useState } from 'react';
import { nodeStyles } from '@/features/flows/styles/nodeStyles';

interface NodeEditBoardProps {
  input_values: Record<string, any>;
  parameter_values: Record<string, any>;
  mode: string;
  onInputValueChange: (inputName: string, value: any) => void;
  onParameterChange: (paramName: string, value: any) => void;
}

export const NodeEditBoard: React.FC<NodeEditBoardProps> = ({
  input_values,
  parameter_values,
  mode,
  onInputValueChange,
  onParameterChange,
}) => {
  const [activeTab, setActiveTab] = useState<'inputs' | 'parameters' | 'advanced'>('inputs');

  const tabs = [
    { id: 'inputs', label: 'Inputs' },
    { id: 'parameters', label: 'Parameters' },
    { id: 'advanced', label: 'Advanced' },
  ] as const;

  const renderInputsTab = () => {
    return (
      <div style={nodeStyles.editSection}>
        <div style={nodeStyles.sectionTitle}>Input Values</div>
        <div style={nodeStyles.editGrid}>
          {Object.entries(input_values).map(([key, value]) => (
            <div key={`input-${key}`} style={nodeStyles.editItem}>
              <label style={nodeStyles.editLabel}>{key}:</label>
              <input
                type="text"
                value={value || ''}
                onChange={(e) => onInputValueChange(key, e.target.value)}
                style={nodeStyles.editInput}
                disabled={mode === 'ToolMode'}
              />
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderParametersTab = () => {
    return (
      <div style={nodeStyles.editSection}>
        <div style={nodeStyles.sectionTitle}>Parameter Values</div>
        <div style={nodeStyles.editGrid}>
          {Object.entries(parameter_values).map(([key, value]) => (
            <div key={`param-${key}`} style={nodeStyles.editItem}>
              <label style={nodeStyles.editLabel}>{key}:</label>
              <input
                type="text"
                value={value || ''}
                onChange={(e) => onParameterChange(key, e.target.value)}
                style={nodeStyles.editInput}
              />
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderAdvancedTab = () => {
    return (
      <div style={nodeStyles.editSection}>
        <div style={nodeStyles.sectionTitle}>Advanced Settings</div>
        <div style={nodeStyles.editGrid}>
          <div style={nodeStyles.editItem}>
            <label style={nodeStyles.editLabel}>Mode:</label>
            <select
              value={mode}
              onChange={(e) => {
                // This would typically call a mode change handler
                console.log('Mode changed to:', e.target.value);
              }}
              style={nodeStyles.editSelect}
            >
              <option value="NormalMode">Normal Mode</option>
              <option value="ToolMode">Tool Mode</option>
            </select>
          </div>
          <div style={nodeStyles.editItem}>
            <label style={nodeStyles.editLabel}>Node Status:</label>
            <select
              value="active"
              style={nodeStyles.editSelect}
              disabled
            >
              <option value="active">Active</option>
            </select>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={nodeStyles.editBoard}>
      {/* Tab Navigation */}
      <div style={nodeStyles.tabNavigation}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            style={{
              ...nodeStyles.tabButton,
              ...(activeTab === tab.id ? nodeStyles.tabButtonActive : {})
            }}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={nodeStyles.tabContent}>
        {activeTab === 'inputs' && renderInputsTab()}
        {activeTab === 'parameters' && renderParametersTab()}
        {activeTab === 'advanced' && renderAdvancedTab()}
      </div>
    </div>
  );
};