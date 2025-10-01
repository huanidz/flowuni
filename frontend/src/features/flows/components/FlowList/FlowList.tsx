import React, { useState } from 'react';
import {
    MoreHorizontal,
    Trash2,
    Power,
    PowerOff,
    Play,
    Copy,
    Check,
} from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Flow, Pagination } from '@/features/flows/types';
import { useNavigate } from 'react-router-dom';
import { useDeleteFlow, useActivateFlow } from '@/features/flows/hooks';
import { toast } from 'sonner';
import { useConfirmation } from '@/hooks/useConfirmationModal';

interface FlowListProps {
    flows: Flow[];
    pagination?: Pagination;
    onPageChange?: (page: number) => void;
    currentPage?: number;
    isLoading?: boolean;
    error?: Error | null;
}

const FlowList: React.FC<FlowListProps> = ({
    flows,
    pagination,
    onPageChange,
    isLoading = false,
    error = null,
}) => {
    const navigate = useNavigate();
    const { mutate: deleteFlow } = useDeleteFlow();
    const { mutate: activateFlow, isPending: isActivatePending } =
        useActivateFlow();
    const { confirm, ConfirmationDialog } = useConfirmation();
    const [copiedFlowId, setCopiedFlowId] = useState<string | null>(null);

    const handleFlowClick = (flow: Flow) => {
        navigate(`/flow/${flow.flow_id}`);
    };

    const handleDeleteFlow = (flowId: string, flowName: string) => {
        confirm({
            title: 'Delete Flow',
            description: `Are you sure you want to delete "${flowName}"? This action cannot be undone.`,
            confirmText: 'Delete',
            cancelText: 'Cancel',
            variant: 'destructive',
            onConfirm: async () => {
                deleteFlow(flowId);
                toast.success('Flow đã được xóa thành công');
            },
        });
    };

    const handleCopyFlowId = async (flowId: string) => {
        try {
            await navigator.clipboard.writeText(flowId);
            setCopiedFlowId(flowId);
            toast.success('Flow ID copied to clipboard');

            // Reset the copied state after 2 seconds
            setTimeout(() => {
                setCopiedFlowId(null);
            }, 2000);
        } catch (error) {
            toast.error('Failed to copy Flow ID');
        }
    };

    const handleToggleActivation = (flow: Flow) => {
        const newIsActive = !flow.is_active;
        activateFlow(
            {
                flow_id: flow.flow_id,
                is_active: newIsActive,
            },
            {
                onSuccess: () => {
                    toast.success(
                        newIsActive
                            ? 'Flow đã được kích hoạt thành công'
                            : 'Flow đã được tạm dừng thành công'
                    );
                },
                onError: () => {
                    toast.error(
                        newIsActive
                            ? 'Không thể kích hoạt flow'
                            : 'Không thể tạm dừng flow'
                    );
                },
            }
        );
    };

    return (
        <div className="mt-6">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[250px]">Flow ID</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="w-[120px]">Builder</TableHead>
                        <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {flows.map(flow => (
                        <TableRow key={flow.flow_id}>
                            <TableCell>
                                <div className="flex items-center space-x-2">
                                    <span className="text-sm text-gray-600 font-mono truncate max-w-[150px]">
                                        {flow.flow_id}
                                    </span>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6"
                                        onClick={() =>
                                            handleCopyFlowId(flow.flow_id)
                                        }
                                        title="Copy Flow ID"
                                    >
                                        {copiedFlowId === flow.flow_id ? (
                                            <Check className="h-3 w-3 text-green-600" />
                                        ) : (
                                            <Copy className="h-3 w-3" />
                                        )}
                                    </Button>
                                </div>
                            </TableCell>
                            <TableCell className="font-medium">
                                {flow.name}
                            </TableCell>
                            <TableCell className="max-w-xs truncate">
                                {flow.description}
                            </TableCell>
                            <TableCell>
                                <span
                                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                        flow.is_active
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-gray-100 text-gray-800'
                                    }`}
                                >
                                    {flow.is_active ? 'Active' : 'Inactive'}
                                </span>
                            </TableCell>
                            <TableCell className="text-sm text-gray-600">
                                {flow.created_at as string}
                            </TableCell>
                            <TableCell>
                                <Button
                                    onClick={() => handleFlowClick(flow)}
                                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium"
                                    size="sm"
                                >
                                    <Play className="h-4 w-4 mr-2" />
                                    Builder
                                </Button>
                            </TableCell>
                            <TableCell>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8"
                                        >
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        {flow.is_active ? (
                                            <DropdownMenuItem
                                                onClick={() =>
                                                    handleToggleActivation(flow)
                                                }
                                                disabled={isActivatePending}
                                            >
                                                <PowerOff className="h-4 w-4 mr-2" />
                                                Deactivate
                                            </DropdownMenuItem>
                                        ) : (
                                            <DropdownMenuItem
                                                onClick={() =>
                                                    handleToggleActivation(flow)
                                                }
                                                disabled={isActivatePending}
                                            >
                                                <Power className="h-4 w-4 mr-2" />
                                                Activate
                                            </DropdownMenuItem>
                                        )}
                                        <DropdownMenuItem
                                            variant="destructive"
                                            onClick={() =>
                                                handleDeleteFlow(
                                                    flow.flow_id,
                                                    flow.name
                                                )
                                            }
                                        >
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            Delete
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>

            {isLoading && (
                <div className="text-center py-8">
                    <p className="text-gray-600">Loading flows...</p>
                </div>
            )}

            {error && (
                <div className="text-center py-8">
                    <p className="text-red-600">
                        Error loading flows: {error.message}
                    </p>
                </div>
            )}

            {!isLoading && !error && flows.length === 0 && (
                <div className="text-center py-8">
                    <p className="text-gray-600">
                        No flows found. Create your first flow to get started.
                    </p>
                </div>
            )}

            {/* Pagination Controls */}
            {pagination && flows.length > 0 && (
                <div className="flex items-center justify-end space-x-2 py-4">
                    <Button
                        onClick={() => onPageChange?.(pagination.page - 1)}
                        disabled={pagination.page <= 1}
                        variant="outline"
                        size="sm"
                    >
                        Previous
                    </Button>

                    <span className="text-sm text-gray-600">
                        Page {pagination.page} of {pagination.total_pages}
                    </span>

                    <Button
                        onClick={() => onPageChange?.(pagination.page + 1)}
                        disabled={pagination.page >= pagination.total_pages}
                        variant="outline"
                        size="sm"
                    >
                        Next
                    </Button>
                </div>
            )}

            <ConfirmationDialog />
        </div>
    );
};

export default FlowList;
