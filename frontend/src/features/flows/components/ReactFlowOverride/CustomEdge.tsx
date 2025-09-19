import {
    BaseEdge,
    EdgeLabelRenderer,
    getSimpleBezierPath,
    type EdgeProps,
    useReactFlow,
} from '@xyflow/react';
import React, { useState } from 'react';
import type { CSSProperties } from 'react';

interface CustomEdgeData {
    text?: string;
}

function CustomEdge({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    style,
    markerEnd,
    data,
}: EdgeProps): React.ReactNode {
    const { setEdges } = useReactFlow();
    const [isEditing, setIsEditing] = useState(false);
    const [value, setValue] = useState((data as CustomEdgeData)?.text || '');

    const [edgePath, labelX, labelY] = getSimpleBezierPath({
        sourceX,
        sourceY,
        targetX,
        targetY,
        sourcePosition,
        targetPosition,
    });

    const edgeStyle: CSSProperties = {
        stroke: '#0b8b2bff',
        strokeWidth: 1.5,
        ...style,
    };

    const handleLabelSave = () => {
        setIsEditing(false);
        setEdges(eds =>
            eds.map(e =>
                e.id === id ? { ...e, data: { ...e.data, text: value } } : e
            )
        );
    };

    return (
        <>
            <BaseEdge path={edgePath} markerEnd={markerEnd} style={edgeStyle} />
            <EdgeLabelRenderer>
                <div
                    style={{
                        position: 'absolute',
                        transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
                        fontSize: 10,
                        color: '#222',
                        background: '#fff',
                        padding: '1px 4px',
                        borderRadius: 3,
                        border: '1px solid #ddd',
                        pointerEvents: 'all',
                        minWidth: 40,
                    }}
                    onDoubleClick={() => setIsEditing(true)}
                >
                    {isEditing ? (
                        <input
                            autoFocus
                            value={value}
                            onChange={e => setValue(e.target.value)}
                            onBlur={handleLabelSave}
                            onKeyDown={e => {
                                if (e.key === 'Enter') handleLabelSave();
                            }}
                            style={{
                                width: '100%',
                                fontSize: 10,
                                border: 'none',
                                outline: 'none',
                            }}
                        />
                    ) : (
                        value || 'edit me'
                    )}
                </div>
            </EdgeLabelRenderer>
        </>
    );
}

export default CustomEdge;
