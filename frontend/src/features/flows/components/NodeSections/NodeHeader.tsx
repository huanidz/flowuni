import React, { useState } from 'react';
import { MoreVertical } from 'lucide-react';
import { nodeStyles } from '@/features/flows/styles/nodeStyles';
import { getStatusBadgeStyles } from '@/features/flows/styles/nodeExecutionStatusHelper';
import {
    NodeIconDisplayer,
    type NodeIconData,
} from '@/features/flows/components/NodeIconDisplayer/NodeIconDisplayer';

interface NodeHeaderProps {
    label: string;
    description?: string;
    mode?: string;
    onModeChange?: (newMode: string) => void;
    canBeTool?: boolean;
    nodeId?: string;
    execution_status?: string;
    icon?: NodeIconData;
}

export const NodeHeader: React.FC<NodeHeaderProps> = ({
    label,
    description,
    mode,
    onModeChange,
    canBeTool,
    nodeId,
    execution_status,
    icon,
}) => {
    const [showActionsMenu, setShowActionsMenu] = useState(false);

    // Handle mode change through dropdown
    const handleModeSelect = (newMode: string) => {
        if (onModeChange) {
            onModeChange(newMode);
        }
    };

    // Handle actions menu toggle
    const toggleActionsMenu = (e: React.MouseEvent) => {
        e.stopPropagation();
        setShowActionsMenu(!showActionsMenu);
    };

    // Close menu when clicking outside
    React.useEffect(() => {
        const handleClickOutside = () => {
            if (showActionsMenu) {
                setShowActionsMenu(false);
            }
        };

        if (showActionsMenu) {
            document.addEventListener('click', handleClickOutside);
            return () => {
                document.removeEventListener('click', handleClickOutside);
            };
        }
    }, [showActionsMenu]);

    return (
        <div style={nodeStyles.header} className="node-drag-handle">
            {/* Mini island/panel menu */}
            {showActionsMenu && (
                <div style={nodeStyles.actionsMenu}>
                    <div style={nodeStyles.actionsMenuContainer}>
                        <div
                            style={nodeStyles.actionsMenuItem}
                            onClick={e => {
                                e.stopPropagation();
                                // Add action handlers here
                                setShowActionsMenu(false);
                            }}
                        >
                            Edit Node
                        </div>
                        <div
                            style={nodeStyles.actionsMenuItem}
                            onClick={e => {
                                e.stopPropagation();
                                // Add action handlers here
                                setShowActionsMenu(false);
                            }}
                        >
                            Duplicate
                        </div>
                        <div
                            style={nodeStyles.actionsMenuItemDelete}
                            onClick={e => {
                                e.stopPropagation();
                                // Add action handlers here
                                setShowActionsMenu(false);
                            }}
                        >
                            Delete
                        </div>
                    </div>
                </div>
            )}

            <div style={nodeStyles.headerContent}>
                <div style={nodeStyles.headerLabel} title={label}>
                    {icon && (
                        <span
                            style={{
                                marginRight: '8px',
                                display: 'flex',
                                alignItems: 'center',
                            }}
                        >
                            <div style={{ marginRight: '4px' }}>
                                <NodeIconDisplayer icon={icon} size={18} />
                            </div>
                            {label}
                        </span>
                    )}
                </div>
                <div style={nodeStyles.headerControls}>
                    {canBeTool && onModeChange && (
                        <select
                            value={mode}
                            onChange={e => {
                                e.stopPropagation();
                                handleModeSelect(e.target.value);
                            }}
                            style={nodeStyles.modeSelect}
                            title="Change node mode"
                            aria-label="Change node mode"
                        >
                            <option value="NormalMode">Normal</option>
                            <option value="ToolMode">Tool</option>
                        </select>
                    )}

                    {/* Actions button */}
                    <button
                        onClick={toggleActionsMenu}
                        style={nodeStyles.actionsButton}
                        title="Actions"
                        aria-label="Actions"
                    >
                        <MoreVertical size={14} />
                    </button>
                </div>
            </div>

            {/* Badge/Pill Design Implementation */}
            {(description || nodeId || execution_status) && (
                <div style={nodeStyles.header.nodeFooter}>
                    {description && (
                        <div
                            style={nodeStyles.header.descriptionText}
                            title={description}
                        >
                            {description}
                        </div>
                    )}
                    {(nodeId || execution_status) && (
                        <div style={nodeStyles.header.badgeContainer}>
                            {nodeId && (
                                <div
                                    style={nodeStyles.header.infoBadge}
                                    title={`Node ID: ${nodeId}`}
                                >
                                    <span style={nodeStyles.header.badgeLabel}>
                                        ID
                                    </span>
                                    <span style={nodeStyles.header.badgeValue}>
                                        {nodeId}
                                    </span>
                                </div>
                            )}
                            {execution_status && (
                                <div
                                    style={getStatusBadgeStyles(
                                        execution_status
                                    )}
                                    title={`Execution Status: ${execution_status}`}
                                >
                                    <div
                                        style={
                                            nodeStyles.header.statusIndicator
                                        }
                                    />
                                    {execution_status.toUpperCase()}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
