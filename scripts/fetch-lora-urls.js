// Script to fetch LoRA URLs from FAL training results
import { fal } from "@fal-ai/client";

// Training request IDs
const trainingIds = {
  punch: "8f3e6312-b259-4e85-bd54-c218f856cf2e",
  kick: "7bd6fdea-fd83-406d-9098-b1d8d83be0cf",
  takedown: "34018947-23d9-48c2-8879-442c016ac4b9",
};

async function fetchLoraUrls() {
  console.log("Fetching LoRA URLs from FAL...\n");

  const urls = {};

  for (const [action, requestId] of Object.entries(trainingIds)) {
    try {
      console.log(`Fetching ${action} LoRA (ID: ${requestId})...`);

      const result = await fal.queue.result("fal-ai/wan-22-image-trainer", {
        requestId: requestId,
      });

      if (result.data?.diffusers_lora_file?.url) {
        urls[action] = result.data.diffusers_lora_file.url;
        console.log(`✓ ${action}: ${result.data.diffusers_lora_file.url}\n`);
      } else {
        console.log(`✗ ${action}: No URL found\n`);
      }
    } catch (error) {
      console.error(`✗ Error fetching ${action}:`, error.message, "\n");
    }
  }

  console.log("\n=== LORA_MAPPING ===");
  console.log("Copy this into your route.ts file:\n");
  console.log("const LORA_MAPPING: Record<string, string> = {");
  for (const [action, url] of Object.entries(urls)) {
    console.log(`  ${action}: '${url}',`);
  }
  console.log("};");
}

fetchLoraUrls().catch(console.error);
