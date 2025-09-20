import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { PlusIcon } from 'lucide-react';
import FlowSnapshotItem from '@/features/flows/sub_features/flow_snapshots/components/FlowSnapshotItem';
import type { FlowSnapshot } from '@/features/flows/sub_features/flow_snapshots/components/FlowSnapshotItem';

// LCVersionContent component with "Create Snapshot" button and list of FlowSnapshotItems
const LCVersionContent: React.FC = () => {
    // Dummy data that matches the backend FlowSnapshotModel structure
    const [snapshots, setSnapshots] = useState<FlowSnapshot[]>([
        {
            id: 1,
            flow_id: 1,
            version: 1,
            name: 'Initial Version',
            description: 'First version of the flow',
            flow_definition: { nodes: [], edges: [] },
            is_current: false,
            created_at: '2023-01-15T10:30:00Z',
        },
        {
            id: 2,
            flow_id: 1,
            version: 2,
            name: 'Added LLM Node',
            description: 'Added LLM processing node to the flow',
            flow_definition: { nodes: [{ id: '1', type: 'llm' }], edges: [] },
            is_current: true,
            created_at: '2023-01-20T14:45:00Z',
        },
        {
            id: 3,
            flow_id: 1,
            version: 3,
            name: 'Enhanced Flow',
            description: 'Added conditional routing and data transformation',
            flow_definition: {
                nodes: [
                    { id: '1', type: 'llm' },
                    { id: '2', type: 'router' },
                ],
                edges: [{ id: 'e1', source: '1', target: '2' }],
            },
            is_current: false,
            created_at: '2023-02-05T09:15:00Z',
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
            description: `Snapshot created on ${new Date().toLocaleDateString()}`,
            flow_definition: { nodes: [], edges: [] }, // In a real app, this would be the current flow definition
            is_current: false,
            created_at: new Date().toISOString(),
        };

        setSnapshots([...snapshots, newSnapshot]);
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

    return (
        <div className="p-4">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Version Management</h3>
                <Button
                    onClick={handleCreateSnapshot}
                    className="flex items-center gap-1"
                >
                    <PlusIcon className="h-4 w-4" />
                    Create Snapshot
                </Button>
            </div>

            <div className="mt-4">
                {snapshots.length === 0 ? (
                    <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                        No snapshots available. Create a snapshot to save the
                        current state of your flow.
                    </p>
                ) : (
                    <div className="space-y-3">
                        {snapshots.map(snapshot => (
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
