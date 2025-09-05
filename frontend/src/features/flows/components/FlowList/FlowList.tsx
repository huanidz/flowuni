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
import type { Flow } from '@/features/flows/types';
import { useNavigate } from 'react-router-dom';

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
        <div>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>FLOW</TableHead>
                        <TableHead>TRẠNG THÁI</TableHead>
                        <TableHead>THAO TÁC</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {flows.map(flow => (
                        <React.Fragment key={flow.flow_id}>
                            <TableRow>
                                <TableCell>
                                    <div>
                                        <div>{flow.name}</div>
                                        <div>{flow.description}</div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <span>
                                        {flow.is_active
                                            ? 'Đang hoạt động'
                                            : 'Tạm dừng'}
                                    </span>
                                </TableCell>
                                <TableCell>
                                    <Button
                                        onClick={() => handleFlowClick(flow)}
                                        variant="ghost"
                                        size="sm"
                                    >
                                        Run
                                    </Button>
                                    <Button
                                        onClick={() => toggleRow(flow.flow_id)}
                                        variant="ghost"
                                        size="sm"
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
                            <TableRow>
                                <TableCell colSpan={3}>
                                    <div>
                                        {expandedRows.has(flow.flow_id) && (
                                            <div>
                                                <div>
                                                    <div>
                                                        ID: {flow.flow_id}
                                                    </div>
                                                    <div>
                                                        Ngày tạo:{' '}
                                                        {new Date(
                                                            flow.created_at as string
                                                        ).toLocaleDateString(
                                                            'vi-VN'
                                                        )}
                                                    </div>
                                                    <div>
                                                        Số lượng nút:{' '}
                                                        {flow.node_count !==
                                                        undefined
                                                            ? flow.node_count
                                                            : 'Không có số lượng nút'}
                                                    </div>
                                                    <div>
                                                        Trạng thái:{' '}
                                                        {flow.is_active
                                                            ? 'Đang hoạt động'
                                                            : 'Tạm dừng'}
                                                    </div>
                                                </div>
                                                <div>
                                                    <div>
                                                        Mô tả:{' '}
                                                        {flow.description}
                                                    </div>
                                                </div>
                                                <div>
                                                    <div>
                                                        Tình trạng:{' '}
                                                        {flow.is_active
                                                            ? 'Dòng chảy đang hoạt động'
                                                            : 'Dòng chảy tạm dừng'}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </TableCell>
                            </TableRow>
                        </React.Fragment>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
};

export default FlowList;
