import React from 'react';
import { sidebarStyles } from '@/features/flows/styles/sidebarStyles';
import { ControlledInput } from '@/features/flows/components/ControlledInput';
import { NODE_DATA_MODE } from '@/features/flows/consts';

interface SidebarToolConfigSectionProps {
    tool_configs: Record<string, any>;
    onToolConfigChange: (toolConfigName: string, value: any) => void;
    mode: string;
}

export const SidebarToolConfigSection: React.FC<
    SidebarToolConfigSectionProps
> = ({ tool_configs, onToolConfigChange, mode }) => {
    const isInToolMode = mode === NODE_DATA_MODE.TOOL;

    if (!isInToolMode) return null;

    return (
        <div style={sidebarStyles.section}>
            {/* <div style={sidebarStyles.sectionTitle}>Tool Configuration</div> */}

            <div style={sidebarStyles.inputItem}>
                <div style={sidebarStyles.inputLabel}>Tool Name</div>
                <div style={sidebarStyles.inputDescription}>
                    Name of the tool (visible to LLM)
                </div>
                <ControlledInput
                    type="text"
                    value={tool_configs.tool_name || ''}
                    onChange={value => onToolConfigChange('tool_name', value)}
                    placeholder="Enter tool name"
                    className="w-full"
                    style={sidebarStyles.inputComponent}
                />
            </div>

            <div style={sidebarStyles.inputItem}>
                <div style={sidebarStyles.inputLabel}>Tool Description</div>
                <div style={sidebarStyles.inputDescription}>
                    Description of the tool (visible to LLM)
                </div>
                <ControlledInput
                    type="text"
                    value={tool_configs.tool_description || ''}
                    onChange={value =>
                        onToolConfigChange('tool_description', value)
                    }
                    placeholder="Enter tool description"
                    className="w-full"
                    style={sidebarStyles.inputComponent}
                />
            </div>
        </div>
    );
};
