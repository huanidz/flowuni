import { ACCESS_TOKEN_KEY } from '@/features/auth/consts';

const baseURL =
    import.meta.env.VITE_API_BASE_URL || 'http://localhost:5002/api';

export const watchFlowTestEvents = (
    taskId: string,
    onMessage: (msg: string) => void,
    onDone?: () => void,
    onError?: (err: Event) => void
) => {
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);

    // Construct URL with token in query params (SSE doesn't support Authorization headers)
    const url = new URL(`${baseURL}/flow-test-runs/stream/${taskId}/events`);
    if (token) {
        url.searchParams.set('token', token);
    }

    const eventSource = new EventSource(url.toString());

    eventSource.onmessage = event => {
        // For now, we'll just pass the raw data as requested
        // We can add parsing later once we understand the data structure
        console.log('Raw SSE event data:', event.data);
        onMessage(event.data);
    };

    eventSource.onerror = err => {
        console.error('SSE connection error:', err);
        onError?.(err);
        eventSource.close();
    };

    return eventSource;
};
