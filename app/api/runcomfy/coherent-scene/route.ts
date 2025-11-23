import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * RunComfy CREATE_COHERENT Workflow
 * Creates a coherent scene from 6 input images
 * ⏱️ WARNING: This takes 10-15 minutes to generate!
 */
export async function POST(req: NextRequest) {
  try {
    const { images, userId } = await req.json();

    // Validate 6 images
    if (!images || !Array.isArray(images) || images.length !== 6) {
      return NextResponse.json(
        { error: 'Exactly 6 images are required for coherent scene generation' },
        { status: 400 }
      );
    }

    console.log('CREATE_COHERENT Request:', {
      hasToken: !!process.env.RUNCOMFY_API_TOKEN,
      hasUserId: !!process.env.RUNCOMFY_USER_ID,
      hasDeploymentId: !!process.env.CREATE_COHERENT_DEPLOYMENT_ID,
      imageCount: images.length,
    });

    // RunComfy API - Start workflow with overrides
    const response = await fetch(`https://api.runcomfy.com/v1/runs`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RUNCOMFY_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        workflow_id: `${process.env.RUNCOMFY_USER_ID}/CREATE_COHERENT`,
        deployment_id: process.env.CREATE_COHERENT_DEPLOYMENT_ID,
        // Override the 6 LoadImage nodes with our images (in order)
        overrides: {
          "270": { "image": images[0] }, // Image 1
          "276": { "image": images[1] }, // Image 2
          "283": { "image": images[2] }, // Image 3
          "290": { "image": images[3] }, // Image 4
          "297": { "image": images[4] }, // Image 5
          "304": { "image": images[5] }, // Image 6
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('RunComfy API error:', response.status, errorText);
      return NextResponse.json(
        { error: `RunComfy API error: ${response.status}` },
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

    console.log('CREATE_COHERENT Run started:', runId);

    // Poll for completion (max 20 minutes for coherent scene)
    // Check every 15 seconds to avoid spam
    let outputUrl = null;
    let attempts = 0;
    const maxAttempts = 80; // 20 minutes / 15 seconds

    while (attempts < maxAttempts && !outputUrl) {
      await new Promise(resolve => setTimeout(resolve, 15000)); // Wait 15 seconds

      const statusResponse = await fetch(`https://api.runcomfy.com/v1/runs/${runId}`, {
        headers: {
          'Authorization': `Bearer ${process.env.RUNCOMFY_API_TOKEN}`,
        },
      });

      const statusData = await statusResponse.json();
      const elapsedMinutes = Math.round((attempts * 15) / 60);
      console.log(`Polling attempt ${attempts + 1} (${elapsedMinutes} min):`, statusData.status);

      if (statusData.status === 'succeeded' || statusData.status === 'completed') {
        // Get the output
        if (statusData.outputs && statusData.outputs.length > 0) {
          outputUrl = statusData.outputs[0]?.url || statusData.outputs[0]?.data?.url;
        }
        break;
      }

      if (statusData.status === 'failed' || statusData.status === 'error') {
        return NextResponse.json(
          { error: `Coherent scene generation failed: ${statusData.error || 'Unknown error'}` },
          { status: 500 }
        );
      }

      attempts++;
    }

    if (!outputUrl) {
      return NextResponse.json(
        { error: 'Generation timed out after 20 minutes. The workflow may still be processing.' },
        { status: 408 }
      );
    }

    // Deduct credits (skip for super admin)
    const isSuperAdmin = userId === '00000000-0000-0000-0000-000000000001';
    const creditCost = 10; // Higher cost due to long processing time

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
            description: 'Coherent scene generation (6 images)',
          });
      } else {
        return NextResponse.json(
          { error: 'Insufficient credits' },
          { status: 402 }
        );
      }
    }

    return NextResponse.json({
      output_url: outputUrl,
      status: 'success',
    });
  } catch (error: any) {
    console.error('Coherent scene generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate coherent scene' },
      { status: 500 }
    );
  }
}
