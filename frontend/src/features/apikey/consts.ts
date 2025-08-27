// API Endpoints
export const API_KEYS_BASE_ENDPOINT = '/api-keys';
export const CREATE_API_KEY_ENDPOINT = API_KEYS_BASE_ENDPOINT;
export const LIST_API_KEY_ENDPOINT = API_KEYS_BASE_ENDPOINT;
export const DELETE_API_KEY_ENDPOINT = (keyId: string) =>
    `${API_KEYS_BASE_ENDPOINT}/${keyId}`;
export const DEACTIVATE_API_KEY_ENDPOINT = (keyId: string) =>
    `${API_KEYS_BASE_ENDPOINT}/${keyId}/deactivate`;
export const VALIDATE_API_KEY_ENDPOINT = `${API_KEYS_BASE_ENDPOINT}/validate`;

// Other constants
export const API_KEY_PREFIX = 'sk-';
export const API_KEY_DISPLAY_LENGTH = 12; // How many characters to show in UI
