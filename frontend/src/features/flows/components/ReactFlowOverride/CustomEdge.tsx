import {
    BaseEdge,
    EdgeLabelRenderer,
    getBezierPath,
    type EdgeProps,
} from '@xyflow/react';
import React from 'react';
import type { CSSProperties } from 'react';

interface CustomEdgeData {
    text?: string;
}

/**
 * Custom edge component for React Flow with TypeScript support
 * Displays a bezier path edge with a customizable label
 */
function CustomEdge({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    style,
    markerEnd,
    data,
}: EdgeProps): React.ReactNode {
    const [edgePath, labelX, labelY] = getBezierPath({
        sourceX,
        sourceY,
        targetX,
        targetY,
    });

    const edgeStyle: CSSProperties = style || {};

    return (
        <>
            <BaseEdge path={edgePath} markerEnd={markerEnd} style={edgeStyle} />
            <EdgeLabelRenderer>
                <div
                    style={{
                        position: 'absolute',
                        transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
                        pointerEvents: 'all',
                        background: 'white',
                        padding: 2,
                        borderRadius: 4,
                        fontSize: 12,
                    }}
                >
                    {(data as CustomEdgeData)?.text || 'default'}
                </div>
            </EdgeLabelRenderer>
        </>
    );
}

export default CustomEdge;
