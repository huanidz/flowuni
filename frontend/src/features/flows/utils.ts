// utils/parseFlowDefinition.ts
import type { Node, Edge } from '@xyflow/react';

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
      parameters: Record<string, any>;
      input_values: Record<string, any>;
      output_values: Record<string, any>;
    };
  }>;
  edges: Array<{
    id: string;
    source: string;
    target: string;
    sourceHandle?: string;
    targetHandle?: string;
  }>;
}

/**
 * Parses flow_definition JSON string back to nodes and edges
 * @param flowDefinition - JSON string from backend
 * @returns ParsedFlowData with nodes and edges arrays
 */
export const parseFlowDefinition = (
  flowDefinition: string | null | undefined
): ParsedFlowData => {
  // Default empty state
  const defaultResult: ParsedFlowData = {
    nodes: [],
    edges: [],
  };

  // Handle null/undefined/empty cases
  if (!flowDefinition || flowDefinition.trim() === '') {
    console.log('Flow definition is empty, returning default empty state');
    return defaultResult;
  }

  try {
    const parsedData: FlowDefinitionData = JSON.parse(flowDefinition);
    
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
      data: {
        label: nodeData.data?.label || nodeData.type,
        node_type: nodeData.data?.node_type || nodeData.type,
        parameters: nodeData.data?.parameters || {},
        input_values: nodeData.data?.input_values || {},
        output_values: nodeData.data?.output_values || {},
      },
      style: { background: '#fff', color: '#000' },
      sourcePosition: 'right' as const,
      targetPosition: 'left' as const,
    }));

    // Parse edges
    const edges: Edge[] = (parsedData.edges || []).map(edgeData => ({
      id: edgeData.id,
      source: edgeData.source,
      target: edgeData.target,
      sourceHandle: edgeData.sourceHandle,
      targetHandle: edgeData.targetHandle,
    }));

    console.log(`Successfully parsed flow definition: ${nodes.length} nodes, ${edges.length} edges`);
    
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
 * Validates if a flow definition string is valid JSON
 * @param flowDefinition - JSON string to validate
 * @returns boolean indicating if the JSON is valid
 */
export const isValidFlowDefinition = (
  flowDefinition: string | null | undefined
): boolean => {
  if (!flowDefinition || flowDefinition.trim() === '') {
    return true; // Empty is considered valid (will result in empty flow)
  }

  try {
    const parsed = JSON.parse(flowDefinition);
    return parsed && typeof parsed === 'object';
  } catch {
    return false;
  }
};