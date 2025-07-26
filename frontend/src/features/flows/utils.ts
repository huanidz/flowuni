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
        console.log('Flow definition string is empty, returning default empty state');
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
      data: {
        label: nodeData.data?.label || nodeData.type,
        node_type: nodeData.data?.node_type || nodeData.type,
        parameters: nodeData.data?.parameters || {},
        input_values: nodeData.data?.input_values || {},
        output_values: nodeData.data?.output_values || {},
      },
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
    return flowDefinition && 
           Array.isArray(flowDefinition.nodes) && 
           Array.isArray(flowDefinition.edges);
  }

  // If it's a string, try to parse it
  if (typeof flowDefinition === 'string') {
    if (flowDefinition.trim() === '') {
      return true; // Empty string is considered valid
    }
    
    try {
      const parsed = JSON.parse(flowDefinition);
      return parsed && 
             typeof parsed === 'object' &&
             Array.isArray(parsed.nodes) && 
             Array.isArray(parsed.edges);
    } catch {
      return false;
    }
  }

  return false;
};