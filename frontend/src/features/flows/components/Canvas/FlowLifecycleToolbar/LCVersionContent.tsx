import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Archive, Activity, TrendingUp, Layers } from 'lucide-react';
import FlowSnapshotItem from '@/features/flows/sub_features/flow_snapshots/components/FlowSnapshotItem';
import { type FlowSnapshot } from '@/features/flows/sub_features/flow_snapshots/components/FlowSnapshotItem';

// LCVersionContent component with "Create Snapshot" button and list of FlowSnapshotItems
const LCVersionContent: React.FC = () => {
    // Dummy data that matches the backend FlowSnapshotModel structure
    const [snapshots, setSnapshots] = useState<FlowSnapshot[]>([
        {
            id: 1,
            flow_id: 1,
            version: 1,
            name: 'Initial Version',
            description:
                'First version of the flow with basic setup and configuration',
            flow_definition: { nodes: [], edges: [] },
            is_current: false,
            created_at: '2023-01-15T10:30:00Z',
            flow_schema_version: 'v1.0',
            snapshot_metadata: { author: 'system', source: 'auto' },
        },
        {
            id: 2,
            flow_id: 1,
            version: 2,
            name: 'Added LLM Node',
            description:
                'Added LLM processing node to the flow with OpenAI integration',
            flow_definition: { nodes: [{ id: '1', type: 'llm' }], edges: [] },
            is_current: true,
            created_at: '2023-01-20T14:45:00Z',
            flow_schema_version: 'v1.1',
            snapshot_metadata: {
                author: 'user',
                source: 'manual',
                model: 'gpt-4',
            },
        },
        {
            id: 3,
            flow_id: 1,
            version: 3,
            name: 'Enhanced Flow',
            description:
                'Added conditional routing and data transformation with advanced error handling',
            flow_definition: {
                nodes: [
                    { id: '1', type: 'llm' },
                    { id: '2', type: 'router' },
                ],
                edges: [{ id: 'e1', source: '1', target: '2' }],
            },
            is_current: false,
            created_at: '2023-02-05T09:15:00Z',
            flow_schema_version: 'v1.2',
            snapshot_metadata: {
                author: 'user',
                source: 'manual',
                complexity: 'high',
            },
        },
    ]);

    // Function to handle creating a new snapshot
    const handleCreateSnapshot = () => {
        const newVersion = Math.max(...snapshots.map(s => s.version), 0) + 1;
        const newSnapshot: FlowSnapshot = {
            id: snapshots.length + 1,
            flow_id: 1,
            version: newVersion,
            name: `Version ${newVersion}`,
            description: `Snapshot created on ${new Date().toLocaleDateString()} - Auto-generated snapshot`,
            flow_definition: { nodes: [], edges: [] }, // In a real app, this would be the current flow definition
            is_current: false,
            created_at: new Date().toISOString(),
            flow_schema_version: 'v1.2',
            snapshot_metadata: { author: 'user', source: 'manual' },
        };

        // Mark all others as not current and set new one as current
        setSnapshots([
            ...snapshots.map(s => ({ ...s, is_current: false })),
            { ...newSnapshot, is_current: true },
        ]);
    };

    // Function to handle deleting a snapshot
    const handleDeleteSnapshot = (id: number) => {
        setSnapshots(snapshots.filter(snapshot => snapshot.id !== id));
    };

    // Function to handle restoring from a snapshot
    const handleRestoreSnapshot = (id: number) => {
        setSnapshots(
            snapshots.map(snapshot => ({
                ...snapshot,
                is_current: snapshot.id === id,
            }))
        );
    };

    // Calculate statistics
    const totalSnapshots = snapshots.length;
    const currentSnapshot = snapshots.find(s => s.is_current);
    const totalNodes = snapshots.reduce(
        (sum, s) => sum + (s.flow_definition?.nodes?.length || 0),
        0
    );
    const totalEdges = snapshots.reduce(
        (sum, s) => sum + (s.flow_definition?.edges?.length || 0),
        0
    );

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
            {/* Header Section */}
            <div className="bg-white dark:bg-slate-800 border-b-2 border-slate-200 dark:border-slate-700 shadow-sm">
                <div className="p-4">
                    {/* Title Bar */}
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <Archive className="h-6 w-6 text-slate-600 dark:text-slate-400" />
                            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                                Version Management System
                            </h2>
                            <div className="h-6 w-px bg-slate-300 dark:bg-slate-600"></div>
                            <span className="text-sm font-mono text-slate-500 dark:text-slate-400">
                                FLOW.ID.001
                            </span>
                        </div>

                        <Button
                            onClick={handleCreateSnapshot}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 text-sm shadow-sm"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            CREATE SNAPSHOT
                        </Button>
                    </div>

                    {/* Statistics Dashboard */}
                    <div className="grid grid-cols-4 gap-4">
                        {/* Total Snapshots */}
                        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-3 rounded-sm">
                            <div className="flex items-center gap-2 mb-1">
                                <Layers className="h-4 w-4 text-blue-500" />
                                <span className="text-xs font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                                    Total Snapshots
                                </span>
                            </div>
                            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                                {totalSnapshots}
                            </div>
                        </div>

                        {/* Active Version */}
                        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-3 rounded-sm">
                            <div className="flex items-center gap-2 mb-1">
                                <Activity className="h-4 w-4 text-emerald-500" />
                                <span className="text-xs font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                                    Active Version
                                </span>
                            </div>
                            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                                {currentSnapshot
                                    ? String(currentSnapshot.version).padStart(
                                          3,
                                          '0'
                                      )
                                    : '---'}
                            </div>
                        </div>

                        {/* Total Nodes */}
                        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-3 rounded-sm">
                            <div className="flex items-center gap-2 mb-1">
                                <TrendingUp className="h-4 w-4 text-orange-500" />
                                <span className="text-xs font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                                    Total Nodes
                                </span>
                            </div>
                            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                                {totalNodes}
                            </div>
                        </div>

                        {/* Total Edges */}
                        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-3 rounded-sm">
                            <div className="flex items-center gap-2 mb-1">
                                <TrendingUp className="h-4 w-4 text-purple-500" />
                                <span className="text-xs font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                                    Total Edges
                                </span>
                            </div>
                            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                                {totalEdges}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="p-4">
                {snapshots.length === 0 ? (
                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm p-8 text-center">
                        <Archive className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                            No Snapshots Available
                        </h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm max-w-md mx-auto">
                            Create a snapshot to save the current state of your
                            flow. Snapshots allow you to preserve different
                            versions and restore them when needed.
                        </p>
                        <Button
                            onClick={handleCreateSnapshot}
                            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-medium"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Create First Snapshot
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {/* Section Header */}
                        <div className="flex items-center gap-2 mb-4">
                            <span className="text-xs font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                                Snapshot History
                            </span>
                            <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700"></div>
                            <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                                {snapshots.length} items
                            </span>
                        </div>

                        {snapshots
                            .sort((a, b) => b.version - a.version)
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
    );
};

export default LCVersionContent;
