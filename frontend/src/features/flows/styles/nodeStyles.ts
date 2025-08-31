export const nodeStyles = {
    container: {
        border: '1px solid #777',
        padding: '8px',
        borderRadius: '6px',
        background: 'white',
        minWidth: '280px',
        position: 'relative' as const,
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        maxWidth: '230px',
        cursor: 'default' as const,
    },

    header: {
        fontWeight: 'bold' as const,
        // textAlign: 'center' as const,
        marginBottom: '12px',
        padding: '8px',
        borderBottom: '1px solid #eee',
        color: '#ebebe7ff',
        backgroundColor: '#272623ff',
        borderRadius: '6px',
        cursor: 'move' as const,

        nodeFooter: {
            marginTop: '8px',
        },

        descriptionText: {
            fontSize: '11px',
            color: '#e3e7ecff',
            marginBottom: '8px',
            lineHeight: '1.4',
            padding: '6px 8px',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '6px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
        },

        badgeContainer: {
            display: 'flex' as const,
            gap: '6px' as const,
            flexWrap: 'wrap' as const,
        },

        infoBadge: {
            display: 'flex',
            alignItems: 'center',
            fontSize: '10px',
            backgroundColor: '#374151',
            borderRadius: '14px',
            overflow: 'hidden',
            border: '1px solid #4b5563',
        },

        badgeLabel: {
            padding: '4px 8px',
            backgroundColor: '#4b5563',
            color: '#9ca3af',
            fontWeight: '500',
        },

        badgeValue: {
            padding: '4px 8px',
            color: '#e5e7eb',
        },

        statusBadge: {
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '10px',
            padding: '4px 8px',
            borderRadius: '14px',
            fontWeight: '500',
        },

        statusIndicator: {
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: 'currentColor',
        },
    },

    sectionTitle: {
        fontSize: '12px',
        fontWeight: 'bold' as const,
        marginBottom: '4px',
        color: '#666',
    },

    parametersSection: {
        marginBottom: '16px',
    },

    parameterItem: {
        marginBottom: '8px',
    },

    inputsSection: {
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '12px',
        paddingBottom: '12px',
        borderBottom: '1px solid #eee',
    },

    inputItem: {
        position: 'relative' as const,
    },

    inputInfo: {
        paddingLeft: '12px',
        fontSize: '10px',
        color: '#333',
    },

    inputComponent: {
        marginTop: '4px',
        textAlign: 'left' as const,
    },

    outputsSection: {
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '8px',
    },

    outputItem: {
        position: 'relative' as const,
        textAlign: 'right' as const,
        height: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        // gap: '8px'
    },

    outputLabel: {
        marginRight: '16px',
        fontSize: '12px',
        color: '#333',
    },

    handle: {
        input: {
            position: 'absolute' as const,
            left: '-8px',
            top: '9px',
            width: 13,
            height: 13,
            borderRadius: '50%',
            background: '#3e4240ff',
            border: '2px solid #fafcf6ff',
        },

        output: {
            position: 'absolute' as const,
            right: '-12px',
            top: '50%',
            transform: 'translateY(-50%)',
            width: 13,
            height: 13,
            borderRadius: '50%',
            background: '#3e4240ff',
            border: '2px solid #fafcf6ff',
        },
    },

    required: {
        color: 'red',
    },

    description: {
        color: '#666',
    },

    // Updated styles for execution result
    executionResultSection: {
        padding: '8px',
        borderTop: '1px solid #ccc',
        marginTop: '8px',
    },

    executionResultContent: {
        fontSize: '0.85em',
        color: '#333',
        backgroundColor: '#f9f9f9',
        padding: '6px 10px',
        borderRadius: '4px',
        whiteSpace: 'pre-wrap',
        // New styles for scrolling will be applied inline
    },

    // Toggle styles for mode switching
    toggle: {
        container: {
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.7em',
        },
        switch: {
            position: 'relative' as const,
            width: '44px',
            height: '24px',
            borderRadius: '12px',
            border: 'none',
            cursor: 'pointer',
            transition: 'background-color 0.2s ease',
            outline: 'none',
        },
        slider: {
            position: 'absolute' as const,
            top: '2px',
            width: '20px',
            height: '20px',
            backgroundColor: 'white',
            borderRadius: '50%',
            transition: 'left 0.2s ease',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
        },
        label: {
            fontWeight: 'bold' as const,
            userSelect: 'none' as const,
        },
    },

    // Toggle styles for Tool mode
    toggleToolMode: {
        switch: {
            backgroundColor: '#007bff',
        },
        slider: {
            left: '22px',
        },
        label: {
            color: '#007bff',
        },
    },

    // Toggle styles for Normal mode
    toggleNormalMode: {
        switch: {
            backgroundColor: '#ccc',
        },
        slider: {
            left: '2px',
        },
        label: {
            color: '#28a745',
        },
    },
    // Edit Board styles - Optimized for narrow width
    editBoard: {
        border: '1px solid #e0e0e0',
        borderRadius: '4px',
        background: '#fafafa',
        marginTop: '8px',
        padding: '8px',
        maxHeight: '300px',
        overflowY: 'auto',
    },

    tabNavigation: {
        display: 'flex',
        gap: '2px',
        marginBottom: '6px',
        borderBottom: '1px solid #ddd',
        paddingBottom: '2px',
    },

    tabButton: {
        padding: '4px 8px',
        border: '1px solid #ddd',
        borderRadius: '3px 3px 0 0',
        background: 'white',
        cursor: 'pointer',
        fontSize: '11px',
        borderLeft: 'none',
        borderTop: 'none',
        borderRight: 'none',
        fontWeight: 'normal' as const,
        whiteSpace: 'nowrap',
    },

    tabButtonActive: {
        background: '#007bff',
        color: 'white',
        fontWeight: 'bold' as const,
        borderLeft: 'none',
        borderTop: 'none',
        borderRight: 'none',
    },

    tabContent: {
        minHeight: '150px',
    },

    editSection: {
        marginBottom: '8px',
    },

    editGrid: {
        display: 'grid',
        gap: '6px',
    },

    editItem: {
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        flexWrap: 'nowrap' as const,
    },

    editLabel: {
        fontSize: '12px',
        fontWeight: 'bold' as const,
        color: '#555',
        minWidth: '60px',
        flexShrink: 0,
    },

    editInput: {
        flex: 1,
        padding: '2px 6px',
        border: '1px solid #ccc',
        borderRadius: '3px',
        fontSize: '10px',
        minWidth: 0,
    },

    editSelect: {
        flex: 1,
        padding: '2px 6px',
        border: '1px solid #ccc',
        borderRadius: '3px',
        fontSize: '10px',
        background: 'white',
        cursor: 'pointer',
        minWidth: 0,
    },

    // Actions button styles
    actionsButton: {
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: '2px',
        borderRadius: '3px',
        color: '#666',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },

    // Actions menu styles
    actionsMenu: {
        position: 'fixed' as const,
        right: '20px',
        top: '50%',
        transform: 'translateY(-50%)',
        background: '#fff',
        border: '1px solid #ddd',
        borderRadius: '6px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
        zIndex: 1000,
        minWidth: '120px',
    },

    // Actions menu container
    actionsMenuContainer: {
        padding: '8px 0',
    },

    // Actions menu item
    actionsMenuItem: {
        padding: '8px 16px',
        cursor: 'pointer',
        fontSize: '12px',
        color: '#333',
        borderBottom: '1px solid #eee',
    },

    // Actions menu item (delete - red color)
    actionsMenuItemDelete: {
        padding: '8px 16px',
        cursor: 'pointer',
        fontSize: '12px',
        color: '#d32f2f',
    },

    // Header content styles
    headerContent: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'relative' as const,
    },

    // Header label styles
    headerLabel: {
        fontWeight: 'bold' as const,
        fontSize: '12px',
        whiteSpace: 'nowrap' as const,
        overflow: 'hidden' as const,
        textOverflow: 'ellipsis' as const,
        maxWidth: '120px',
    },

    // Header controls styles
    headerControls: {
        display: 'flex',
        alignItems: 'center',
        gap: '2px',
        color: '#666',
    },

    // Mode select styles
    modeSelect: {
        padding: '2px 6px',
        fontSize: '10px',
        border: '1px solid #ccc',
        borderRadius: '3px',
        background: '#fff',
        cursor: 'pointer',
        minWidth: '0',
    },

    // Node ID text styles
    nodeIdText: {
        fontSize: '9px',
        color: '#666',
        fontWeight: 'normal' as const,
        textAlign: 'left' as const,
        display: 'block',
        marginTop: '2px',
        paddingLeft: '0',
        whiteSpace: 'nowrap' as const,
        overflow: 'hidden' as const,
        textOverflow: 'ellipsis' as const,
        maxWidth: '180px',
    },
};
