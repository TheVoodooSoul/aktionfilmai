import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * RunComfy Wan2.2-Fun-Inp Workflow
 * Generates video from first frame + last frame
 * Uses overrides to pass images to the workflow
 */
export async function POST(req: NextRequest) {
  try {
    const { firstFrame, lastFrame, creativity, userId } = await req.json();

    if (!firstFrame || !lastFrame) {
      return NextResponse.json(
        { error: 'Both first frame and last frame are required' },
        { status: 400 }
      );
    }

    console.log('Wan2.2-Fun-Inp Request:', {
      hasToken: !!process.env.RUNCOMFY_API_TOKEN,
      hasUserId: !!process.env.RUNCOMFY_USER_ID,
      hasDeploymentId: !!process.env.WAN_FUN_INP_DEPLOYMENT_ID,
      hasFirstFrame: !!firstFrame,
      hasLastFrame: !!lastFrame,
    });

    // RunComfy API - Start workflow with overrides
    const response = await fetch(`https://api.runcomfy.com/v1/runs`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RUNCOMFY_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        workflow_id: `${process.env.RUNCOMFY_USER_ID}/Wan2.2-Fun-Inp`,
        deployment_id: process.env.WAN_FUN_INP_DEPLOYMENT_ID,
        // Overrides allow you to change specific node inputs
        // You need to match the exact node IDs from your workflow_api.json
        overrides: {
          // These node IDs need to match your workflow
          // Typically for Wan2.2-Fun-Inp:
          // - Node for first frame (usually a LoadImage node)
          // - Node for last frame (another LoadImage node)
          // Example structure (adjust node IDs based on your workflow):
          "first_frame_loader": {
            "image": firstFrame // Can be URL or base64 data URI
          },
          "last_frame_loader": {
            "image": lastFrame // Can be URL or base64 data URI
          },
          // You can also override other settings like:
          // "sampler_node": {
          //   "steps": Math.round(creativity * 50) + 20,
          //   "cfg": creativity * 10 + 5
          // }
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('RunComfy API error:', response.status, errorText);
      return NextResponse.json(
        { error: `RunComfy API error: ${response.status} - ${errorText}` },
        { status: 500 }
      );
    }

    const data = await response.json();
    const runId = data.id || data.run_id;

    if (!runId) {
      return NextResponse.json(
        { error: 'No run ID returned from RunComfy' },
        { status: 500 }
      );
    }

    console.log('RunComfy Run started:', runId);

    // Poll for completion (max 5 minutes, check every 5 seconds)
    let videoUrl = null;
    let attempts = 0;
    const maxAttempts = 60; // 5 minutes / 5 seconds

    while (attempts < maxAttempts && !videoUrl) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds

      const statusResponse = await fetch(`https://api.runcomfy.com/v1/runs/${runId}`, {
        headers: {
          'Authorization': `Bearer ${process.env.RUNCOMFY_API_TOKEN}`,
        },
      });

      const statusData = await statusResponse.json();
      console.log(`Polling attempt ${attempts + 1}:`, statusData.status);

      if (statusData.status === 'succeeded' || statusData.status === 'completed') {
        // Get the video output from the results
        // The exact structure depends on your workflow output nodes
        if (statusData.outputs && statusData.outputs.length > 0) {
          // Find the video output (usually the first output)
          const videoOutput = statusData.outputs.find((output: any) =>
            output.type === 'video' || output.data?.type === 'video' || output.url?.includes('.mp4')
          );
          videoUrl = videoOutput?.url || videoOutput?.data?.url || statusData.outputs[0]?.url;
        }
        break;
      }

      if (statusData.status === 'failed' || statusData.status === 'error') {
        return NextResponse.json(
          { error: `Wan2.2 generation failed: ${statusData.error || 'Unknown error'}` },
          { status: 500 }
        );
      }

      attempts++;
    }

    if (!videoUrl) {
      return NextResponse.json(
        { error: 'Video generation timed out. Please try again.' },
        { status: 408 }
      );
    }

    // Deduct credits (skip for super admin)
    const isSuperAdmin = userId === '00000000-0000-0000-0000-000000000001';
    const creditCost = 5;

    if (userId && !isSuperAdmin) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('credits')
        .eq('id', userId)
        .single();

      if (profile && profile.credits >= creditCost) {
        await supabase
          .from('profiles')
          .update({ credits: profile.credits - creditCost })
          .eq('id', userId);

        await supabase
          .from('credit_transactions')
          .insert({
            user_id: userId,
            amount: -creditCost,
            transaction_type: 'generation',
            description: 'Sequence generation (Wan2.2-Fun-Inp)',
          });
      } else {
        return NextResponse.json(
          { error: 'Insufficient credits' },
          { status: 402 }
        );
      }
    }

    return NextResponse.json({
      output_url: videoUrl,
      status: 'success',
    });
  } catch (error: any) {
    console.error('Sequence generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate sequence' },
      { status: 500 }
    );
  }
}
