#!/usr/bin/env node
/**
 * AktionFilmAI Full API Smoke Test v3
 * Tests ALL APIs used by Canvas
 */

require('dotenv').config({ path: '.env.local' });

const BASE_URL = 'http://localhost:3000';

// Color helpers
const green = (s) => `\x1b[32m${s}\x1b[0m`;
const red = (s) => `\x1b[31m${s}\x1b[0m`;
const yellow = (s) => `\x1b[33m${s}\x1b[0m`;
const cyan = (s) => `\x1b[36m${s}\x1b[0m`;

const results = {};

// 1x1 red pixel for testing
const TEST_IMAGE = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

async function testAPI(name, testFn) {
  try {
    console.log(cyan(`\n🔍 Testing ${name}...`));
    const result = await testFn();
    results[name] = result;
    console.log(result ? green(`  ✅ ${name} - PASS`) : red(`  ❌ ${name} - FAIL`));
  } catch (error) {
    results[name] = false;
    console.log(red(`  ❌ ${name} - ERROR: ${error.message}`));
  }
}

// ========== REPLICATE TESTS ==========

async function testReplicateAuth() {
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) return false;
  
  const res = await fetch('https://api.replicate.com/v1/account', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  if (res.ok) {
    const data = await res.json();
    console.log(`     Account: ${data.username}`);
    return true;
  }
  return false;
}

// ========== A2E TESTS ==========

async function testA2ETts() {
  const apiKey = process.env.A2E_API_KEY;
  if (!apiKey) return false;
  
  // Test TTS endpoint - validates auth
  const res = await fetch('https://video.a2e.ai/api/v1/video/send_tts', {
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
  
  const data = await res.json();
  // code 0 = success, 400 = validation error (still means auth works)
  console.log(`     Response: code=${data.code}`);
  return data.code === 0 || res.ok;
}

async function testA2ENanoBanana() {
  const apiKey = process.env.A2E_API_KEY;
  if (!apiKey) return false;
  
  // Just verify endpoint exists (don't actually generate)
  const res = await fetch('https://video.a2e.ai/api/v1/userNanoBanana/start', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: 'test',
      prompt: 'test'
    })
  });
  
  const data = await res.json();
  // Expect validation error (no images), but auth should work
  console.log(`     Endpoint: ${res.status} - ${data.msg || data.message || 'OK'}`);
  return res.status !== 401 && res.status !== 403;
}

async function testA2EI2V() {
  const apiKey = process.env.A2E_API_KEY;
  if (!apiKey) return false;
  
  const res = await fetch('https://video.a2e.ai/api/v1/userImage2Video/start', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: 'test',
      image_url: 'https://example.com/test.jpg',
      prompt: 'test'
    })
  });
  
  const data = await res.json();
  console.log(`     Endpoint: ${res.status}`);
  return res.status !== 401 && res.status !== 403;
}

async function testA2EV2V() {
  const apiKey = process.env.A2E_API_KEY;
  if (!apiKey) return false;
  
  const res = await fetch('https://video.a2e.ai/api/v1/userVideo2Video/start', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: 'test',
      video_url: 'https://example.com/test.mp4',
      prompt: 'test'
    })
  });
  
  const data = await res.json();
  console.log(`     Endpoint: ${res.status}`);
  return res.status !== 401 && res.status !== 403;
}

async function testA2EFaceSwap() {
  const apiKey = process.env.A2E_API_KEY;
  if (!apiKey) return false;
  
  const res = await fetch('https://video.a2e.ai/api/v1/userFaceSwapTask/add', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: 'test',
      face_url: 'https://example.com/face.jpg',
      video_url: 'https://example.com/video.mp4'
    })
  });
  
  const data = await res.json();
  console.log(`     Endpoint: ${res.status}`);
  return res.status !== 401 && res.status !== 403;
}

// ========== FAL TESTS ==========

async function testFalAuth() {
  const apiKey = process.env.FAL_API_KEY;
  if (!apiKey) return false;
  
  // Test with a real model endpoint
  const res = await fetch('https://fal.run/fal-ai/flux/dev', {
    method: 'POST',
    headers: {
      'Authorization': `Key ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      prompt: 'test'
    })
  });
  
  // 200 or 422 (validation) means auth works
  console.log(`     Status: ${res.status}`);
  return res.status !== 401 && res.status !== 403;
}

async function testFalLoRAs() {
  const apiKey = process.env.FAL_API_KEY;
  if (!apiKey) return false;
  
  // Verify LoRA URLs are accessible
  const loraUrls = {
    punch: 'https://v3.fal.media/files/zebra/-x8yySPU3oiXHfqjG_wtN_adapter_model.safetensors',
    kick: 'https://v3.fal.media/files/rabbit/wHyoYJLx1pYifFifUNRV3_adapter_model.safetensors',
    takedown: 'https://v3b.fal.media/files/b/koala/91oSdDegjvEh4C0nEwXkA_adapter_model.safetensors',
  };
  
  let allGood = true;
  for (const [name, url] of Object.entries(loraUrls)) {
    const res = await fetch(url, { method: 'HEAD' });
    const ok = res.ok;
    console.log(`     ${name}: ${ok ? '✓' : '✗'}`);
    if (!ok) allGood = false;
  }
  
  return allGood;
}

// ========== MAIN ==========

async function main() {
  console.log('🚀 AKTIONFILMAI FULL API SMOKE TEST');
  console.log('=====================================');
  console.log('Testing direct API endpoints (not local server)\n');
  
  // Replicate
  console.log(cyan('\n━━━ REPLICATE ━━━'));
  await testAPI('Replicate Auth', testReplicateAuth);
  
  // A2E
  console.log(cyan('\n━━━ A2E.AI ━━━'));
  await testAPI('A2E TTS', testA2ETts);
  await testAPI('A2E NanoBanana', testA2ENanoBanana);
  await testAPI('A2E I2V', testA2EI2V);
  await testAPI('A2E V2V', testA2EV2V);
  await testAPI('A2E Face Swap', testA2EFaceSwap);
  
  // FAL
  console.log(cyan('\n━━━ FAL.AI ━━━'));
  await testAPI('Fal Auth', testFalAuth);
  await testAPI('Fal LoRAs', testFalLoRAs);
  
  // Summary
  console.log('\n=====================================');
  console.log('📊 SUMMARY');
  console.log('=====================================');
  
  const passed = Object.values(results).filter(Boolean).length;
  const total = Object.keys(results).length;
  
  for (const [name, pass] of Object.entries(results)) {
    console.log(`  ${pass ? green('✅') : red('❌')} ${name}`);
  }
  
  console.log(`\n  ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log(green('\n🎉 All APIs operational!'));
  } else {
    console.log(yellow('\n⚠️  Some APIs need attention'));
  }
}

main().catch(console.error);
