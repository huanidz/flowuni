// sse.ts
import { ACCESS_TOKEN_KEY } from '@/features/auth/consts';

const baseURL =
    import.meta.env.VITE_API_BASE_URL || 'http://localhost:5002/api';

const VALID_ID_RE = /^\d+-\d+$/;
const normalizeSinceId = (val?: string) => {
    if (!val) return '0-0';
    const s = String(val).trim();
    if (s === '0') return '0-0';
    if (s === '0-0' || s === '$' || VALID_ID_RE.test(s)) return s;
    return '0-0';
};

export const watchUserEvents = (
    userId: number,
    onMessage: (msg: any) => void,
    onError?: (err: Event) => void,
    sinceId?: string
) => {
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);

    // Build SSE URL (matches backend: /stream/{user_id}/events)
    const url = new URL(`${baseURL}/user-events/stream/${userId}/events`);
    if (token) {
        url.searchParams.set('token', token);
    }
    const normalized = normalizeSinceId(sinceId);
    if (normalized && normalized !== '0-0') {
        url.searchParams.set('since_id', normalized);
    }

    const eventSource = new EventSource(url.toString());

    eventSource.onopen = () => {
        console.log('🔗 SSE connection opened');
    };

    eventSource.onmessage = event => {
        try {
            const parsed = JSON.parse(event.data);
            // Surface browser-provided lastEventId (useful on some servers/clients)
            (parsed as any).__lastEventId =
                (event as MessageEvent).lastEventId || null;

            if (parsed.event === 'DONE') {
                console.log('SSE event:', parsed, 'DONE -> CLOSED');
                eventSource.close();
            } else {
                console.log('SSE event:', parsed);
                onMessage(parsed);
            }
        } catch (e) {
            console.warn('Failed to parse SSE data:', event.data);
        }
    };

    // IMPORTANT: do NOT close here — let EventSource auto-reconnect.
    eventSource.onerror = err => {
        console.error('SSE error:', err);
        onError?.(err);
        // Keep open -> native EventSource will retry automatically.
    };

    return eventSource;
};
