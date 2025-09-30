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
        transition: 'all 0.2s ease',
    } as CSSProperties,

    // Container styles for input items
    inputItemContainer: {
        display: 'flex',
        alignItems: 'center',
        marginBottom: '4px',
    } as CSSProperties,

    // Animated input component container
    animatedInputComponent: {
        overflow: 'hidden',
        transition:
            'max-height 0.15s ease-out, opacity 0.15s ease-out, transform 0.15s ease-out',
        maxHeight: '0px',
        opacity: '0',
        transform: 'translateY(-10px)',
    } as CSSProperties,

    // Animated input component (visible state)
    animatedInputComponentVisible: {
        maxHeight: '500000px',
        opacity: '1',
        transform: 'translateY(0)',
    } as CSSProperties,
};
