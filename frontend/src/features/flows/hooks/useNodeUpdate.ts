// useNodeUpdate.ts
import { useCallback } from 'react';
import type { Node } from '@xyflow/react';

type SetNodesType = React.Dispatch<React.SetStateAction<Node[]>>;

/**
 * Unified hook for handling all node state update operations.
 * to provide a single source of truth for node updates.
 */
export const useNodeUpdate = (setNodes: SetNodesType) => {
  /**
   * Update node input values with a clean, direct approach
   */
  const updateNodeInputData = useCallback(
    (nodeId: string, inputName: string, value: any) => {
      setNodes((nodes) =>
        nodes.map((node) => {
          if (node.id !== nodeId) return node;
          
          return {
            ...node,
            data: {
              ...node.data,
              input_values: {
                ...(node.data.input_values || {}),
                [inputName]: value,
              },
            },
          };
        })
      );
    },
    [setNodes]
  );

  /**
   * Update node mode data
   */
  const updateNodeModeData = useCallback(
    (nodeId: string, newMode: string) => {
      setNodes((nodes) =>
        nodes.map((node) => {
          if (node.id !== nodeId) return node;
          
          return {
            ...node,
            data: {
              ...node.data,
              mode: newMode,
            },
          };
        })
      );
    },
    [setNodes]
  );

  /**
   * Update node parameter values
   */
  const updateNodeParameterData = useCallback(
    (nodeId: string, parameterName: string, value: any) => {
      setNodes((nodes) =>
        nodes.map((node) => {
          if (node.id !== nodeId) return node;
          
          return {
            ...node,
            data: {
              ...node.data,
              parameter_values: {
                ...(node.data.parameter_values || {}),
                [parameterName]: value,
              },
            },
          };
        })
      );
    },
    [setNodes]
  );

  /**
   * Update node data with complete object (for complex updates)
   */
  const updateNodeData = useCallback(
    (nodeId: string, newData: any) => {
      setNodes((nodes) =>
        nodes.map((node) => {
          if (node.id !== nodeId) return node;
          
          return {
            ...node,
            data: {
              ...node.data,
              ...newData,
            },
          };
        })
      );
    },
    [setNodes]
  );

  return {
    updateNodeInputData, // Input data
    updateNodeModeData, // Mode data
    updateNodeParameterData, // Parameter data
    updateNodeData, // General data (Or complete `data` field.)
  };
};