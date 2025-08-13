import React from 'react';
import { sidebarStyles } from '@/features/flows/styles/sidebarStyles';
import { Input } from '@/components/ui/input';
import { NODE_DATA_MODE } from '@/features/flows/consts';

interface SidebarToolConfigSectionProps {
  tool_configs: Record<string, any>;
  onToolConfigChange: (toolConfigName: string, value: any) => void;
  mode: string;
}

export const SidebarToolConfigSection: React.FC<SidebarToolConfigSectionProps> = ({
  tool_configs,
  onToolConfigChange,
  mode
}) => {
  const isInToolMode = mode === NODE_DATA_MODE.TOOL;

  if (!isInToolMode) return null;

  return (
    <div style={sidebarStyles.section}>
      <div style={sidebarStyles.sectionTitle}>Tool Configuration</div>
      
      <div style={sidebarStyles.inputItem}>
        <div style={sidebarStyles.inputLabel}>Mode</div>
        <div style={sidebarStyles.inputDescription}>
          Configure how this node operates
        </div>
        <select
          value={mode}
          onChange={(e) => {
            // This will be handled by the parent component
            // We'll pass this up through the onToolConfigChange
            onToolConfigChange('mode', e.target.value);
          }}
          style={sidebarStyles.modeSelect}
          title="Change node operation mode"
        >
          <option value={NODE_DATA_MODE.NORMAL}>Normal</option>
          <option value={NODE_DATA_MODE.TOOL}>Tool</option>
        </select>
      </div>

      <div style={sidebarStyles.inputItem}>
        <div style={sidebarStyles.inputLabel}>Tool Name</div>
        <div style={sidebarStyles.inputDescription}>
          Name of the tool (visible to LLM)
        </div>
        <Input
          type="text"
          value={tool_configs.tool_name || ''}
          onChange={(e) => onToolConfigChange('tool_name', e.target.value)}
          placeholder="Enter tool name"
          className="w-full"
        />
      </div>

      <div style={sidebarStyles.inputItem}>
        <div style={sidebarStyles.inputLabel}>Tool Description</div>
        <div style={sidebarStyles.inputDescription}>
          Description of the tool (visible to LLM)
        </div>
        <Input
          type="text"
          value={tool_configs.tool_description || ''}
          onChange={(e) => onToolConfigChange('tool_description', e.target.value)}
          placeholder="Enter tool description"
          className="w-full"
        />
      </div>
    </div>
  );
};