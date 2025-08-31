// useNodeTypes.ts
import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { NodeFactory } from '@/features/flows/utils/NodeFactory';
import { useNodeRegistry, type NodeSpec } from '@/features/nodes';

/**
 * Hook to register all available node types as React components.
 * Simplified to return nodeTypes directly and manage state internally.
 * Separates node type registration from state management.
 *
 * @param setNodes - Callback to update nodes state from useNodesState.
 * @param updateNodeInputData - Function to update node data
 * @param updateNodeModeData - Function to update node mode data
 * @param updateNodeParameterData - Function to update node parameter data
 * @returns Object containing nodeTypes and loading state.
 */
export const useNodeTypes = (
    updateNodeInputData?: (
        nodeId: string,
        inputName: string,
        newData: any
    ) => void,
    updateNodeModeData?: (nodeId: string, newMode: string) => void,
    updateNodeParameterData?: (
        nodeId: string,
        parameterName: string,
        value: any
    ) => void,
    updateNodeToolConfigData?: (
        nodeId: string,
        toolConfigName: string,
        value: any
    ) => void,
    updateNodeExecutionResult?: (nodeId: string, result: string) => void,
    updateNodeExecutionStatus?: (nodeId: string, status: string) => void
) => {
    const { getAllNodeSpecs, loaded } = useNodeRegistry();
    const [nodeTypes, setNodeTypes] = useState<Record<string, React.FC<any>>>(
        {}
    );
    const [nodeTypesLoaded, setNodeTypesLoaded] = useState(false);

    // Use a ref to track if nodeTypes have been initialized
    const nodeTypesInitialized = useRef(false);

    // Memoize the nodeTypes object to prevent ReactFlow warning
    // This ensures the object reference remains stable after initial creation
    const memoizedNodeTypes = useMemo(() => {
        return nodeTypes;
    }, [nodeTypes]);

    // Memoize the update handlers to prevent unnecessary re-renders
    const memoizedUpdateHandlers = useMemo(
        () => ({
            updateNodeInputData,
            updateNodeModeData,
            updateNodeParameterData,
            updateNodeToolConfigData,
            updateNodeExecutionResult,
            updateNodeExecutionStatus,
        }),
        [
            updateNodeInputData,
            updateNodeModeData,
            updateNodeParameterData,
            updateNodeToolConfigData,
            updateNodeExecutionResult,
            updateNodeExecutionStatus,
        ]
    );

    useEffect(() => {
        // Wait until the node registry is fully loaded
        if (!loaded) {
            setNodeTypesLoaded(false);
            return;
        }

        // Only initialize nodeTypes once to prevent reference changes
        if (nodeTypesInitialized.current) {
            return;
        }

        // Fetch all node specifications from the registry
        const allNodeSpecs = getAllNodeSpecs();

        console.log('All node specs:', allNodeSpecs);

        // Create an object to hold the generated React components for each node
        const nodeTypeMap: Record<string, React.FC<any>> = {};

        allNodeSpecs.forEach((nodeSpec: NodeSpec) => {
            // console.log("Node spec:", nodeSpec);

            // Use the factory to create a component for each node type
            // Pass the memoized update handlers
            const CustomNodeComponent = NodeFactory.createNodeComponent(
                nodeSpec,
                memoizedUpdateHandlers.updateNodeInputData,
                memoizedUpdateHandlers.updateNodeModeData,
                memoizedUpdateHandlers.updateNodeParameterData,
                memoizedUpdateHandlers.updateNodeToolConfigData,
                memoizedUpdateHandlers.updateNodeExecutionResult,
                memoizedUpdateHandlers.updateNodeExecutionStatus
            );

            // Only add if component was successfully created
            if (CustomNodeComponent) {
                nodeTypeMap[nodeSpec.name] = CustomNodeComponent;
            }
        });

        // Store the complete set of node components
        // console.log("Node type map:", nodeTypeMap);
        setNodeTypes(nodeTypeMap);
        setNodeTypesLoaded(true);
        nodeTypesInitialized.current = true;
    }, [loaded, getAllNodeSpecs, memoizedUpdateHandlers]);

    // Memoize the return object to prevent unnecessary re-renders
    return useMemo(
        () => ({
            nodeTypes: memoizedNodeTypes,
            nodeTypesLoaded,
            loaded,
        }),
        [memoizedNodeTypes, nodeTypesLoaded, loaded]
    );
};
