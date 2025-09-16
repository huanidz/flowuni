import apiClient from '@/api/secureClient';
import {
    SESSIONS_ENDPOINT,
    SESSION_ENDPOINT,
    CHAT_ENDPOINT,
    SESSION_CHAT_ENDPOINT,
    SESSION_METADATA_ENDPOINT,
    SESSIONS_WITH_LAST_MESSAGE_ENDPOINT,
} from './consts';
import type {
    CreatePlaygroundSessionRequest,
    PlaygroundSession,
    GetPlaygroundSessionsRequest,
    GetPlaygroundSessionsResponse,
    GetSessionsWithLastMessageResponse,
    AddChatMessageRequest,
    ChatMessageResponse,
    GetChatHistoryRequest,
    GetChatHistoryResponse,
    UpdateSessionMetadataRequest,
    UpdateSessionMetadataResponse,
} from './types';

// Session API functions
export const createPlaygroundSession = async (
    request: CreatePlaygroundSessionRequest
): Promise<PlaygroundSession> => {
    const { data } = await apiClient.post(SESSIONS_ENDPOINT, request);
    return data;
};

export const getPlaygroundSessions = async (
    request: GetPlaygroundSessionsRequest
): Promise<GetPlaygroundSessionsResponse> => {
    const { data } = await apiClient.get(SESSIONS_ENDPOINT, {
        params: {
            flow_id: request.flow_id,
            page: request.page || 1,
            per_page: request.per_page || 10,
        },
    });
    return data;
};

export const getPlaygroundSession = async (
    sessionId: string
): Promise<PlaygroundSession> => {
    const { data } = await apiClient.get(SESSION_ENDPOINT(sessionId));
    return data;
};

export const deletePlaygroundSession = async (
    sessionId: string
): Promise<void> => {
    await apiClient.delete(SESSION_ENDPOINT(sessionId));
};

// Chat API functions
export const addChatMessage = async (
    request: AddChatMessageRequest
): Promise<ChatMessageResponse> => {
    const { data } = await apiClient.post(CHAT_ENDPOINT, request);
    return data;
};

// Sessions with last message API function
export const getSessionsWithLastMessage = async (
    request: GetPlaygroundSessionsRequest
): Promise<GetSessionsWithLastMessageResponse> => {
    const { data } = await apiClient.get(SESSIONS_WITH_LAST_MESSAGE_ENDPOINT, {
        params: {
            flow_id: request.flow_id,
            page: request.page || 1,
            per_page: request.per_page || 10,
        },
    });
    return data;
};

export const getChatHistory = async (
    sessionId: string,
    numMessages?: number
): Promise<GetChatHistoryResponse> => {
    const params: Record<string, any> = {};
    if (numMessages !== undefined) {
        params.num_messages = numMessages;
    }

    const { data } = await apiClient.get(SESSION_CHAT_ENDPOINT(sessionId), {
        params,
    });
    return data;
};

// Session Metadata API functions
export const updateSessionMetadata = async (
    sessionId: string,
    metadata: Record<string, any>
): Promise<UpdateSessionMetadataResponse> => {
    const { data } = await apiClient.put(
        SESSION_METADATA_ENDPOINT(sessionId),
        metadata
    );
    return data;
};
