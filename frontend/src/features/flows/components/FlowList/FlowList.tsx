import React, { useState, useCallback } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import DeleteFlowButton from '@/features/flows/components/FlowList/DeleteFlowButton';
import ActivateDeactivateButton from '@/features/flows/components/FlowList/ActivateDeactivateButton';
import type { Flow, Pagination } from '@/features/flows/types';
import { useNavigate } from 'react-router-dom';
import {
    flowListStyles,
    statusStyles,
} from '@/features/flows/styles/flowListStyles';

// Helper component for status display
const StatusBadge: React.FC<{ isActive: boolean }> = ({ isActive }) => (
    <span style={isActive ? statusStyles.active : statusStyles.inactive}>
        {isActive ? 'ACTIVE' : 'INACTIVE'}
    </span>
);

// Helper component for detail items
const DetailItem: React.FC<{ label: string; value: React.ReactNode }> = ({
    label,
    value,
}) => (
    <div style={flowListStyles.detailItem}>
        <span style={flowListStyles.detailLabel}>{label}:</span>
        <span style={flowListStyles.detailValue}>{value}</span>
    </div>
);

interface FlowListProps {
    flows: Flow[];
    pagination?: Pagination;
    onPageChange?: (page: number) => void;
    currentPage?: number;
}

const FlowList: React.FC<FlowListProps> = ({
    flows,
    pagination,
    onPageChange,
    currentPage = 1,
}) => {
    const navigate = useNavigate();
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

    const toggleRow = useCallback((flowId: string) => {
        setExpandedRows(prev => {
            const newSet = new Set(prev);
            newSet.has(flowId) ? newSet.delete(flowId) : newSet.add(flowId);
            return newSet;
        });
    }, []);

    const handleFlowClick = useCallback(
        (flow: Flow) => {
            navigate(`/flow/${flow.flow_id}`);
        },
        [navigate]
    );

    return (
        <div style={flowListStyles.container}>
            <Table>
                <TableHeader style={flowListStyles.tableHeader}>
                    <TableRow>
                        <TableHead style={flowListStyles.tableHeaderCell}>
                            FLOW
                        </TableHead>
                        <TableHead style={flowListStyles.tableHeaderCell}>
                            STATUS
                        </TableHead>
                        <TableHead style={flowListStyles.tableHeaderActions}>
                            ACTIONS
                        </TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {flows.map(flow => (
                        <React.Fragment key={flow.flow_id}>
                            <TableRow>
                                <TableCell style={flowListStyles.tableCell}>
                                    <div>
                                        <div style={flowListStyles.flowName}>
                                            {flow.name}
                                        </div>
                                        <div
                                            style={
                                                flowListStyles.flowDescription
                                            }
                                        >
                                            {flow.description}
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell style={flowListStyles.tableCell}>
                                    <StatusBadge isActive={flow.is_active} />
                                </TableCell>
                                <TableCell
                                    style={{
                                        ...flowListStyles.tableCell,
                                        ...flowListStyles.actionsCell,
                                    }}
                                >
                                    <Button
                                        onClick={() => handleFlowClick(flow)}
                                        variant="ghost"
                                        style={{
                                            backgroundColor: '#3b82f6',
                                            color: '#fff',
                                        }}
                                        size="sm"
                                    >
                                        To FlowBuilder
                                    </Button>
                                    <ActivateDeactivateButton flow={flow} />
                                    <Button
                                        onClick={() => toggleRow(flow.flow_id)}
                                        variant="ghost"
                                        size="sm"
                                        style={flowListStyles.expandButton}
                                    >
                                        {expandedRows.has(flow.flow_id)
                                            ? '▲'
                                            : '▼'}
                                    </Button>
                                    <DeleteFlowButton
                                        flowId={flow.flow_id}
                                        flowName={flow.name}
                                    />
                                </TableCell>
                            </TableRow>
                            {expandedRows.has(flow.flow_id) && (
                                <TableRow style={flowListStyles.expandedRow}>
                                    <TableCell
                                        colSpan={3}
                                        style={{ padding: 0 }}
                                    >
                                        <div
                                            style={
                                                flowListStyles.expandedContent
                                            }
                                        >
                                            <div
                                                style={
                                                    flowListStyles.detailSection
                                                }
                                            >
                                                <DetailItem
                                                    label="ID"
                                                    value={flow.flow_id}
                                                />
                                                <DetailItem
                                                    label="Created Date"
                                                    value={new Date(
                                                        flow.created_at as string
                                                    ).toLocaleDateString(
                                                        'en-US'
                                                    )}
                                                />
                                                <DetailItem
                                                    label="Node Count"
                                                    value={
                                                        flow.node_count !==
                                                        undefined
                                                            ? flow.node_count
                                                            : 'No nodes available'
                                                    }
                                                />
                                                <DetailItem
                                                    label="Status"
                                                    value={
                                                        flow.is_active
                                                            ? 'Active'
                                                            : 'Paused'
                                                    }
                                                />
                                            </div>
                                            <div
                                                style={
                                                    flowListStyles.detailSection
                                                }
                                            >
                                                <DetailItem
                                                    label="Description"
                                                    value={flow.description}
                                                />
                                                <DetailItem
                                                    label="Status"
                                                    value={
                                                        flow.is_active
                                                            ? 'Flow is active'
                                                            : 'Flow is paused'
                                                    }
                                                />
                                            </div>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </React.Fragment>
                    ))}
                </TableBody>
            </Table>

            {/* Pagination Controls */}
            {pagination && (
                <div style={flowListStyles.paginationContainer}>
                    <Button
                        onClick={() => onPageChange?.(pagination.page - 1)}
                        disabled={pagination.page <= 1}
                        variant="outline"
                        size="sm"
                        style={flowListStyles.paginationButton}
                    >
                        Previous
                    </Button>

                    <span style={flowListStyles.paginationInfo}>
                        {pagination.page} / {pagination.total_pages}
                        {pagination.total_items !== undefined && (
                            <span
                                style={{
                                    fontSize: '12px',
                                    color: '#64748b',
                                    marginLeft: '8px',
                                }}
                            >
                                ({pagination.total_items} total)
                            </span>
                        )}
                    </span>

                    <Button
                        onClick={() => onPageChange?.(pagination.page + 1)}
                        disabled={pagination.page >= pagination.total_pages}
                        variant="outline"
                        size="sm"
                        style={flowListStyles.paginationButton}
                    >
                        Next
                    </Button>
                </div>
            )}
        </div>
    );
};

export default FlowList;
