import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

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
