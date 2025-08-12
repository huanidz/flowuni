import React, { useState } from 'react';
import { nodeStyles } from '@/features/flows/styles/nodeStyles';
import { type NodeInput } from '@/features/nodes';

interface NodeEditBoardProps {
  spec_inputs: NodeInput[];
  input_values: Record<string, any>;
  parameter_values: Record<string, any>;
  mode: string;
  onInputValueChange: (inputName: string, value: any) => void;
  onParameterChange: (paramName: string, value: any) => void;
  onModeChange: (newMode: string) => void;
  onToolConfigChange: (toolConfigName: string, value: any) => void;
}

export const NodeEditBoard: React.FC<NodeEditBoardProps> = ({
  spec_inputs,
  input_values,
  parameter_values,
  mode,
  onInputValueChange,
  onParameterChange,
  onModeChange,
  onToolConfigChange,
}) => {
  const [activeTab, setActiveTab] = useState<'inputs' | 'parameters' | 'tool'>('inputs');

  const tabs = [
    { id: 'inputs', label: 'Inputs' },
    { id: 'parameters', label: 'Params' },
    { id: 'tool', label: 'Tool' },
  ] as const;

  const renderInputsTab = () => {
    const isInToolMode = mode === 'ToolMode';

    return (
      <div style={nodeStyles.editSection}>
        <div style={{ ...nodeStyles.sectionTitle, fontSize: '11px', marginBottom: '4px' }}>
          Input Values
        </div>

        <div style={nodeStyles.editGrid}>
          {Object.entries(input_values).map(([key, value]) => {
            const specInput = spec_inputs.find(input => input.name === key);
            const isDisabled = isInToolMode && specInput?.enable_for_tool;
            const displayKey = key.length > 12 ? `${key.slice(0, 12)}...` : key;
            const displayValue = isDisabled ? '' : (value || '');

            return (
              <div key={`input-${key}`} style={nodeStyles.editItem}>
                <label style={nodeStyles.editLabel} title={key}>
                  {displayKey}:
                </label>
                <input
                  type="text"
                  value={displayValue}
                  onChange={e => onInputValueChange(key, e.target.value)}
                  style={nodeStyles.editInput}
                  disabled={isDisabled}
                  title={`${key}: ${value}`}
                />
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderParametersTab = () => {
    return (
      <div style={nodeStyles.editSection}>
        <div style={{...nodeStyles.sectionTitle, fontSize: '11px', marginBottom: '4px'}}>Parameter Values</div>
        <div style={nodeStyles.editGrid}>
          {Object.entries(parameter_values).map(([key, value]) => (
            <div key={`param-${key}`} style={nodeStyles.editItem}>
              <label style={nodeStyles.editLabel} title={key}>{key.length > 12 ? key.substring(0, 12) + '...' : key}:</label>
              <input
                type="text"
                value={value || ''}
                onChange={(e) => onParameterChange(key, e.target.value)}
                style={nodeStyles.editInput}
                title={`${key}: ${value}`}
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
        <div style={{...nodeStyles.sectionTitle, fontSize: '11px', marginBottom: '4px'}}>Advanced Settings</div>
        <div style={nodeStyles.editGrid}>
          <div style={nodeStyles.editItem}>
            <label style={nodeStyles.editLabel}>Mode:</label>
            <select
              value={mode}
              onChange={(e) => {
                onModeChange(e.target.value);
              }}
              style={nodeStyles.editSelect}
              title="Change node operation mode"
            >
              <option value="NormalMode">Normal</option>
              <option value="ToolMode">Tool</option>
            </select>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{...nodeStyles.editBoard, overflowY: 'auto' as const}}>
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
            title={`Switch to ${tab.label} tab`}
          >
            {tab.label.length > 8 ? tab.label.substring(0, 8) + '...' : tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={nodeStyles.tabContent}>
        {activeTab === 'inputs' && renderInputsTab()}
        {activeTab === 'parameters' && renderParametersTab()}
        {activeTab === 'tool' && renderAdvancedTab()}
      </div>
    </div>
  );
};