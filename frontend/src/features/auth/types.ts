export interface RegisterPayload {
    username: string;
    password: string;
}

export interface RegisterResponse {
    user_id: number;
    username: string;
    created_at: string;
}

export interface LoginPayload {
    username: string;
    password: string;
}

export interface LoginResponse {
    user_id: number;
    username: string;
    access_token: string;
}
