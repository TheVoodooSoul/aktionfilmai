import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-11-17.clover',
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature')!;

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentSucceeded(invoice);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(invoice);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: error.message || 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId;
  const dataOptIn = session.metadata?.dataOptIn === 'true';

  if (!userId) {
    console.error('No userId in checkout session metadata');
    return;
  }

  // Get subscription details
  const subscription = await stripe.subscriptions.retrieve(
    session.subscription as string
  );

  const priceId = subscription.items.data[0]?.price.id;

  // Determine tier based on price ID
  let tier = 'free';
  let credits = 0;

  if (priceId === process.env.STRIPE_PRICE_HOBBYIST) {
    tier = 'hobbyist';
    credits = 100;
  } else if (priceId === process.env.STRIPE_PRICE_INDIE) {
    tier = 'indie';
    credits = 500;
  } else if (priceId === process.env.STRIPE_PRICE_PRO) {
    tier = 'pro';
    credits = 2000;
  }

  // Update user profile in Supabase
  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({
      id: userId,
      subscription_tier: tier,
      stripe_customer_id: session.customer as string,
      stripe_subscription_id: subscription.id,
      subscription_status: subscription.status,
      current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
      credits: credits,
    });

  if (profileError) {
    console.error('Error updating profile:', profileError);
  }

  console.log(`✅ Subscription activated for user ${userId}: ${tier} tier with ${credits} credits`);
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId;

  if (!userId) {
    console.error('No userId in subscription metadata');
    return;
  }

  const priceId = subscription.items.data[0]?.price.id;

  let tier = 'free';
  let credits = 0;

  if (priceId === process.env.STRIPE_PRICE_HOBBYIST) {
    tier = 'hobbyist';
    credits = 100;
  } else if (priceId === process.env.STRIPE_PRICE_INDIE) {
    tier = 'indie';
    credits = 500;
  } else if (priceId === process.env.STRIPE_PRICE_PRO) {
    tier = 'pro';
    credits = 2000;
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      subscription_tier: tier,
      subscription_status: subscription.status,
      current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
      credits: credits,
    })
    .eq('stripe_subscription_id', subscription.id);

  if (error) {
    console.error('Error updating subscription:', error);
  }

  console.log(`✅ Subscription updated for user ${userId}: ${tier} tier, status: ${subscription.status}`);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const { error } = await supabase
    .from('profiles')
    .update({
      subscription_tier: 'free',
      subscription_status: 'canceled',
      credits: 0,
    })
    .eq('stripe_subscription_id', subscription.id);

  if (error) {
    console.error('Error canceling subscription:', error);
  }

  console.log(`✅ Subscription canceled: ${subscription.id}`);
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  if (!(invoice as any).subscription) return;

  const subscription = await stripe.subscriptions.retrieve(
    (invoice as any).subscription as string
  );

  const userId = subscription.metadata?.userId;
  if (!userId) return;

  // Refill credits on successful payment
  const priceId = subscription.items.data[0]?.price.id;

  let credits = 0;
  if (priceId === process.env.STRIPE_PRICE_HOBBYIST) {
    credits = 100;
  } else if (priceId === process.env.STRIPE_PRICE_INDIE) {
    credits = 500;
  } else if (priceId === process.env.STRIPE_PRICE_PRO) {
    credits = 2000;
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      credits: credits,
      subscription_status: 'active',
    })
    .eq('id', userId);

  if (error) {
    console.error('Error refilling credits:', error);
  }

  console.log(`✅ Payment succeeded for user ${userId}: ${credits} credits refilled`);
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  if (!(invoice as any).subscription) return;

  const subscription = await stripe.subscriptions.retrieve(
    (invoice as any).subscription as string
  );

  const userId = subscription.metadata?.userId;
  if (!userId) return;

  const { error } = await supabase
    .from('profiles')
    .update({
      subscription_status: 'past_due',
    })
    .eq('id', userId);

  if (error) {
    console.error('Error updating payment failed status:', error);
  }

  console.log(`⚠️ Payment failed for user ${userId}`);
}
