// Playground Session Types
export interface PlaygroundSession {
    user_defined_session_id: string;
    flow_id: string;
    session_metadata?: Record<string, any> | null;
    is_playground: boolean;
    created_at: string;
    modified_at: string;
}

export interface CreatePlaygroundSessionRequest {
    flow_id: string;
    session_metadata?: Record<string, any> | null;
}

export interface GetPlaygroundSessionsRequest {
    flow_id: string;
    page?: number;
    per_page?: number;
}

export interface Pagination {
    page: number;
    page_size: number;
    total_pages: number;
    total_items: number;
}

export interface GetPlaygroundSessionsResponse {
    data: PlaygroundSession[];
    pagination: Pagination;
}

// Chat Message Types
export interface ChatMessage {
    id: string;
    session_id: string;
    role: 'user' | 'assistant';
    message: string;
    chat_metadata?: Record<string, any> | null;
    created_at: string;
}

export interface AddChatMessageRequest {
    session_id: string;
    role: 'user' | 'assistant';
    message: string;
    chat_metadata?: Record<string, any> | null;
}

export interface ChatMessageResponse {
    id: string;
    session_id: string;
    role: 'user' | 'assistant';
    message: string;
    chat_metadata?: Record<string, any> | null;
    created_at: string;
}

export interface GetChatHistoryRequest {
    session_id: string;
    num_messages?: number | null;
}

export interface GetChatHistoryResponse {
    session_id: string;
    messages: ChatMessage[];
}

// Session Metadata Types
export interface UpdateSessionMetadataRequest {
    session_id: string;
    metadata: Record<string, any>;
}

export interface UpdateSessionMetadataResponse {
    user_defined_session_id: string;
    flow_id: string;
    session_metadata: Record<string, any>;
    is_playground: boolean;
    created_at: string;
    modified_at: string;
}
