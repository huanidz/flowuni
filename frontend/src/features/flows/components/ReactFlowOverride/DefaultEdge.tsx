import { BaseEdge, getSimpleBezierPath, type EdgeProps } from '@xyflow/react';
import React from 'react';
import type { CSSProperties } from 'react';

function DefaultEdge({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    style,
    markerEnd,
}: EdgeProps): React.ReactNode {
    const [edgePath] = getSimpleBezierPath({
        sourceX,
        sourceY,
        targetX,
        targetY,
        sourcePosition,
        targetPosition,
    });

    const edgeStyle: CSSProperties = {
        stroke: '#3e3e41ff',
        strokeWidth: 2,
        ...style,
    };

    return <BaseEdge path={edgePath} markerEnd={markerEnd} style={edgeStyle} />;
}

export default DefaultEdge;
