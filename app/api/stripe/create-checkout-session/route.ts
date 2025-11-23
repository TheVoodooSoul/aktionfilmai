import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-11-17.clover',
});

export async function POST(request: NextRequest) {
  try {
    const { priceId, userId, userEmail, dataOptIn } = await request.json();

    if (!priceId || !userId || !userEmail) {
      return NextResponse.json(
        { error: 'Missing required fields: priceId, userId, userEmail' },
        { status: 400 }
      );
    }

    // Apply 10% discount if user has opted into data sharing
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/canvas?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/pricing?canceled=true`,
      customer_email: userEmail,
      metadata: {
        userId,
        dataOptIn: dataOptIn ? 'true' : 'false',
      },
      subscription_data: {
        metadata: {
          userId,
          dataOptIn: dataOptIn ? 'true' : 'false',
        },
      },
    };

    // Add discount if data sharing is enabled
    if (dataOptIn) {
      sessionParams.discounts = [
        {
          coupon: process.env.STRIPE_DATA_SHARING_COUPON_ID || 'DATA_SHARING_10',
        },
      ];
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error: any) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
