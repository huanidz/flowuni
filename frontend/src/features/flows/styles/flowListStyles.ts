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
        borderBottom: '1px solid #e2e8f0',
    },
    tableHeaderCell: {
        padding: '8px 12px',
        verticalAlign: 'middle' as const,
        textAlign: 'left' as const,
    },
    tableHeaderActions: {
        padding: '8px 12px',
        verticalAlign: 'middle' as const,
        textAlign: 'right' as const,
    },
    tableCell: {
        padding: '8px 12px',
        verticalAlign: 'middle' as const,
    },
    flowName: {
        fontWeight: 600,
        fontSize: '13px',
        color: '#1e293b',
        marginBottom: '2px',
    },
    flowDescription: {
        fontSize: '11px',
        color: '#64748b',
        maxWidth: '200px',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap' as const,
    },
    statusBadge: {
        padding: '2px 8px',
        borderRadius: '10px',
        fontSize: '11px',
        fontWeight: 500,
        display: 'inline-block',
        textAlign: 'center' as const,
        minWidth: '70px',
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
        gap: '6px',
        alignItems: 'center',
        justifyContent: 'flex-end',
    },
    expandedRow: {
        backgroundColor: '#f8fafc',
    },
    expandedContent: {
        padding: '12px',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '12px',
    },
    detailSection: {
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '6px',
    },
    detailItem: {
        display: 'flex',
        alignItems: 'flex-start',
        gap: '6px',
    },
    detailLabel: {
        fontWeight: 500,
        fontSize: '11px',
        color: '#475569',
        minWidth: '80px',
    },
    detailValue: {
        fontSize: '11px',
        color: '#1e293b',
        flex: 1,
    },
    expandButton: {
        padding: '2px 6px',
        fontSize: '11px',
        minWidth: '28px',
        height: '28px',
        backgroundColor: '#f1f5f9',
    },
    paginationContainer: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '12px',
        padding: '10px 0',
        borderTop: '1px solid #e2e8f0',
        marginTop: '8px',
    },
    paginationButton: {
        padding: '6px 12px',
        fontSize: '12px',
        minWidth: '70px',
    },
    paginationInfo: {
        fontSize: '12px',
        fontWeight: 500,
        color: '#475569',
        minWidth: '50px',
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
