import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Archive } from 'lucide-react';
import FlowSnapshotItem from '@/features/flows/sub_features/flow_snapshots/components/FlowSnapshotItem';
import {
    useFlowSnapshots,
    useCreateFlowSnapshot,
    useDeleteFlowSnapshot,
} from '@/features/flows/sub_features/flow_snapshots/hooks';
import { getFlowGraphData } from '@/features/flows/utils';
import { useReactFlow } from '@xyflow/react';
import type { FlowSnapshot } from '@/features/flows/sub_features/flow_snapshots/types';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

// LCVersionContent component with "Create Snapshot" button and list of FlowSnapshotItems
const LCVersionContent: React.FC<{ flowId: string }> = ({ flowId }) => {
    const { setNodes, setEdges, getEdges, getNodes } = useReactFlow();
    const [page, setPage] = useState(1);
    const [perPage] = useState(10);
    const [isCreateSnapshotDialogOpen, setIsCreateSnapshotDialogOpen] =
        useState(false);

    // Get flow snapshots using React Query
    const {
        data: snapshotsData,
        isLoading,
        error,
    } = useFlowSnapshots({
        flow_id: flowId,
        page,
        per_page: perPage,
    });

    // Mutations for CRUD operations
    const createSnapshotMutation = useCreateFlowSnapshot();
    const deleteSnapshotMutation = useDeleteFlowSnapshot();

    // Extract snapshots from the response data
    const snapshots: FlowSnapshot[] = snapshotsData?.data || [];
    const totalCount = snapshotsData?.total_count || 0;

    // Function to handle creating a new snapshot
    const handleCreateSnapshot = () => {
        // Get current flow definition
        const nodes = getNodes();
        const edges = getEdges();
        const flowDefinition = getFlowGraphData(nodes, edges);

        // Create the snapshot request
        const newSnapshot = {
            flow_id: flowId,
            name: `Version ${new Date().toLocaleDateString()}`,
            description: `Snapshot created on ${new Date().toLocaleString()}`,
            flow_definition: flowDefinition,
            flow_schema_version: 'v1.0',
            snapshot_metadata: {
                author: 'user',
                source: 'manual',
                created_at: new Date().toISOString(),
            },
        };

        // Call the API to create the snapshot
        createSnapshotMutation.mutate(newSnapshot);
        setIsCreateSnapshotDialogOpen(false);
    };

    // Function to open the create snapshot confirmation dialog
    const handleOpenCreateSnapshotDialog = () => {
        setIsCreateSnapshotDialogOpen(true);
    };

    // Function to handle deleting a snapshot
    const handleDeleteSnapshot = (id: number) => {
        deleteSnapshotMutation.mutate(id);
    };

    // Function to handle restoring a snapshot
    const handleRestoreSnapshot = (flowData: {
        nodes: any[];
        edges: any[];
    }) => {
        console.log('Restore: ', flowData);
        setNodes(flowData.nodes);
        setEdges(flowData.edges);
    };

    return (
        <>
            <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900">
                {/* Header Section */}
                <div className="flex-shrink-0 bg-white dark:bg-slate-800 border-b-2 border-slate-200 dark:border-slate-700 shadow-sm">
                    <div className="p-4">
                        {/* Title Bar */}
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <Archive className="h-6 w-6 text-slate-600 dark:text-slate-400" />
                                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                                    Flow Snapshots Management
                                </h2>
                                <div className="h-6 w-px bg-slate-300 dark:bg-slate-600"></div>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                                        Total Snapshots:
                                    </span>
                                    <span className="text-sm font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded">
                                        {totalCount}
                                    </span>
                                </div>
                            </div>

                            <Button
                                onClick={handleOpenCreateSnapshotDialog}
                                disabled={createSnapshotMutation.isPending}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 text-sm shadow-sm"
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                {createSnapshotMutation.isPending
                                    ? 'CREATING...'
                                    : 'CREATE SNAPSHOT'}
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-grow overflow-hidden flex flex-col">
                    <div className="flex-grow overflow-y-auto p-4">
                        {isLoading ? (
                            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm p-8 text-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                                    Loading Snapshots
                                </h3>
                                <p className="text-slate-500 dark:text-slate-400 text-sm max-w-md mx-auto">
                                    Please wait while we load your flow
                                    snapshots...
                                </p>
                            </div>
                        ) : error ? (
                            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm p-8 text-center">
                                <Archive className="h-12 w-12 text-red-400 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                                    Error Loading Snapshots
                                </h3>
                                <p className="text-slate-500 dark:text-slate-400 text-sm max-w-md mx-auto">
                                    There was an error loading your snapshots.
                                    Please try again later.
                                </p>
                            </div>
                        ) : snapshots.length === 0 ? (
                            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm p-8 text-center">
                                <Archive className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                                    No Snapshots Available
                                </h3>
                                <p className="text-slate-500 dark:text-slate-400 text-sm max-w-md mx-auto">
                                    Create a snapshot to save the current state
                                    of your flow. Snapshots allow you to
                                    preserve different versions and restore them
                                    when needed.
                                </p>
                                <Button
                                    onClick={handleOpenCreateSnapshotDialog}
                                    disabled={createSnapshotMutation.isPending}
                                    className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-medium"
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    {createSnapshotMutation.isPending
                                        ? 'CREATING...'
                                        : 'Create First Snapshot'}
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {/* Section Header - Sticky */}
                                <div className="sticky top-0 bg-slate-50 dark:bg-slate-900 z-10 py-2">
                                    <div className="flex items-center gap-2 mb-4">
                                        <span className="text-xs font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                                            Snapshot History
                                        </span>
                                        <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700"></div>
                                        <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                                            {totalCount} items
                                        </span>
                                    </div>
                                </div>

                                {snapshots
                                    .sort((a, b) => {
                                        // Sort by version (highest first)
                                        return b.version - a.version;
                                    })
                                    .map(snapshot => (
                                        <FlowSnapshotItem
                                            key={snapshot.id}
                                            snapshot={snapshot}
                                            onDelete={handleDeleteSnapshot}
                                            onRestore={handleRestoreSnapshot}
                                        />
                                    ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Create Snapshot Confirmation Dialog */}
            <Dialog
                open={isCreateSnapshotDialogOpen}
                onOpenChange={setIsCreateSnapshotDialogOpen}
            >
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Create Snapshot</DialogTitle>
                        <DialogDescription>
                            Do you want to create a snapshot? This will use
                            current flow in the canvas as the flow data for the
                            snapshot.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsCreateSnapshotDialogOpen(false)}
                            disabled={createSnapshotMutation.isPending}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleCreateSnapshot}
                            disabled={createSnapshotMutation.isPending}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            {createSnapshotMutation.isPending
                                ? 'CREATING...'
                                : 'Create Snapshot'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default LCVersionContent;
