import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = { vus: 500, duration: '1m' };

export default function () {
  const res = http.get('https://nextsound.pro/api/tracks/trending');
  check(res, { 'status 200': (r) => r.status === 200 });
  sleep(1);
}