import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { Resend } from 'resend';

export async function POST(req: NextRequest) {
  try {
    const {
      email,
      experience,
      interests,
      discovery,
      selectedTier,
      wantsAnnual,
      wantsNewsletter
    } = await req.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    // Calculate pricing based on tier and annual preference
    let tierInfo = {
      name: selectedTier === 'plus' ? 'Beta Plus' : 'Beta Starter',
      credits: selectedTier === 'plus' ? 1400 : 500,
      monthlyPrice: selectedTier === 'plus' ? 40 : 29,
      annualPrice: 0,
    };

    // 20% discount for annual
    tierInfo.annualPrice = Math.round(tierInfo.monthlyPrice * 12 * 0.8);

    const { data, error } = await supabase
      .from('beta_signups')
      .insert({
        email,
        experience: experience || null,
        interests: interests || [],
        discovery: discovery || null,
        selected_tier: selectedTier || 'starter',
        wants_annual: wantsAnnual || false,
        wants_newsletter: wantsNewsletter || false,
        status: 'pending',
      })
      .select();

    if (error) {
      if (error.code === '23505') { // Unique violation
        return NextResponse.json(
          { error: 'Email already registered for beta' },
          { status: 409 }
        );
      }
      throw error;
    }

    // Send email notification to admin
    if (process.env.RESEND_API_KEY) {
      try {
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
          from: 'AktionFilmAI <onboarding@resend.dev>',
          to: 'adam@egopandacreative.com',
          subject: `🎬 New Beta Signup: ${email}`,
          html: `
            <h2>New Beta Signup!</h2>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Selected Tier:</strong> ${tierInfo.name} ($${selectedTier === 'plus' ? '39.99' : '20'})</p>
            <p><strong>Wants Annual:</strong> ${wantsAnnual ? 'Yes (20% off)' : 'No'}</p>
            <p><strong>Experience:</strong> ${experience || 'Not specified'}</p>
            <p><strong>Interests:</strong> ${interests?.join(', ') || 'Not specified'}</p>
            <p><strong>How Useful:</strong> ${discovery || 'Not specified'}</p>
            <p><strong>Newsletter:</strong> ${wantsNewsletter ? 'Yes' : 'No'}</p>
            <hr>
            <p><a href="https://supabase.com/dashboard/project/bqxxyqlbxyvfuanoiwyh/editor/29548">View in Supabase</a></p>
          `,
        });
        console.log('Admin notification email sent for:', email);
      } catch (emailError) {
        // Don't fail the signup if email fails
        console.error('Failed to send admin notification:', emailError);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully signed up for beta!',
      tier: tierInfo,
    });
  } catch (error) {
    console.error('Beta signup error:', error);
    return NextResponse.json(
      { error: 'Failed to sign up' },
      { status: 500 }
    );
  }
}
