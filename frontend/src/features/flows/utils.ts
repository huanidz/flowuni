// utils/parseFlowDefinition.ts
import type { Node, Edge } from '@xyflow/react';
import { Position } from '@xyflow/react';
export interface ParsedFlowData {
    nodes: Node[];
    edges: Edge[];
}

export interface FlowDefinitionData {
    nodes: Array<{
        id: string;
        type: string;
        position: { x: number; y: number };
        data: {
            label: string;
            node_type: string;
            parameter_values: Record<string, any>;
            input_values: Record<string, any>;
            output_values: Record<string, any>;
            mode: string;
            tool_configs: Record<string, any>;
            execution_results: string;
            execution_status: string;
        };
    }>;
    edges: Array<{
        id: string;
        source: string;
        target: string;
        sourceHandle?: string;
        targetHandle?: string;
        type?: string;
        data?: Record<string, any>;
    }>;
}

/**
 * Parses flow_definition object or JSON string back to nodes and edges
 * @param flowDefinition - Object or JSON string from backend
 * @returns ParsedFlowData with nodes and edges arrays
 */
export const parseFlowDefinition = (
    flowDefinition: FlowDefinitionData | string | null | undefined
): ParsedFlowData => {
    // Default empty state
    const defaultResult: ParsedFlowData = {
        nodes: [],
        edges: [],
    };

    // Handle null/undefined cases
    if (!flowDefinition) {
        console.log('Flow definition is empty, returning default empty state');
        return defaultResult;
    }

    let parsedData: FlowDefinitionData;

    try {
        // If it's a string, parse it as JSON
        if (typeof flowDefinition === 'string') {
            if (flowDefinition.trim() === '') {
                console.log(
                    'Flow definition string is empty, returning default empty state'
                );
                return defaultResult;
            }
            parsedData = JSON.parse(flowDefinition);
        } else {
            // If it's already an object, use it directly
            parsedData = flowDefinition;
        }

        // Validate parsed data structure
        if (!parsedData || typeof parsedData !== 'object') {
            console.warn('Invalid flow definition structure');
            return defaultResult;
        }

        // Parse nodes
        const nodes: Node[] = (parsedData.nodes || []).map(nodeData => ({
            id: nodeData.id,
            type: nodeData.type,
            position: nodeData.position || { x: 0, y: 0 },
            data: nodeData.data,
            style: { background: '#fff', color: '#000' },
            sourcePosition: Position.Right,
            targetPosition: Position.Left,
        }));

        // Parse edges
        const edges: Edge[] = (parsedData.edges || []).map(edgeData => ({
            id: edgeData.id,
            source: edgeData.source,
            target: edgeData.target,
            sourceHandle: edgeData.sourceHandle,
            targetHandle: edgeData.targetHandle,
            type: edgeData.type,
            data: edgeData.data,
        }));

        console.log(
            `Successfully parsed flow definition: ${nodes.length} nodes, ${edges.length} edges`
        );

        return {
            nodes,
            edges,
        };
    } catch (error) {
        console.error('Error parsing flow definition:', error);
        return defaultResult;
    }
};

/**
 * Validates if a flow definition is valid
 * @param flowDefinition - Object or JSON string to validate
 * @returns boolean indicating if the flow definition is valid
 */
export const isValidFlowDefinition = (
    flowDefinition: FlowDefinitionData | string | null | undefined
): boolean => {
    if (!flowDefinition) {
        return true; // Empty is considered valid (will result in empty flow)
    }

    // If it's already an object, validate its structure
    if (typeof flowDefinition === 'object') {
        return (
            flowDefinition &&
            Array.isArray(flowDefinition.nodes) &&
            Array.isArray(flowDefinition.edges)
        );
    }

    // If it's a string, try to parse it
    if (typeof flowDefinition === 'string') {
        if (flowDefinition.trim() === '') {
            return true; // Empty string is considered valid
        }

        try {
            const parsed = JSON.parse(flowDefinition);
            return (
                parsed &&
                typeof parsed === 'object' &&
                Array.isArray(parsed.nodes) &&
                Array.isArray(parsed.edges)
            );
        } catch {
            return false;
        }
    }

    return false;
};

export const getFlowGraphData = (nodes: Node[], edges: Edge[]) => ({
    nodes: nodes.map(({ id, type, position, data }) => ({
        id,
        type,
        position,
        data,
    })),
    edges: edges.map(
        ({ id, source, target, sourceHandle, targetHandle, data, type }) => ({
            id,
            source,
            target,
            sourceHandle,
            targetHandle,
            data,
            type, // Include the edge type when saving flow data
        })
    ),
});

export const logNodeDetails = (nodes: Node[]) => {
    nodes.forEach((node, index) => {
        console.log(`Node ${index} (${node.id}):`, {
            type: node.type,
            parameter_values: node.data.parameter_values,
            input_values: node.data.input_values,
            output_values: node.data.output_values,
            fullData: node.data,
        });
    });
};
// --- Shared helpers for connection/handle parsing ---
/**
 * Extract handle index from a handle string of format "<id>:<index>"
 * Returns null if invalid or handle is null.
 */
export const extractHandleIndex = (handle: string | null): number | null => {
    if (handle === null) return null;
    const parts = handle.split(':');
    if (parts.length < 2) {
        // Invalid handle format
        return null;
    }
    const idx = parseInt(parts[1], 10);
    if (isNaN(idx)) return null;
    return idx;
};

/**
 * Given connection source info and node specs, return the output type name of the source output handle.
 * - params: object with source and sourceHandle (sourceHandle can be null for tool nodes)
 * - nodes: current RF nodes
 * - getNodeSpecByRFNodeType: function to get NodeSpec by node.type
 *
 * Returns the output IO type name (e.g., 'RouterOutputHandle') or undefined when cannot determine.
 */
export const getSourceOutputTypeName = (
    params: { source: string; sourceHandle: string | null },
    nodes: Node[],
    getNodeSpecByRFNodeType: (nodeName: string) => any | undefined
): string | undefined => {
    const { source, sourceHandle } = params;
    const sourceNode = nodes.find(n => n.id === source);
    if (!sourceNode) return undefined;
    const sourceNodeSpec = getNodeSpecByRFNodeType(sourceNode.type ?? '');
    if (!sourceNodeSpec) return undefined;
    let handleIndex: number;
    if (sourceHandle === null) {
        handleIndex = 0;
    } else {
        const idx = extractHandleIndex(sourceHandle);
        if (idx === null) return undefined;
        handleIndex = idx;
    }
    const outputSpec = sourceNodeSpec.outputs?.[handleIndex];
    if (!outputSpec) return undefined;
    return outputSpec.type_detail?.type;
};
