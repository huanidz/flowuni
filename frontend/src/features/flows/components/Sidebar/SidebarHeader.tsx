import React from 'react';
import { X, Minimize2, Maximize2 } from 'lucide-react';
import { sidebarStyles } from '@/features/flows/styles/sidebarStyles';

interface SidebarHeaderProps {
    title: string;
    isCollapsed: boolean;
    onToggleCollapse: () => void;
    onClose: () => void;
}

export const SidebarHeader: React.FC<SidebarHeaderProps> = ({
    title,
    isCollapsed,
    onToggleCollapse,
    onClose,
}) => {
    return (
        <div style={sidebarStyles.header}>
            <h2 style={sidebarStyles.headerTitle}>{title}</h2>
            <div style={sidebarStyles.headerActions}>
                {/* <button
          style={sidebarStyles.iconButton}
          onClick={onToggleCollapse}
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? <Maximize2 size={18} /> : <Minimize2 size={18} />}
        </button> */}
                <button
                    style={sidebarStyles.iconButton}
                    onClick={onClose}
                    title="Close sidebar"
                    aria-label="Close sidebar"
                >
                    <X size={18} />
                </button>
            </div>
        </div>
    );
};
