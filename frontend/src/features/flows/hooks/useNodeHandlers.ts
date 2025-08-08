// useNodeHandlers.ts
import { useCallback } from 'react';
import type { UpdateNodeDataFunction, UpdateNodeParameterFunction, UpdateNodeModeDataFunction } from '@/features/nodes';

export const useNodeHandlers = (
  nodeId: string,
  input_values: Record<string, any>,
  updateNodeData?: UpdateNodeDataFunction,
  updateNodeModeData?: UpdateNodeModeDataFunction,
  updateNodeParameter?: UpdateNodeParameterFunction
) => {
  const handleParameterChange = useCallback(
    (paramName: string, value: any) => {
      console.log(
        `Parameter changed: ${paramName} = ${value} for node ${nodeId}`
      );
      if (updateNodeParameter) {
        updateNodeParameter(nodeId, paramName, value);
      }
    },
    [nodeId, updateNodeParameter]
  );

  const handleInputValueChange = useCallback(
    (inputName: string, value: any) => {
      // console.log(
      //   `Input value changed: ${inputName} = ${value} for node ${nodeId}`
      // );
      if (updateNodeData) {
        updateNodeData(nodeId, {
          input_values: {
            ...input_values,
            [inputName]: value
          },
        });
      }
    },
    [nodeId, input_values, updateNodeData]
  );

  const handleModeChange = useCallback(
    (newMode: string) => {
      if (updateNodeModeData) {
        updateNodeModeData(nodeId, newMode);
      }
    },
    [nodeId, updateNodeModeData]
  );

  return {
    handleParameterChange,
    handleInputValueChange,
    handleModeChange,
  };
};
