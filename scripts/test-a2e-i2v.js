// Test A2E Image-to-Video API to understand its response format
async function testI2V() {
  const A2E_API_KEY = process.env.A2E_API_KEY;
  const A2E_API_URL = process.env.A2E_API_URL || 'https://api.a2e.ai';

  // Use a simple test image URL
  const testImageUrl = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=512';

  console.log('Testing A2E i2v API...\n');
  console.log('Endpoint:', `${A2E_API_URL}/video/i2v`);
  console.log('Image URL:', testImageUrl);
  console.log('Model: wan-2.5\n');

  try {
    const response = await fetch(`${A2E_API_URL}/video/i2v`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${A2E_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: testImageUrl,
        prompt: 'slight head movement',
        model: 'wan-2.5',
        duration: 4,
        uncensored: true
      })
    });

    console.log('Response status:', response.status);
    const responseText = await response.text();
    console.log('Response:', responseText.substring(0, 1000));

    if (responseText.startsWith('<!DOCTYPE') || responseText.startsWith('<html')) {
      console.log('\n⚠️ Endpoint returned HTML (404 or wrong URL)');
      console.log('💡 Need to find correct A2E i2v endpoint');
    } else {
      try {
        const data = JSON.parse(responseText);
        console.log('\nParsed response:', JSON.stringify(data, null, 2));
      } catch (e) {
        console.log('\n❌ Could not parse JSON');
      }
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testI2V();
