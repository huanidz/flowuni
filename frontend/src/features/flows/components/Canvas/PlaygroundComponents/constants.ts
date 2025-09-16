// Chat box dimensions
export const CHAT_BOX_WIDTH = 384; // w-96 in Tailwind (96 * 4 = 384px)
export const CHAT_BOX_HEIGHT = 500; // h-[500px]

// Positioning constants
export const CHAT_BOX_MARGIN = 16;
export const CHAT_BOX_Z_INDEX = 1001;

// Timeout constants
export const FLOW_EXECUTION_TIMEOUT = 30000; // 30 seconds

// Message constants
export const USER_ID = 1;
export const BOT_ID = 0;
export const MESSAGE_MAX_WIDTH_PERCENT = 80;

// Node type constants
export const CHAT_INPUT_NODE_TYPE = 'Chat Input';
export const CHAT_OUTPUT_NODE_TYPE = 'Chat Output';

// Placeholder text
export const INPUT_PLACEHOLDER = 'Type a message...';
export const PROCESSING_PLACEHOLDER = 'Processing...';
export const THINKING_TEXT = 'Thinking...';

// Error messages
export const FLOW_TIMEOUT_ERROR = 'Flow execution timed out';
export const CONNECTION_ERROR = 'Connection to flow execution failed';
export const NO_TASK_ID_ERROR = 'No task_id received from flow execution';
export const FLOW_RUN_ERROR = 'Failed to run flow';

// Warning messages
export const NEED_CHAT_INPUT_WARNING = 'Need ChatInput Node to start chatting';
export const NEED_CHAT_OUTPUT_WARNING =
    'Need ChatOutput to receive message from flow';

// Console log prefixes
export const SSE_LOG_PREFIX = '[SSE]';
export const FLOW_LOG_PREFIX = '[Flow]';

// ROLE constants
export const ROLE_USER = 'user';
export const ROLE_ASSISTANT = 'assistant';
