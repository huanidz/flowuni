// src/api/sse.ts
import { ACCESS_TOKEN_KEY } from '@/features/auth/consts';

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5002/api';

export const watchFlowExecution = (
  taskId: string,
  onMessage: (msg: string) => void,
  onDone?: () => void,
  onError?: (err: Event) => void
) => {
  const token = sessionStorage.getItem(ACCESS_TOKEN_KEY);

  // Construct URL with token in query params (SSE doesn't support Authorization headers)
  const url = new URL(`${baseURL}/flow_execution/stream/${taskId}`);
  if (token) {
    url.searchParams.set('token', token);
  }

  const eventSource = new EventSource(url.toString());

  eventSource.onmessage = (event) => {

    // Parse to JSON
    const data = JSON.parse(event.data);

    if (data.event === 'DONE') {

      onDone?.();
      eventSource.close();
    } else {
      onMessage(event.data);
    }
  };

  eventSource.onerror = (err) => {
    onError?.(err);
    eventSource.close();
  };

  return eventSource;
};
