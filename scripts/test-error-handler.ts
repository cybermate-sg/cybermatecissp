
import { withErrorHandling, ApiError } from '../src/lib/api/error-handler';
import { ZodError } from 'zod';
import { NextResponse } from 'next/server';

// Mock console.error to keep output clean
const originalConsoleError = console.error;
console.error = () => { };

async function runTests() {
    console.log('Starting Error Handler Tests...');
    let passed = 0;
    let failed = 0;

    function assert(condition: boolean, message: string) {
        if (condition) {
            console.log(`✅ ${message}`);
            passed++;
        } else {
            console.error(`❌ ${message}`);
            failed++;
        }
    }

    // --- Test getStatusCode (indirectly via exported function if possible, or we copy logic for test if not exported) ---
    // Since getStatusCode is not exported, we can test it via handleApiError or just rely on the fact that we are refactoring it.
    // Wait, getStatusCode is NOT exported. I should probably export it temporarily or test via handleApiError?
    // Actually, I can just export it for testing or use `handleApiError` which calls it.
    // Let's check `handleApiError`. It returns a NextResponse with the status code.

    // We need to import handleApiError to test getStatusCode indirectly
    const { handleApiError } = require('../src/lib/api/error-handler');

    console.log('\nTesting getStatusCode (via handleApiError)...');

    // Test ApiError
    const apiError = new ApiError('Test error', 418);
    const response1 = handleApiError(apiError);
    assert(response1.status === 418, 'ApiError should return correct status code');

    // Test ZodError
    const zodError = new ZodError([]);
    const response2 = handleApiError(zodError);
    assert(response2.status === 400, 'ZodError should return 400');

    // Test Error with "not found"
    const notFoundError = new Error('Something was not found');
    const response3 = handleApiError(notFoundError);
    assert(response3.status === 404, 'Error with "not found" should return 404');

    // Test Error with "unauthorized"
    const authError = new Error('User is unauthorized');
    const response4 = handleApiError(authError);
    assert(response4.status === 403, 'Error with "unauthorized" should return 403');

    // Test generic Error
    const genericError = new Error('Boom');
    const response5 = handleApiError(genericError);
    assert(response5.status === 500, 'Generic Error should return 500');


    // --- Test withErrorHandling ---
    console.log('\nTesting withErrorHandling...');

    const successHandler = async () => NextResponse.json({ success: true });
    const wrappedSuccess = withErrorHandling(successHandler);
    const resSuccess = await wrappedSuccess();
    assert(resSuccess.status === 200, 'Success handler should return 200');

    const failHandler = async () => { throw new Error('Fail'); };
    const wrappedFail = withErrorHandling(failHandler);
    const resFail = await wrappedFail();
    assert(resFail.status === 500, 'Failing handler should return 500');

    // Test context derivation (mocking request)
    // We can't easily inspect the internal logging without spying on console.error, 
    // but we can ensure it doesn't crash with various inputs.

    const req = {
        method: 'GET',
        url: 'http://localhost/api/test',
        headers: new Map([['x-request-id', '123']])
    };

    const wrappedWithContext = withErrorHandling(async (req: any) => {
        throw new Error('Context Test');
    });

    try {
        const resContext = await wrappedWithContext(req);
        assert(resContext.status === 500, 'Handler with context should return 500 on error');
    } catch (e) {
        assert(false, 'Handler with context should not throw');
    }

    console.log(`\nTests completed. Passed: ${passed}, Failed: ${failed}`);

    // Restore console.error
    console.error = originalConsoleError;

    if (failed > 0) process.exit(1);
}

runTests().catch(e => {
    console.error(e);
    process.exit(1);
});
