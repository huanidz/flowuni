import React from 'react';
import { Button } from '@/components/ui/button';
import { TrashIcon, RotateCcwIcon } from 'lucide-react';

// Define TypeScript interface for FlowSnapshot based on backend model
export interface FlowSnapshot {
    id: number;
    flow_id: number;
    version: number;
    name?: string;
    description?: string;
    flow_definition: Record<string, any>;
    is_current: boolean;
    snapshot_metadata?: Record<string, any>;
    flow_schema_version?: string;
    created_at?: string;
}

// FlowSnapshotItem component to display individual snapshot
interface FlowSnapshotItemProps {
    snapshot: FlowSnapshot;
    onDelete: (id: number) => void;
    onRestore: (id: number) => void;
}

const FlowSnapshotItem: React.FC<FlowSnapshotItemProps> = ({
    snapshot,
    onDelete,
    onRestore,
}) => {
    return (
        <div className="border rounded-lg p-4 mb-3 bg-white dark:bg-gray-800">
            <div className="flex justify-between items-start">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">
                            Version {snapshot.version}
                        </span>
                        {snapshot.is_current && (
                            <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                                Current
                            </span>
                        )}
                    </div>
                    {snapshot.name && (
                        <h4 className="font-semibold text-lg mb-1">
                            {snapshot.name}
                        </h4>
                    )}
                    {snapshot.description && (
                        <p className="text-gray-600 dark:text-gray-300 text-sm mb-2">
                            {snapshot.description}
                        </p>
                    )}
                    {snapshot.created_at && (
                        <p className="text-gray-500 dark:text-gray-400 text-xs">
                            Created:{' '}
                            {new Date(snapshot.created_at).toLocaleString()}
                        </p>
                    )}
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onRestore(snapshot.id)}
                        className="flex items-center gap-1"
                    >
                        <RotateCcwIcon className="h-4 w-4" />
                        Restore
                    </Button>
                    <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => onDelete(snapshot.id)}
                        className="flex items-center gap-1"
                    >
                        <TrashIcon className="h-4 w-4" />
                        Delete
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default FlowSnapshotItem;
