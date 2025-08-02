import { ReactFlowProvider } from '@xyflow/react';
import FlowBuilder from './FlowBuilder';

export interface FlowCanvasProps {
  flow_id: string;
}

export default function FlowCanvas({ flow_id }: FlowCanvasProps) {
  return (
    <ReactFlowProvider>
      <FlowBuilder flow_id={flow_id} />
    </ReactFlowProvider>
  );
}