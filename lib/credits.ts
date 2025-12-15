import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

/**
 * Credit costs for different features
 */
export const CREDIT_COSTS = {
  // Writers Room
  WRITERS_ROOM_AI_SUGGESTION: 1,
  WRITERS_ROOM_IMPROV: 1,  // 1 credit per message exchange (~$0.04 revenue, ~$0.001 cost = 97% margin)
  WRITERS_ROOM_STORYBOARD: 2,  // 2 credits per frame (Replicate SDXL Lightning)
  WRITERS_ROOM_STORYBOARD_BATCH: 15,  // 15 credits for up to 10 frames
  WRITERS_ROOM_VIDEO_GENERATION: 10,
  WRITERS_ROOM_PERFORMANCE: 10,  // Run Lines with avatar
  WRITERS_ROOM_CHARACTER_GENERATION: 5,
  
  // Avatar Training (A2E costs ~$2-5 per avatar, price for profit)
  AVATAR_VIDEO_TRAINING: 75,   // Video avatars (~$3 revenue at worst tier)
  AVATAR_IMAGE_TRAINING: 150,  // Image avatars (~$6 revenue at worst tier)
  AVATAR_CONTINUE_TRAINING: 50, // Studio avatar upgrade
  
  // Voice
  VOICE_CLONE: 10, // Voice cloning
  
  // A2E Features (API costs ~$0.50-2 each)
  TALKING_VIDEO: 75,   // TTS + A2E avatar video
  TALKING_PHOTO: 10,   // Static talking photo
  FACE_SWAP: 15,       // Face swap processing
  FACE_LIBRARY_ADD: 3,
  DUBBING: 3,
  LIPSYNC: 3,
  BACKGROUND_ADD: 5,
  
  // Canvas/Generation
  PREVIEW_GENERATION: 1,
  FINAL_GENERATION: 5,
  SEQUENCE_GENERATION: 10,
  
  // Contest
  CONTEST_VOTE_TOKENS: 5,
  
  // Free features
  TEXT_ONLY_IMPROV: 0,  // Text-only improv is free for beta
  TEXT_TO_SPEECH_TEST: 0, // Basic TTS is free
};

/**
 * Check if user has sufficient credits
 */
export async function checkCredits(userId: string, amount: number) {
  const supabase = createRouteHandlerClient({ cookies });
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('credits')
    .eq('id', userId)
    .single();
    
  if (!profile) {
    return { success: false, error: 'User not found' };
  }
  
  if (profile.credits < amount) {
    return { 
      success: false, 
      error: `Insufficient credits. Need ${amount} credits, have ${profile.credits}.`,
      currentCredits: profile.credits
    };
  }
  
  return { success: true, currentCredits: profile.credits };
}

/**
 * Deduct credits from user account
 */
export async function deductCredits(
  userId: string, 
  amount: number, 
  description: string
) {
  const supabase = createRouteHandlerClient({ cookies });
  
  // Check current balance
  const { data: profile } = await supabase
    .from('profiles')
    .select('credits')
    .eq('id', userId)
    .single();
    
  if (!profile || profile.credits < amount) {
    return { 
      success: false, 
      error: 'Insufficient credits' 
    };
  }
  
  // Deduct credits
  const newBalance = profile.credits - amount;
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ credits: newBalance })
    .eq('id', userId);
    
  if (updateError) {
    console.error('Failed to deduct credits:', updateError);
    return { success: false, error: 'Failed to update credits' };
  }
  
  // Log transaction
  const { error: logError } = await supabase
    .from('credit_transactions')
    .insert({
      user_id: userId,
      amount: -amount,
      transaction_type: 'generation',
      description: description,
    });
    
  if (logError) {
    console.error('Failed to log transaction:', logError);
    // Don't fail the operation if logging fails
  }
  
  return { success: true, newBalance };
}

/**
 * Refund credits to user account
 */
export async function refundCredits(
  userId: string, 
  amount: number, 
  description: string
) {
  const supabase = createRouteHandlerClient({ cookies });
  
  // Get current balance
  const { data: profile } = await supabase
    .from('profiles')
    .select('credits')
    .eq('id', userId)
    .single();
    
  if (!profile) {
    return { success: false, error: 'User not found' };
  }
  
  // Add credits
  const newBalance = profile.credits + amount;
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ credits: newBalance })
    .eq('id', userId);
    
  if (updateError) {
    console.error('Failed to refund credits:', updateError);
    return { success: false, error: 'Failed to update credits' };
  }
  
  // Log transaction
  const { error: logError } = await supabase
    .from('credit_transactions')
    .insert({
      user_id: userId,
      amount: amount,
      transaction_type: 'refund',
      description: description,
    });
    
  if (logError) {
    console.error('Failed to log refund:', logError);
  }
  
  return { success: true, newBalance };
}

/**
 * Check if feature is available for user's subscription tier
 */
export async function checkSubscriptionAccess(
  userId: string, 
  requiredTier: 'free' | 'basic' | 'pro'
) {
  const supabase = createRouteHandlerClient({ cookies });
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_tier, subscription_status')
    .eq('id', userId)
    .single();
    
  if (!profile) {
    return { success: false, error: 'User not found' };
  }
  
  if (profile.subscription_status !== 'active') {
    return { success: false, error: 'Subscription inactive' };
  }
  
  const tierLevels: Record<string, number> = { 'free': 0, 'basic': 1, 'pro': 2 };
  const userLevel = tierLevels[profile.subscription_tier] ?? 0;
  const requiredLevel = tierLevels[requiredTier] ?? 0;
  
  if (userLevel < requiredLevel) {
    return { 
      success: false, 
      error: `This feature requires ${requiredTier} subscription or higher` 
    };
  }
  
  return { success: true };
}