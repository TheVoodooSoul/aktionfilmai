// Test A2E Image-to-Video API
async function testI2V() {
  const A2E_API_KEY = process.env.A2E_API_KEY;
  const testImageUrl = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=512'; // Sample portrait

  console.log('Testing A2E Image-to-Video...\n');
  console.log('Image URL:', testImageUrl);
  console.log('Prompt: "Character looking around, slight head movement"\n');

  try {
    // Start i2v generation
    const response = await fetch('https://video.a2e.ai/api/v1/wanneer/start', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${A2E_API_KEY}`,
        'Content-Type': 'application/json',
        'x-lang': 'en-US'
      },
      body: JSON.stringify({
        name: 'Test I2V',
        image_url: testImageUrl,
        prompt: 'Character looking around, slight head movement',
        uncensored: true
      })
    });

    console.log('Response status:', response.status);
    const data = await response.json();
    console.log('Response:', JSON.stringify(data, null, 2));

    if (data.code === 0 && data.data?.[0]?._id) {
      const taskId = data.data[0]._id;
      console.log('\n✅ Task created:', taskId);
      console.log('💡 Check status at: https://video.a2e.ai/api/v1/wanneer/' + taskId);
      console.log('\nThis would normally poll for completion...');
    } else {
      console.log('❌ Failed to start i2v generation');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testI2V();
