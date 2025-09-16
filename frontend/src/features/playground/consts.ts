export const PLAYGROUND_ENDPOINT = '/api/playground';

// Session endpoints
export const SESSIONS_ENDPOINT = `${PLAYGROUND_ENDPOINT}/sessions`;
export const SESSION_ENDPOINT = (sessionId: string) =>
    `${SESSIONS_ENDPOINT}/${sessionId}`;
export const SESSION_METADATA_ENDPOINT = (sessionId: string) =>
    `${SESSION_ENDPOINT(sessionId)}/metadata`;

// Chat endpoints
export const CHAT_ENDPOINT = `${PLAYGROUND_ENDPOINT}/chat`;
export const SESSION_CHAT_ENDPOINT = (sessionId: string) =>
    `${SESSION_ENDPOINT(sessionId)}/chat`;
