import React, { useState } from 'react';
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
import type { Flow } from '@/features/flows/types';
import { useNavigate } from 'react-router-dom';
import {
    flowListStyles,
    statusStyles,
} from '@/features/flows/styles/flowListStyles';

interface FlowListProps {
    flows: Flow[];
}

const FlowList: React.FC<FlowListProps> = ({ flows }) => {
    const navigate = useNavigate();
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

    const toggleRow = (flowId: string) => {
        const newExpandedRows = new Set(expandedRows);
        if (newExpandedRows.has(flowId)) {
            newExpandedRows.delete(flowId);
        } else {
            newExpandedRows.add(flowId);
        }
        setExpandedRows(newExpandedRows);
    };

    const handleFlowClick = (flow: Flow) => {
        navigate(`/flow/${flow.flow_id}`);
    };

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
                                    <span
                                        style={
                                            flow.is_active
                                                ? statusStyles.active
                                                : statusStyles.inactive
                                        }
                                    >
                                        {flow.is_active ? 'ACTIVE' : 'INACTIVE'}
                                    </span>
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
                                                <div
                                                    style={
                                                        flowListStyles.detailItem
                                                    }
                                                >
                                                    <span
                                                        style={
                                                            flowListStyles.detailLabel
                                                        }
                                                    >
                                                        ID:
                                                    </span>
                                                    <span
                                                        style={
                                                            flowListStyles.detailValue
                                                        }
                                                    >
                                                        {flow.flow_id}
                                                    </span>
                                                </div>
                                                <div
                                                    style={
                                                        flowListStyles.detailItem
                                                    }
                                                >
                                                    <span
                                                        style={
                                                            flowListStyles.detailLabel
                                                        }
                                                    >
                                                        Created Date:
                                                    </span>
                                                    <span
                                                        style={
                                                            flowListStyles.detailValue
                                                        }
                                                    >
                                                        {new Date(
                                                            flow.created_at as string
                                                        ).toLocaleDateString(
                                                            'en-US'
                                                        )}
                                                    </span>
                                                </div>
                                                <div
                                                    style={
                                                        flowListStyles.detailItem
                                                    }
                                                >
                                                    <span
                                                        style={
                                                            flowListStyles.detailLabel
                                                        }
                                                    >
                                                        Node Count:
                                                    </span>
                                                    <span
                                                        style={
                                                            flowListStyles.detailValue
                                                        }
                                                    >
                                                        {flow.node_count !==
                                                        undefined
                                                            ? flow.node_count
                                                            : 'No nodes available'}
                                                    </span>
                                                </div>
                                                <div
                                                    style={
                                                        flowListStyles.detailItem
                                                    }
                                                >
                                                    <span
                                                        style={
                                                            flowListStyles.detailLabel
                                                        }
                                                    >
                                                        Status:
                                                    </span>
                                                    <span
                                                        style={
                                                            flowListStyles.detailValue
                                                        }
                                                    >
                                                        {flow.is_active
                                                            ? 'Active'
                                                            : 'Paused'}
                                                    </span>
                                                </div>
                                            </div>
                                            <div
                                                style={
                                                    flowListStyles.detailSection
                                                }
                                            >
                                                <div
                                                    style={
                                                        flowListStyles.detailItem
                                                    }
                                                >
                                                    <span
                                                        style={
                                                            flowListStyles.detailLabel
                                                        }
                                                    >
                                                        Description:
                                                    </span>
                                                    <span
                                                        style={
                                                            flowListStyles.detailValue
                                                        }
                                                    >
                                                        {flow.description}
                                                    </span>
                                                </div>
                                                <div
                                                    style={
                                                        flowListStyles.detailItem
                                                    }
                                                >
                                                    <span
                                                        style={
                                                            flowListStyles.detailLabel
                                                        }
                                                    >
                                                        Status:
                                                    </span>
                                                    <span
                                                        style={
                                                            flowListStyles.detailValue
                                                        }
                                                    >
                                                        {flow.is_active
                                                            ? 'Flow is active'
                                                            : 'Flow is paused'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </React.Fragment>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
};

export default FlowList;
