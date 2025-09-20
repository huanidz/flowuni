import React from 'react';
import { Button } from '@/components/ui/button';
import { Trash2, RotateCcw, FileText, Clock, Database } from 'lucide-react';
import type { FlowSnapshot } from '../types';
import { parseFlowDefinition } from '@/features/flows/utils';
import type { ParsedFlowData } from '@/features/flows/utils';

// FlowSnapshotItem component to display individual snapshot
interface FlowSnapshotItemProps {
    snapshot: FlowSnapshot;
    onDelete: (id: number) => void;
    onRestore: (flowData: ParsedFlowData) => void;
}

const FlowSnapshotItem: React.FC<FlowSnapshotItemProps> = ({
    snapshot,
    onDelete,
    onRestore,
}) => {
    console.log('snapshot: ', snapshot);

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return 'N/A';
        const date = new Date(dateStr);
        return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    };

    const getNodeCount = () => {
        return snapshot.flow_definition?.nodes?.length || 0;
    };

    const getEdgeCount = () => {
        return snapshot.flow_definition?.edges?.length || 0;
    };

    const handleRestore = () => {
        try {
            // The flow_definition might already be in the correct format, so we need to handle it properly
            const flowDefinition = snapshot.flow_definition as any;
            const parsedFlowData = parseFlowDefinition(flowDefinition);
            onRestore(parsedFlowData);
        } catch (error) {
            console.error('Error restoring flow snapshot:', error);
        }
    };

    return (
        <div
            className={`relative border-l-4 border-l-slate-300 dark:border-l-slate-600 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all duration-200`}
        >
            {/* Header Bar */}
            <div
                className={`px-3 py-2 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700`}
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                                VER
                            </span>
                            <span className="font-bold text-lg leading-none">
                                {String(snapshot.version).padStart(3, '0')}
                            </span>
                        </div>
                        <div className="h-4 w-px bg-slate-300 dark:bg-slate-600"></div>
                        <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                            ID:{snapshot.id}
                        </span>
                    </div>

                    <div className="flex gap-1">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleRestore}
                            className="h-7 px-2 text-xs font-medium hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                        >
                            <RotateCcw className="h-3 w-3 mr-1" />
                            RESTORE
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDelete(snapshot.id)}
                            className="h-7 px-2 text-xs font-medium hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400"
                        >
                            <Trash2 className="h-3 w-3 mr-1" />
                            DEL
                        </Button>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="p-3">
                {/* Title and Description */}
                <div className="mb-3">
                    {snapshot.name && (
                        <h4 className="font-semibold text-sm mb-1 text-slate-900 dark:text-slate-100">
                            {snapshot.name}
                        </h4>
                    )}
                    {snapshot.description && (
                        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                            {snapshot.description}
                        </p>
                    )}
                </div>

                {/* Metadata Grid */}
                <div className="grid grid-cols-3 gap-3 text-xs">
                    {/* Timestamp */}
                    <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-slate-400" />
                        <div>
                            <div className="text-slate-500 dark:text-slate-400 uppercase tracking-wide font-mono text-[10px]">
                                Created
                            </div>
                            <div className="font-mono text-slate-700 dark:text-slate-300">
                                {formatDate(snapshot.created_at)}
                            </div>
                        </div>
                    </div>

                    {/* Flow Composition */}
                    <div className="flex items-center gap-1">
                        <Database className="h-3 w-3 text-slate-400" />
                        <div>
                            <div className="text-slate-500 dark:text-slate-400 uppercase tracking-wide font-mono text-[10px]">
                                Nodes/Edges
                            </div>
                            <div className="font-mono text-slate-700 dark:text-slate-300">
                                {getNodeCount()}N / {getEdgeCount()}E
                            </div>
                        </div>
                    </div>

                    {/* Schema Version */}
                    <div className="flex items-center gap-1">
                        <FileText className="h-3 w-3 text-slate-400" />
                        <div>
                            <div className="text-slate-500 dark:text-slate-400 uppercase tracking-wide font-mono text-[10px]">
                                Schema
                            </div>
                            <div className="font-mono text-slate-700 dark:text-slate-300">
                                {snapshot.flow_schema_version || 'v1.0'}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Additional metadata if available */}
                {snapshot.snapshot_metadata &&
                    Object.keys(snapshot.snapshot_metadata).length > 0 && (
                        <div className="mt-3 pt-2 border-t border-slate-200 dark:border-slate-700">
                            <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wide font-mono mb-1">
                                Metadata
                            </div>
                            <div className="flex flex-wrap gap-1">
                                {Object.entries(snapshot.snapshot_metadata).map(
                                    ([key, value]) => (
                                        <span
                                            key={key}
                                            className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-[10px] font-mono"
                                        >
                                            {key}: {String(value)}
                                        </span>
                                    )
                                )}
                            </div>
                        </div>
                    )}
            </div>
        </div>
    );
};

export default FlowSnapshotItem;
