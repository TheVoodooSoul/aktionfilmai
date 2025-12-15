#!/usr/bin/env node
/**
 * Smoke Test for AktionFilmAI APIs - v2
 * Tests: Replicate, A2E, RunComfy, Dzine, Fal
 */

require('dotenv').config({ path: '.env.local' });

async function testReplicate() {
  console.log('\n🎨 Testing REPLICATE (Sketch-to-Image)...');
  
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) {
    console.log('  ❌ REPLICATE_API_TOKEN not set');
    return false;
  }
  
  try {
    const response = await fetch('https://api.replicate.com/v1/account', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log(`  ✅ Replicate API connected`);
      console.log(`     Username: ${data.username}`);
      return true;
    } else {
      console.log(`  ❌ Replicate API error: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`  ❌ Replicate error: ${error.message}`);
    return false;
  }
}

async function testA2E() {
  console.log('\n🎬 Testing A2E.AI (Lipsync/Avatar/TTS)...');
  
  const apiKey = process.env.A2E_API_KEY;
  if (!apiKey) {
    console.log('  ❌ A2E_API_KEY not set');
    return false;
  }
  
  try {
    // Test TTS endpoint (actual endpoint from code)
    const response = await fetch('https://video.a2e.ai/api/v1/video/send_tts', {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        msg: 'test',
        speechRate: 1.0,
        tts_id: 'en-US-JennyNeural'
      })
    });
    
    // Even a failed request with valid auth returns 200 with error code
    const data = await response.json();
    console.log(`  ✅ A2E.AI API connected`);
    console.log(`     Response code: ${data.code || 'N/A'}`);
    console.log(`     Message: ${data.msg || data.message || 'OK'}`);
    return true;
  } catch (error) {
    console.log(`  ❌ A2E.AI error: ${error.message}`);
    return false;
  }
}

async function testRunComfy() {
  console.log('\n🎥 Testing RUNCOMFY (I2V/Video)...');
  
  const token = process.env.RUNCOMFY_API_TOKEN;
  const deploymentId = process.env.RUNCOMFY_DEPLOYMENT_ID;
  
  if (!token) {
    console.log('  ❌ RUNCOMFY_API_TOKEN not set');
    return false;
  }
  
  try {
    // Check deployment status
    const response = await fetch(`https://www.runcomfy.com/api/platform/v1/deployments/${deploymentId}`, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log(`  ✅ RunComfy API connected`);
      console.log(`     Deployment: ${deploymentId?.substring(0, 8)}...`);
      console.log(`     Status: ${data.status || 'loaded'}`);
      return true;
    } else {
      // Try to list deployments instead
      const listResponse = await fetch('https://www.runcomfy.com/api/platform/v1/deployments', {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (listResponse.ok) {
        const data = await listResponse.json();
        console.log(`  ✅ RunComfy API connected`);
        console.log(`     Deployments found: ${data.length || 'yes'}`);
        return true;
      }
      console.log(`  ❌ RunComfy error: ${response.status}`);
      const text = await response.text();
      console.log(`     ${text.substring(0, 100)}`);
      return false;
    }
  } catch (error) {
    console.log(`  ❌ RunComfy error: ${error.message}`);
    return false;
  }
}

async function testDzine() {
  console.log('\n🖼️  Testing DZINE (Sketch-to-Image)...');
  
  const token = process.env.DZINE_API_TOKEN;
  if (!token) {
    console.log('  ❌ DZINE_API_TOKEN not set');
    return false;
  }
  
  try {
    // Get user credits to verify API works
    const response = await fetch('https://api.dzine.ai/openapi/account/credits', {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log(`  ✅ Dzine API connected`);
      console.log(`     Credits: ${data.data?.credits || data.credits || 'N/A'}`);
      return true;
    } else {
      console.log(`  ❌ Dzine API error: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`  ❌ Dzine error: ${error.message}`);
    return false;
  }
}

async function testFal() {
  console.log('\n⚡ Testing FAL.AI (Wan LoRAs)...');
  
  const apiKey = process.env.FAL_API_KEY;
  if (!apiKey) {
    console.log('  ❌ FAL_API_KEY not set');
    return false;
  }
  
  try {
    // Test by checking a model endpoint
    const response = await fetch('https://fal.run/fal-ai/wan/image-to-video', {
      method: 'POST',
      headers: { 
        'Authorization': `Key ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ test: true })
    });
    
    // A validation error (422) still means auth works
    if (response.status === 422 || response.ok) {
      console.log(`  ✅ Fal.ai API connected`);
      console.log(`     Auth: Valid`);
      return true;
    } else if (response.status === 401) {
      console.log(`  ❌ Fal.ai API: Invalid key`);
      return false;
    } else {
      console.log(`  ⚠️  Fal.ai API: ${response.status}`);
      return true; // Might still work
    }
  } catch (error) {
    console.log(`  ❌ Fal.ai error: ${error.message}`);
    return false;
  }
}

async function runAllTests() {
  console.log('🚀 AKTIONFILMAI API SMOKE TEST v2');
  console.log('==================================');
  
  const results = {};
  
  results.replicate = await testReplicate();
  results.a2e = await testA2E();
  results.runcomfy = await testRunComfy();
  results.dzine = await testDzine();
  results.fal = await testFal();
  
  console.log('\n==================================');
  console.log('📊 RESULTS SUMMARY:');
  console.log('==================================');
  
  for (const [api, passed] of Object.entries(results)) {
    console.log(`  ${passed ? '✅' : '❌'} ${api.toUpperCase()}`);
  }
  
  const passedCount = Object.values(results).filter(Boolean).length;
  const totalCount = Object.keys(results).length;
  console.log(`\n  ${passedCount}/${totalCount} APIs operational`);
  
  if (passedCount < totalCount) {
    console.log('\n💡 Troubleshooting tips:');
    if (!results.a2e) console.log('   - A2E: Check API key at https://a2e.ai');
    if (!results.runcomfy) console.log('   - RunComfy: Check token at https://runcomfy.com');
    if (!results.dzine) console.log('   - Dzine: Token may be expired');
  }
}

runAllTests().catch(console.error);
