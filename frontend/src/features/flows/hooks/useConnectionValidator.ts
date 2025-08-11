import type { Node, Edge } from "@xyflow/react";
import { useMemo } from "react";
import { ConnectionValidator } from "../utils/NodeConnectionValidator";
import { useNodeStore } from "@/features/nodes";

// Custom Hook for connection validation
export const useConnectionValidation = (
  nodes: Node[], 
  edges: Edge[], 
) => {

  const { getNodeSpecByRFNodeType } = useNodeStore();

  const validator = useMemo(() => 
    new ConnectionValidator(edges, nodes, getNodeSpecByRFNodeType), 
    [edges, nodes, getNodeSpecByRFNodeType]
  );
  
  return {
    isValidConnection: validator.isValidConnection,
  };
};