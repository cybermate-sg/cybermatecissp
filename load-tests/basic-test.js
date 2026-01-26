import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
    // A simple smoke test to verify functionality
    // stages: [
    //   { duration: '30s', target: 20 },
    //   { duration: '1m30s', target: 10 },
    //   { duration: '20s', target: 0 },
    // ],

    // For now, let's keep it simple with 1 iteration or a short duration to not DDOS the site during dev
    vus: 1,
    duration: '10s',
};

export default function () {
    const res = http.get('https://www.cybermateconsulting.com/');

    check(res, {
        'status is 200': (r) => r.status === 200,
        'protocol is HTTP/2': (r) => r.proto === 'HTTP/2.0', // Common for modern sites, adjust if needed
        'response time < 500ms': (r) => r.timings.duration < 500,
    });

    sleep(1);
}
