import React from 'react';
import { nodeStyles } from '@/features/flows/styles/nodeStyles';

interface NodeHeaderProps {
  label: string;
  description?: string;
}

export const NodeHeader: React.FC<NodeHeaderProps> = ({
  label,
  description,
}) => (
  <div style={nodeStyles.header}>
    <div>{label}</div>
    {description && (
      <div style={{ fontSize: '0.65em', color: '#666', fontWeight: 'normal' }}>
        {description}
      </div>
    )}
  </div>
);