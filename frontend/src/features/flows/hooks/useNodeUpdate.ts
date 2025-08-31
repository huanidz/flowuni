// useNodeUpdate.ts
import { useCallback, useMemo } from 'react';
import type { Node, Edge } from '@xyflow/react';

type SetNodesType = React.Dispatch<React.SetStateAction<Node[]>>;
type SetEdgesType = React.Dispatch<React.SetStateAction<Edge[]>>;

/**
 * Unified hook for handling all node state update operations.
 * to provide a single source of truth for node updates.
 */
export const useNodeUpdate = (
    setNodes: SetNodesType,
    setEdges: SetEdgesType,
    edges: Edge[]
) => {
    /**
     * Update node input values with a clean, direct approach
     */
    const updateNodeInputData = useCallback(
        (nodeId: string, inputName: string, value: any) => {
            setNodes(nodes =>
                nodes.map(node => {
                    if (node.id !== nodeId) return node;

                    // Check if the value is actually different to prevent unnecessary re-renders
                    const currentInputValues =
                        (node.data?.input_values as Record<string, any>) || {};
                    if (currentInputValues[inputName] === value) {
                        return node;
                    }

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
            setNodes(nodes =>
                nodes.map(node => {
                    if (node.id !== nodeId) return node;

                    // Check if the mode is actually different to prevent unnecessary re-renders
                    if (node.data?.mode === newMode) {
                        return node;
                    }

                    // Only update mode, handle edges separately
                    return {
                        ...node,
                        data: {
                            ...node.data,
                            mode: newMode,
                        },
                    };
                })
            );

            // Handle edge removal in a separate effect or after state update
            // This will fix the bug of node start dragging when switching mode.
            setTimeout(() => {
                const edgesToRemove = edges.filter(
                    edge => edge.source === nodeId || edge.target === nodeId
                );
                if (edgesToRemove.length > 0) {
                    setEdges(prevEdges =>
                        prevEdges.filter(
                            edge =>
                                edge.source !== nodeId && edge.target !== nodeId
                        )
                    );
                }
            }, 0);
        },
        [setNodes, setEdges, edges]
    );

    /**
     * Update node parameter values
     */
    const updateNodeParameterData = useCallback(
        (nodeId: string, parameterName: string, value: any) => {
            setNodes(nodes =>
                nodes.map(node => {
                    if (node.id !== nodeId) return node;

                    // Check if the value is actually different to prevent unnecessary re-renders
                    const currentParameterValues =
                        (node.data?.parameter_values as Record<string, any>) ||
                        {};
                    if (currentParameterValues[parameterName] === value) {
                        return node;
                    }

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

    const updateNodeToolConfigData = useCallback(
        (nodeId: string, toolConfigName: string, value: any) => {
            setNodes(nodes =>
                nodes.map(node => {
                    if (node.id !== nodeId) return node;

                    // Check if the value is actually different to prevent unnecessary re-renders
                    const currentToolConfigs =
                        (node.data?.tool_configs as Record<string, any>) || {};
                    if (currentToolConfigs[toolConfigName] === value) {
                        return node;
                    }

                    return {
                        ...node,
                        data: {
                            ...node.data,
                            tool_configs: {
                                ...(node.data.tool_configs || {}),
                                [toolConfigName]: value,
                            },
                        },
                    };
                })
            );
        },
        [setNodes]
    );

    /**
     * Update node execution result
     */
    const updateNodeExecutionResult = useCallback(
        (nodeId: string, result: string) => {
            setNodes(nodes =>
                nodes.map(node => {
                    if (node.id !== nodeId) return node;

                    // Check if the result is actually different to prevent unnecessary re-renders
                    if (node.data?.execution_result === result) {
                        return node;
                    }

                    return {
                        ...node,
                        data: {
                            ...node.data,
                            execution_result: result,
                        },
                    };
                })
            );
        },
        [setNodes]
    );

    /**
     * Update node execution status
     */
    const updateNodeExecutionStatus = useCallback(
        (nodeId: string, status: string) => {
            setNodes(nodes =>
                nodes.map(node => {
                    if (node.id !== nodeId) return node;

                    // Check if the status is actually different to prevent unnecessary re-renders
                    if (node.data?.execution_status === status) {
                        return node;
                    }

                    return {
                        ...node,
                        data: {
                            ...node.data,
                            execution_status: status,
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
            setNodes(nodes =>
                nodes.map(node => {
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

    // Memoize the returned object to prevent unnecessary re-renders
    return useMemo(
        () => ({
            updateNodeInputData, // Input data
            updateNodeModeData, // Mode data
            updateNodeParameterData, // Parameter data
            updateNodeToolConfigData, // Tool config data
            updateNodeExecutionResult, // Execution result
            updateNodeExecutionStatus, // Execution status
            updateNodeData, // General data (Or complete `data` field.)
        }),
        [
            updateNodeInputData,
            updateNodeModeData,
            updateNodeParameterData,
            updateNodeToolConfigData,
            updateNodeExecutionResult,
            updateNodeExecutionStatus,
            updateNodeData,
        ]
    );
};
