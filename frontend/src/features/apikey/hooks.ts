import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    createApiKey,
    listApiKeys,
    deleteApiKey,
    deactivateApiKey,
    activateApiKey,
    validateApiKey,
} from './api';
import type {
    CreateApiKeyRequest,
    ApiKeyResponse,
    ApiKeyListResponse,
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

export const useActivateApiKey = () => {
    const queryClient = useQueryClient();

    return useMutation<{ message: string }, Error, string>({
        mutationFn: activateApiKey,
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

export const useListApiKeys = (includeInactive: boolean = false) => {
    return useQuery<ApiKeyListResponse, Error>({
        queryKey: API_KEY_QUERY_KEYS.list(),
        queryFn: () => listApiKeys(includeInactive),
    });
};
