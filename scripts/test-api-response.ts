/**
 * Script to test API response for flashcards
 * Run with: npx tsx scripts/test-api-response.ts
 */

async function testAPIResponse() {
  try {
    // Find the Test Deck ID
    const testDeckId = '848054a4-7528-4dd3-b2c8-91f7ef9f5573';

    console.log('Testing API endpoint...');
    console.log(`Deck ID: ${testDeckId}\n`);

    // Make request to API (we're testing locally, so use localhost)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const url = `${baseUrl}/api/decks/${testDeckId}/flashcards`;

    console.log(`Fetching: ${url}\n`);

    const response = await fetch(url, {
      headers: {
        'Cookie': process.env.TEST_COOKIE || '', // You may need to add auth cookie
      },
    });

    if (!response.ok) {
      console.error(`❌ API returned ${response.status} ${response.statusText}`);
      return;
    }

    const data = await response.json();

    console.log('✅ API Response received\n');
    console.log(`Total flashcards: ${data.total}`);
    console.log(`Deck: ${data.deck.name}\n`);

    // Find the test card
    const testCard = data.flashcards.find((card: any) =>
      card.question.includes('Test Question with Image')
    );

    if (testCard) {
      console.log('Found test card:');
      console.log(`  Question: ${testCard.question}`);
      console.log(`  Media count: ${testCard.media?.length || 0}`);

      if (testCard.media && testCard.media.length > 0) {
        console.log('\n  Media details:');
        testCard.media.forEach((m: any) => {
          console.log(`    - ${m.placement} #${m.order}`);
          console.log(`      fileUrl: ${m.fileUrl}`);
          console.log(`      altText: ${m.altText}`);
        });
      } else {
        console.log('\n  ❌ NO MEDIA FOUND IN API RESPONSE');
        console.log('  This means the API is not including media in the response.');
      }
    } else {
      console.log('❌ Test card not found in response');
    }

  } catch (error) {
    console.error('Error testing API:', error);
  }
}

testAPIResponse();
