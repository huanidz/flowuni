import React from 'react';
import { sidebarStyles } from '@/features/flows/styles/sidebarStyles';

interface SidebarSectionProps {
  title: string;
  children: React.ReactNode;
  defaultCollapsed?: boolean;
}

export const SidebarSection: React.FC<SidebarSectionProps> = ({
  title,
  children,
  defaultCollapsed = false,
}) => {
  const [isCollapsed, setIsCollapsed] = React.useState(defaultCollapsed);

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div style={sidebarStyles.section}>
      <div style={sidebarStyles.sectionHeader}>
        <h3 style={sidebarStyles.sectionTitle}>{title}</h3>
        <button
          style={{
            ...sidebarStyles.iconButton,
            transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
          }}
          onClick={toggleCollapse}
          title={isCollapsed ? `Expand ${title}` : `Collapse ${title}`}
          aria-label={isCollapsed ? `Expand ${title}` : `Collapse ${title}`}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </button>
      </div>
      {!isCollapsed && (
        <div style={sidebarStyles.sectionContent}>
          {children}
        </div>
      )}
    </div>
  );
};