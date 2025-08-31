import React, { useState } from 'react';
import { MoreVertical } from 'lucide-react';
import { nodeStyles } from '@/features/flows/styles/nodeStyles';

interface NodeHeaderProps {
    label: string;
    description?: string;
    mode?: string;
    onModeChange?: (newMode: string) => void;
    canBeTool?: boolean;
    nodeId?: string;
}

export const NodeHeader: React.FC<NodeHeaderProps> = ({
    label,
    description,
    mode,
    onModeChange,
    canBeTool,
    nodeId,
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
                    {label}
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
            {description && (
                <div style={nodeStyles.descriptionText} title={description}>
                    {description}
                </div>
            )}
            {nodeId && (
                <div style={nodeStyles.nodeIdText} title={`Node ID: ${nodeId}`}>
                    ID: {nodeId}
                </div>
            )}
        </div>
    );
};
