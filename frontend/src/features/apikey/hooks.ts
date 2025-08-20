import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    createApiKey,
    deleteApiKey,
    deactivateApiKey,
    validateApiKey,
} from './api';
import type {
    CreateApiKeyRequest,
    ApiKeyResponse,
    ValidateApiKeyRequest,
    ValidateApiKeyResponse,
} from './types';

// Query keys
export const API_KEY_QUERY_KEYS = {
    all: ['api-keys'] as const,
    lists: () => [...API_KEY_QUERY_KEYS.all, 'list'] as const,
    list: () => [...API_KEY_QUERY_KEYS.lists()] as const,
    details: () => [...API_KEY_QUERY_KEYS.all, 'detail'] as const,
    detail: (keyId: string) =>
        [...API_KEY_QUERY_KEYS.details(), keyId] as const,
};

// Mutations
export const useCreateApiKey = () => {
    const queryClient = useQueryClient();

    return useMutation<ApiKeyResponse, Error, CreateApiKeyRequest>({
        mutationFn: createApiKey,
        onSuccess: () => {
            // Invalidate and refetch API key lists
            queryClient.invalidateQueries({
                queryKey: API_KEY_QUERY_KEYS.lists(),
            });
        },
    });
};

export const useDeleteApiKey = () => {
    const queryClient = useQueryClient();

    return useMutation<void, Error, string>({
        mutationFn: deleteApiKey,
        onSuccess: () => {
            // Invalidate and refetch API key lists
            queryClient.invalidateQueries({
                queryKey: API_KEY_QUERY_KEYS.lists(),
            });
        },
    });
};

export const useDeactivateApiKey = () => {
    const queryClient = useQueryClient();

    return useMutation<{ message: string }, Error, string>({
        mutationFn: deactivateApiKey,
        onSuccess: () => {
            // Invalidate and refetch API key lists
            queryClient.invalidateQueries({
                queryKey: API_KEY_QUERY_KEYS.lists(),
            });
        },
    });
};

export const useValidateApiKey = () => {
    return useMutation<ValidateApiKeyResponse, Error, ValidateApiKeyRequest>({
        mutationFn: validateApiKey,
    });
};

// Note: Since backend doesn't have a list endpoint yet, we'll skip the list query for now
// If needed, we can add it later when the backend provides the endpoint
