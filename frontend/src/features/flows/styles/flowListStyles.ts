// flowListStyles.ts

export const flowListStyles = {
    container: {
        width: '100%',
        overflow: 'hidden',
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse' as const,
    },
    tableHeader: {
        backgroundColor: '#f8fafc',
        borderBottom: '2px solid #e2e8f0',
    },
    tableHeaderCell: {
        padding: '12px 16px',
        verticalAlign: 'middle' as const,
        textAlign: 'left' as const,
    },
    tableHeaderActions: {
        padding: '12px 16px',
        verticalAlign: 'middle' as const,
        textAlign: 'right' as const,
    },
    tableCell: {
        padding: '12px 16px',
        verticalAlign: 'middle' as const,
    },
    flowName: {
        fontWeight: 600,
        fontSize: '14px',
        color: '#1e293b',
        marginBottom: '4px',
    },
    flowDescription: {
        fontSize: '12px',
        color: '#64748b',
        maxWidth: '300px',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap' as const,
    },
    statusBadge: {
        padding: '4px 12px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: 500,
        display: 'inline-block',
        textAlign: 'center' as const,
        minWidth: '80px',
    },
    statusActive: {
        backgroundColor: '#dcfce7',
        color: '#166534',
    },
    statusInactive: {
        backgroundColor: '#f1f5f9',
        color: '#475569',
    },
    actionsCell: {
        display: 'flex',
        gap: '8px',
        alignItems: 'center',
        justifyContent: 'flex-end',
    },
    expandedRow: {
        backgroundColor: '#f8fafc',
    },
    expandedContent: {
        padding: '16px',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '16px',
    },
    detailSection: {
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '8px',
    },
    detailItem: {
        display: 'flex',
        alignItems: 'flex-start',
        gap: '8px',
    },
    detailLabel: {
        fontWeight: 500,
        fontSize: '12px',
        color: '#475569',
        minWidth: '100px',
    },
    detailValue: {
        fontSize: '12px',
        color: '#1e293b',
        flex: 1,
    },
    expandButton: {
        padding: '4px 8px',
        fontSize: '12px',
        minWidth: '32px',
        height: '32px',
        backgroundColor: '#f1f5f9',
    },
    paginationContainer: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '16px',
        padding: '16px 0',
        borderTop: '1px solid #e2e8f0',
        marginTop: '16px',
    },
    paginationButton: {
        padding: '8px 16px',
        fontSize: '14px',
        minWidth: '80px',
    },
    paginationInfo: {
        fontSize: '14px',
        fontWeight: 500,
        color: '#475569',
        minWidth: '60px',
        textAlign: 'center' as const,
    },
};

export const statusStyles = {
    active: {
        ...flowListStyles.statusBadge,
        ...flowListStyles.statusActive,
    },
    inactive: {
        ...flowListStyles.statusBadge,
        ...flowListStyles.statusInactive,
    },
};
