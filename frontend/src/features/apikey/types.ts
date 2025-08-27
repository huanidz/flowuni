export interface CreateApiKeyRequest {
    name: string;
    description?: string;
    expires_at?: string; // ISO datetime string
}

export interface ApiKeyResponse {
    key_id: string;
    name: string;
    description?: string;
    key: string; // The actual API key - only returned on creation
    created_at: string; // ISO datetime string
    expires_at?: string; // ISO datetime string
}

export interface ApiKeyInfoResponse {
    key_id: string;
    name: string;
    description?: string;
    is_active: boolean;
    created_at: string; // ISO datetime string
    expires_at?: string; // ISO datetime string
    last_used_at?: string; // ISO datetime string
}

export interface ValidateApiKeyRequest {
    api_key: string;
}

export interface ValidateApiKeyResponse {
    valid: boolean;
    user_id?: number;
    key_id?: string;
    name?: string;
}

export interface ApiKeyListResponse {
    api_keys: ApiKeyInfoResponse[];
}

// UI-specific types
export interface ApiKeyTableRow extends ApiKeyInfoResponse {
    id: string; // For table compatibility
}

// Error types
export interface ApiKeyError {
    message: string;
    status_code?: number;
}
