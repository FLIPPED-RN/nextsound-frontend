import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = { vus: 500, duration: '1m' };

export default function () {
  const res = http.get('https://24nextsound.ru/api/tracks/trending');
  check(res, { 'status 200': (r) => r.status === 200 });
  sleep(1);
}