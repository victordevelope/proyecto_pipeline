import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 50,
  duration: '2m',
  thresholds: {
    http_req_duration: ['p(95)<250'],
    http_req_failed: ['rate<0.008']
  }
};

export default function () {
  const payload = JSON.stringify({ transactionId: Math.random().toString(36).slice(2), amount: Math.floor(Math.random()*1000) });
  const res = http.post('http://localhost/validate', payload, { headers: { 'Content-Type': 'application/json' } });
  check(res, { 'status is 200 or 422': (r) => r.status === 200 || r.status === 422 });
  sleep(0.1);
}

