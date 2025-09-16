import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    createPlaygroundSession,
    getPlaygroundSessions,
    getPlaygroundSession,
    deletePlaygroundSession,
    addChatMessage,
    getChatHistory,
    updateSessionMetadata,
    getSessionsWithLastMessage,
} from './api';
import type {
    CreatePlaygroundSessionRequest,
    GetPlaygroundSessionsRequest,
    PlaygroundSession,
    AddChatMessageRequest,
    GetChatHistoryResponse,
    UpdateSessionMetadataResponse,
    GetSessionsWithLastMessageResponse,
} from './types';

// Session hooks
export const useCreatePlaygroundSession = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (request: CreatePlaygroundSessionRequest) =>
            createPlaygroundSession(request),
        onSuccess: (data, variables) => {
            // Invalidate playground sessions query for the specific flow
            queryClient.invalidateQueries({
                queryKey: ['playground-sessions', variables.flow_id],
            });
        },
    });
};

export const usePlaygroundSessions = (
    request: GetPlaygroundSessionsRequest
) => {
    return useQuery({
        queryKey: [
            'playground-sessions',
            request.flow_id,
            request.page,
            request.per_page,
        ],
        queryFn: () => getPlaygroundSessions(request),
        enabled: !!request.flow_id,
    });
};

export const usePlaygroundSession = (sessionId: string) => {
    return useQuery({
        queryKey: ['playground-session', sessionId],
        queryFn: () => getPlaygroundSession(sessionId),
        enabled: !!sessionId,
    });
};

export const useDeletePlaygroundSession = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (sessionId: string) => deletePlaygroundSession(sessionId),
        onSuccess: (_, sessionId) => {
            // Invalidate all playground sessions queries
            queryClient.invalidateQueries({
                queryKey: ['playground-sessions'],
            });
            // Remove the specific session from cache
            queryClient.removeQueries({
                queryKey: ['playground-session', sessionId],
            });
        },
    });
};

// Chat hooks
export const useAddChatMessage = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (request: AddChatMessageRequest) => addChatMessage(request),
        onSuccess: (data, variables) => {
            // Invalidate chat history for the session
            queryClient.invalidateQueries({
                queryKey: ['chat-history', variables.session_id],
            });
        },
    });
};

export const useChatHistory = (sessionId: string, numMessages?: number) => {
    return useQuery({
        queryKey: ['chat-history', sessionId, numMessages],
        queryFn: () => getChatHistory(sessionId, numMessages),
        enabled: !!sessionId,
    });
};

// Sessions with last message hook
export const useSessionsWithLastMessage = (
    request: GetPlaygroundSessionsRequest
) => {
    return useQuery({
        queryKey: [
            'sessions-with-last-message',
            request.flow_id,
            request.page,
            request.per_page,
        ],
        queryFn: () => getSessionsWithLastMessage(request),
        enabled: !!request.flow_id,
    });
};

// Session metadata hooks
export const useUpdateSessionMetadata = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            sessionId,
            metadata,
        }: {
            sessionId: string;
            metadata: Record<string, any>;
        }) => updateSessionMetadata(sessionId, metadata),
        onSuccess: (data: UpdateSessionMetadataResponse) => {
            // Update the session in cache
            queryClient.setQueryData(
                ['playground-session', data.user_defined_session_id],
                data
            );
            // Invalidate playground sessions for the flow
            queryClient.invalidateQueries({
                queryKey: ['playground-sessions'],
            });
        },
    });
};
