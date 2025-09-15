import type { CSSProperties } from 'react';

// Styles for DropdownHandleInput component
export const dropdownHandleStyles = {
    container: {
        display: 'flex',
        flexDirection: 'column',
        fontSize: '12px',
        width: '100%',
    } as CSSProperties,
    label: {
        marginBottom: '4px',
        fontWeight: 'bold',
        color: '#333',
    } as CSSProperties,
    description: {
        marginBottom: '4px',
        color: '#666',
        fontSize: '11px',
    } as CSSProperties,
    common: {
        padding: '6px 8px',
        fontSize: '12px',
        border: '1px solid #ccc',
        borderRadius: '4px',
        width: '100%',
        boxSizing: 'border-box',
        outline: 'none',
        transition: 'border-color 0.2s',
        position: 'relative',
    } as CSSProperties,
    dropdown: {
        position: 'absolute',
        top: '100%',
        left: 0,
        right: 0,
        backgroundColor: 'white',
        border: '1px solid #ccc',
        borderRadius: '4px',
        maxHeight: '200px',
        overflowY: 'auto',
        zIndex: 1000,
        marginTop: '2px',
    } as CSSProperties,
    searchContainer: {
        padding: '8px',
        borderBottom: '1px solid #eee',
    } as CSSProperties,
    searchInput: {
        width: '100%',
        padding: '4px',
        border: '1px solid #ccc',
        borderRadius: '4px',
    } as CSSProperties,
    noOptions: {
        padding: '8px',
        color: '#666',
        fontStyle: 'italic',
    } as CSSProperties,
    option: {
        padding: '8px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
    } as CSSProperties,
    selectedOption: {
        backgroundColor: '#e6f3ff',
    } as CSSProperties,
    checkbox: {
        marginRight: '8px',
    } as CSSProperties,
    flexRow: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
    } as CSSProperties,
};

export const textfieldHandleStyles = {
    container: {
        display: 'flex',
        flexDirection: 'column',
        fontSize: '12px',
        width: '100%',
    } as CSSProperties,
    label: {
        marginBottom: '4px',
        fontWeight: 'bold',
        color: '#333',
    } as CSSProperties,
    description: {
        marginBottom: '4px',
        color: '#666',
        fontSize: '11px',
    } as CSSProperties,
    common: {
        padding: '6px 8px',
        fontSize: '12px',
        border: '1px solid #ccc',
        borderRadius: '4px',
        width: '100%',
        boxSizing: 'border-box',
        outline: 'none',
        transition: 'border-color 0.2s',
        resize: 'none',
    } as CSSProperties,
    multiline: {
        minHeight: '60px',
    } as CSSProperties,
    jsonEditButton: {
        position: 'absolute',
        top: '8px',
        right: '8px',
        padding: '4px 8px',
        background: '#007bff',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '12px',
        zIndex: 10,
    } as CSSProperties,
    jsonEditButtonContainer: {
        position: 'relative',
        width: '100%',
    } as CSSProperties,
    modalOverlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    } as CSSProperties,
    modalContent: {
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '8px',
        minWidth: '400px',
        minHeight: '300px',
    } as CSSProperties,
    modalHeader: {
        display: 'flex',
        justifyContent: 'flex-end',
        marginBottom: '16px',
    } as CSSProperties,
    modalCloseButton: {
        padding: '8px 16px',
        background: '#6c757d',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
    } as CSSProperties,
} as const;

export default dropdownHandleStyles;

// Secret text handle styles
export const secretTextHandleStyles = {
    container: {
        display: 'flex',
        flexDirection: 'column',
        fontSize: '12px',
        width: '100%',
    } as CSSProperties,
    label: {
        marginBottom: '4px',
        fontWeight: 'bold',
        color: '#333',
    } as CSSProperties,
    description: {
        marginBottom: '4px',
        color: '#666',
        fontSize: '11px',
    } as CSSProperties,
    common: {
        padding: '6px 8px',
        fontSize: '12px',
        border: '1px solid #ccc',
        borderRadius: '4px',
        width: '100%',
        boxSizing: 'border-box',
        outline: 'none',
        transition: 'border-color 0.2s',
        resize: 'none',
    } as CSSProperties,
    multiline: {
        minHeight: '60px',
    } as CSSProperties,
    toggleButton: {
        position: 'absolute',
        right: '8px',
        top: '50%',
        transform: 'translateY(-50%)',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        fontSize: '14px',
        color: '#007bff',
    } as CSSProperties,
    inputContainer: {
        position: 'relative',
        width: '100%',
    } as CSSProperties,
} as const;

// Table handle styles
export const tableHandleStyles = {
    outerContainer: {
        display: 'flex',
        flexDirection: 'column',
        fontSize: '12px',
        width: '100%',
    } as CSSProperties,
    description: {
        marginBottom: '4px',
        color: '#666',
        fontSize: '11px',
    } as CSSProperties,
    container: {
        width: '100%',
        border: '1px solid #ccc',
        borderRadius: '4px',
        overflow: 'hidden',
    } as CSSProperties,
    table: {
        width: '100%',
        borderCollapse: 'collapse',
        fontSize: '12px',
    } as CSSProperties,
    th: {
        backgroundColor: '#f5f5f5',
        border: '1px solid #ccc',
        padding: '6px 8px',
        fontWeight: 'bold',
        textAlign: 'left' as const,
        whiteSpace: 'nowrap' as const,
    } as CSSProperties,
    td: {
        border: '1px solid #ccc',
        padding: '4px 6px',
        verticalAlign: 'top' as const,
    } as CSSProperties,
    input: {
        width: '100%',
        padding: '2px 4px',
        border: 'none',
        outline: 'none',
        fontSize: '11px',
        backgroundColor: 'transparent',
    } as CSSProperties,
    addButton: {
        marginTop: '8px',
        padding: '4px 8px',
        backgroundColor: '#007bff',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '11px',
    } as CSSProperties,
    removeButton: {
        padding: '4px 8px',
        backgroundColor: '#dc3545',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '12px',
    } as CSSProperties,
    disabledContainer: {
        padding: '12px',
        backgroundColor: '#f8f9fa',
        border: '1px solid #e9ecef',
        borderRadius: '4px',
        textAlign: 'center',
    } as CSSProperties,
    disabledPreview: {
        color: '#6c757d',
        fontSize: '11px',
    } as CSSProperties,
    required: {
        color: '#dc3545',
        marginLeft: '2px',
    } as CSSProperties,
};

// Dynamic type handle styles
export const dynamicTypeHandleStyles = {
    container: {
        display: 'flex',
        flexDirection: 'column',
        fontSize: '12px',
        width: '100%',
    } as CSSProperties,
    label: {
        marginBottom: '4px',
        fontWeight: 'bold',
        color: '#333',
        fontSize: '12px',
    } as CSSProperties,
    description: {
        marginBottom: '8px',
        color: '#666',
        fontSize: '11px',
        lineHeight: '1.4',
    } as CSSProperties,
    typeSelectorContainer: {
        marginBottom: '4px',
    } as CSSProperties,
    selectTrigger: {
        width: '100%',
        padding: '8px 12px',
        fontSize: '12px',
        border: '1px solid #d1d5db',
        borderRadius: '6px',
        backgroundColor: 'white',
        cursor: 'pointer',
        outline: 'none',
        transition: 'all 0.2s ease-in-out',
        appearance: 'none',
        backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 12px center',
        backgroundSize: '16px',
        paddingRight: '36px',
    } as CSSProperties,
    selectTriggerHover: {
        borderColor: '#9ca3af',
        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    } as CSSProperties,
    selectTriggerFocus: {
        borderColor: '#3b82f6',
        boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)',
    } as CSSProperties,
    selectTriggerDisabled: {
        backgroundColor: '#f9fafb',
        borderColor: '#e5e7eb',
        color: '#9ca3af',
        cursor: 'not-allowed',
        opacity: 0.6,
    } as CSSProperties,
    componentContainer: {
        marginTop: '12px',
    } as CSSProperties,
} as const;

// Number handle styles
export const numberHandleStyles = {
    container: {
        display: 'flex',
        flexDirection: 'column',
        fontSize: '12px',
        width: '100%',
    } as CSSProperties,
    description: {
        marginBottom: '4px',
        color: '#666',
        fontSize: '11px',
    } as CSSProperties,
    inputContainer: {
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        width: '100%',
    } as CSSProperties,
    input: {
        flex: 1,
        padding: '6px 8px',
        fontSize: '12px',
        border: '1px solid #ccc',
        borderRadius: '4px',
        outline: 'none',
        transition: 'border-color 0.2s',
    } as CSSProperties,
    buttonContainer: {
        display: 'flex',
        flexDirection: 'column',
        gap: '2px',
    } as CSSProperties,
    button: {
        minWidth: '24px',
        minHeight: '24px',
        padding: '0',
        fontSize: '10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    } as CSSProperties,
} as const;

// Boolean handle styles
export const booleanHandleStyles = {
    container: {
        display: 'flex',
        flexDirection: 'column',
        fontSize: '12px',
        width: '100%',
    } as CSSProperties,
    description: {
        marginBottom: '4px',
        color: '#666',
        fontSize: '11px',
    } as CSSProperties,
    toggleContainer: {
        display: 'flex',
        alignItems: 'center',
        width: '100%',
    } as CSSProperties,
    toggleLabel: {
        display: 'flex',
        alignItems: 'center',
        cursor: 'pointer',
        position: 'relative',
    } as CSSProperties,
    toggleInput: {
        position: 'absolute',
        opacity: 0,
        width: 0,
        height: 0,
    } as CSSProperties,
    toggleSwitch: {
        position: 'relative',
        display: 'inline-block',
        width: '36px',
        height: '18px',
        backgroundColor: '#ccc',
        borderRadius: '18px',
        transition: 'background-color 0.2s',
        marginRight: '8px',
    } as CSSProperties,
    disabledToggle: {
        backgroundColor: '#e9ecef',
        cursor: 'not-allowed',
    } as CSSProperties,
    toggleText: {
        fontSize: '12px',
        color: '#333',
        userSelect: 'none',
    } as CSSProperties,
} as const;
