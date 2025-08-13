import type { CSSProperties } from 'react';

export const nodeInputSectionStyles = {
  // Button styles for toggling input components
  toggleButton: {
    marginLeft: '8px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '12px',
    color: '#666',
    padding: '2px',
    borderRadius: '3px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease'
  } as CSSProperties,

  // Container styles for input items
  inputItemContainer: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '4px'
  } as CSSProperties
};