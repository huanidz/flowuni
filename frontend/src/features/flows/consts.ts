export const FLOWS_ENDPOINT = '/flows';
export const FLOW_EXECUTION_ENDPOINT = '/exec';
export const FLOW_EXECUTION_STREAM_ENDPOINT = '/exec/stream';

export const FLOW_DEFINITION_COMPILE_ENDPOINT = `${FLOW_EXECUTION_ENDPOINT}/compile`;
export const FLOW_DEFINITION_RUN_ENDPOINT = `${FLOW_EXECUTION_ENDPOINT}/execute`;

export const NODE_DATA_MODE = {
    NORMAL: 'NormalMode',
    TOOL: 'ToolMode',
} as const;

export const NODE_EXECUTION_STATE = {
    DRAFT: 'draft',
    QUEUED: 'queued',
    RUNNING: 'running',
    COMPLETED: 'completed',
    FAILED: 'failed',
    SKIPPED: 'skipped',
} as const;
