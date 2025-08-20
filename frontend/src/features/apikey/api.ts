import apiClient from '@/api/secureClient';
import {
    CREATE_API_KEY_ENDPOINT,
    DELETE_API_KEY_ENDPOINT,
    DEACTIVATE_API_KEY_ENDPOINT,
    VALIDATE_API_KEY_ENDPOINT,
} from './consts';
import {
    type CreateApiKeyRequest,
    type ApiKeyResponse,
    type ApiKeyListResponse,
    type ValidateApiKeyRequest,
    type ValidateApiKeyResponse,
    type ApiKeyError,
} from './types';

export const createApiKey = async (
    request: CreateApiKeyRequest
): Promise<ApiKeyResponse> => {
    try {
        const { data } = await apiClient.post<ApiKeyResponse>(
            CREATE_API_KEY_ENDPOINT,
            request
        );
        return data;
    } catch (error: any) {
        console.error('Failed to create API key:', error);
        throw new Error(
            error.response?.data?.detail || 'Failed to create API key'
        );
    }
};

export const deleteApiKey = async (keyId: string): Promise<void> => {
    try {
        await apiClient.delete(DELETE_API_KEY_ENDPOINT(keyId));
    } catch (error: any) {
        console.error('Failed to delete API key:', error);
        throw new Error(
            error.response?.data?.detail || 'Failed to delete API key'
        );
    }
};

export const deactivateApiKey = async (
    keyId: string
): Promise<{ message: string }> => {
    try {
        const { data } = await apiClient.patch<{ message: string }>(
            DEACTIVATE_API_KEY_ENDPOINT(keyId)
        );
        return data;
    } catch (error: any) {
        console.error('Failed to deactivate API key:', error);
        throw new Error(
            error.response?.data?.detail || 'Failed to deactivate API key'
        );
    }
};

export const validateApiKey = async (
    request: ValidateApiKeyRequest
): Promise<ValidateApiKeyResponse> => {
    try {
        const { data } = await apiClient.post<ValidateApiKeyResponse>(
            VALIDATE_API_KEY_ENDPOINT,
            request
        );
        return data;
    } catch (error: any) {
        console.error('Failed to validate API key:', error);
        throw new Error(
            error.response?.data?.detail || 'Failed to validate API key'
        );
    }
};

// Note: Backend doesn't seem to have a list endpoint, so we'll skip it for now
// If needed, we can add it later when the backend provides the endpoint
