import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');

export const options = {
    stages: [
        { duration: '30s', target: 5 }, // Ramp up to 5 users
        { duration: '1m', target: 5 },  // Stay at 5 users
        { duration: '30s', target: 0 }, // Ramp down
    ],
    thresholds: {
        http_req_duration: ['p(95)<500'], // 95% of requests must complete below 500ms
        errors: ['rate<0.1'],            // Error rate should be less than 10%
    },
};

const BASE_URL = 'http://localhost:3000';

export default function () {
    const params = {
        headers: {
            'Content-Type': 'application/json',
            // Pass the session cookie from environment variable
            'Cookie': __ENV.AUTH_COOKIE || '',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
    };

    group('User Flow', function () {
        // 1. Fetch Domains (Classes)
        const domainsRes = http.get(`${BASE_URL}/api/domains`, params);

        const domainsSuccess = check(domainsRes, {
            'domains status is 200': (r) => r.status === 200,
            'content is json': (r) => r.headers['Content-Type'] && r.headers['Content-Type'].indexOf('application/json') !== -1,
        });

        if (!domainsSuccess) {
            errorRate.add(1);
            console.log(`Failed to fetch domains (Status: ${domainsRes.status}). Content-Type: ${domainsRes.headers['Content-Type']}`);
            // If we got HTML, it's likely the login page
            if (domainsRes.body && typeof domainsRes.body === 'string' && domainsRes.body.indexOf('<!DOCTYPE html>') !== -1) {
                console.log('Login page detected. Auth token may be rejected by Clerk middleware.');
            }
            return;
        }

        const domainsData = domainsRes.json();
        const classes = domainsData.domains;

        if (!classes || classes.length === 0) {
            console.log('No classes found');
            return;
        }

        // Pick a random class
        const randomClass = classes[Math.floor(Math.random() * classes.length)];
        const classId = randomClass.id;

        sleep(1);

        // 2. Fetch Class Details (to get Decks)
        const classRes = http.get(`${BASE_URL}/api/classes/${classId}`, params);

        const classSuccess = check(classRes, {
            'class details status is 200': (r) => r.status === 200,
        });

        if (!classSuccess) {
            errorRate.add(1);
            return;
        }

        const classData = classRes.json();
        const decks = classData.decks;

        if (!decks || decks.length === 0) {
            console.log(`No decks found for class ${classId}`);
            return;
        }

        // Pick a random deck
        const randomDeck = decks[Math.floor(Math.random() * decks.length)];
        const deckId = randomDeck.id;

        sleep(1);

        // 3. Fetch Flashcards for the Deck
        const cardsRes = http.get(`${BASE_URL}/api/decks/${deckId}/flashcards`, params);

        check(cardsRes, {
            'flashcards status is 200': (r) => r.status === 200,
        });

        const cardsData = cardsRes.json();
        const flashcards = cardsData.flashcards;

        if (!flashcards || flashcards.length === 0) {
            console.log(`No flashcards found for deck ${deckId}`);
            return;
        }

        // Pick a random flashcard
        const randomCard = flashcards[Math.floor(Math.random() * flashcards.length)];
        const flashcardId = randomCard.id;

        sleep(1);

        // 4. Create a Study Session
        const sessionPayload = JSON.stringify({
            deckIds: [deckId]
        });

        const sessionRes = http.post(`${BASE_URL}/api/sessions/create`, sessionPayload, params);

        check(sessionRes, {
            'create session status is 200': (r) => r.status === 200,
        });

        sleep(2);

        // 5. Update Progress (Study a card)
        const progressPayload = JSON.stringify({
            flashcardId: flashcardId,
            confidenceLevel: Math.floor(Math.random() * 5) + 1 // Random 1-5
        });

        const progressRes = http.post(`${BASE_URL}/api/progress/update`, progressPayload, params);

        check(progressRes, {
            'update progress status is 200': (r) => r.status === 200,
        });

        sleep(1);
    });
}
