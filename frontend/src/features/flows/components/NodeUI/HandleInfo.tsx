
import React, { useState } from 'react';
import { HelpCircle } from 'lucide-react';

interface HandleInfoProps {
  name: string;
  description?: string;
  helperText?: string;
  required?: boolean;
  style?: React.CSSProperties;
}

export const HandleInfo: React.FC<HandleInfoProps> = ({
  name,
  description,
  helperText,
  required,
  style = {}
}) => {
  const [showTooltip, setShowTooltip] = useState(false);

  const handleMouseEnter = () => setShowTooltip(true);
  const handleMouseLeave = () => setShowTooltip(false);

  return (
    <div 
      style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '4px', 
        position: 'relative',
        ...style 
      }}
    >
      <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#26271eff' }}>{name}</span>
      {required && (
        <span style={{ color: '#ef4444', fontSize: '14px' }}>*</span>
      )}
      
      
      {description && (
        <div 
          style={{ position: 'relative' }}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <HelpCircle 
            size={14} 
            style={{ 
              color: showTooltip ? '#6b7280' : '#9ca3af',
              cursor: 'help',
              transition: 'color 0.2s'
            }}
          />
          
          {showTooltip && (
            <div 
              style={{
                position: 'absolute',
                left: '0',
                top: '24px',
                zIndex: 50,
                backgroundColor: '#374151',
                color: 'white',
                fontSize: '12px',
                borderRadius: '6px',
                padding: '8px 12px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                maxWidth: '200px',
                whiteSpace: 'normal',
                pointerEvents: 'none'
              }}
            >
              <div 
                style={{
                  position: 'absolute',
                  top: '-4px',
                  left: '8px',
                  width: '8px',
                  height: '8px',
                  backgroundColor: '#374151',
                  transform: 'rotate(45deg)'
                }}
              />
              {description}
            </div>
          )}
        </div>
      )}

      {helperText && (
        <span style={{ fontSize: '12px', color: '#6b7280', marginLeft: '4px' }}>
          ({helperText})
        </span>
      )}
    </div>
  );
};