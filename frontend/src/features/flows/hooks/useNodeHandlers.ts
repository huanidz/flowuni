// useNodeHandlers.ts
import { useCallback } from 'react';
import type { UpdateNodeDataFunction, UpdateNodeParameterFunction } from '@/features/nodes';

export const useNodeHandlers = (
  nodeId: string,
  input_values: Array<{name: string; value: any}>,
  updateNodeData?: UpdateNodeDataFunction,
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
          input_values: input_values.map((input: {name: string; value: any}) =>
            input.name === inputName ? { ...input, value } : input
          ),
        });
      }
    },
    [nodeId, input_values, updateNodeData]
  );

  return {
    handleParameterChange,
    handleInputValueChange,
  };
};
