import http from 'k6/http';
import { check } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 10 },   // warm-up: 10 users
    { duration: '30s', target: 50 },   // moderate load
    { duration: '30s', target: 100 },  // heavy load
    { duration: '30s', target: 150 },  // stress level
    { duration: '30s', target: 0 },    // cool down
  ],
  thresholds: {
    http_req_duration: ['p(95)<3000'], // 95% of requests under 3s is healthy
    http_req_failed: ['rate<0.01'],    // less than 1% failure rate
  },
};

export default function () {
  const url = 'http://localhost:5002/api/exec/d8b13e48-6c2f-4a94-bda2-3c464cad194b';
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer sk-jX_p36O-RZi2XNbQ06Q2Mw_YrdjvzYHUrNTWuEVWboAS_9p01VO9lx4LkQVchMvqKQ',
  };

  const payload = JSON.stringify({
    messages: [{ type: 'text', content: 'hi' }],
    session_id: null,
  });

  const res = http.post(url, payload, { headers });

  check(res, { 'status is 200': (r) => r.status === 200 });
}
