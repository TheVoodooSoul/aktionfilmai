import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

/**
 * Credit costs for different features
 */
export const CREDIT_COSTS = {
  // Writers Room
  WRITERS_ROOM_AI_SUGGESTION: 1,
  WRITERS_ROOM_IMPROV: 2,
  WRITERS_ROOM_STORYBOARD: 5,
  WRITERS_ROOM_VIDEO_GENERATION: 10,
  WRITERS_ROOM_PERFORMANCE: 5,
  WRITERS_ROOM_CHARACTER_GENERATION: 5,
  
  // Avatar Training
  AVATAR_VIDEO_TRAINING: 10,  // Video avatars 
  AVATAR_IMAGE_TRAINING: 30,  // Image avatars
  AVATAR_CONTINUE_TRAINING: 20, // Studio avatar upgrade
  
  // Voice
  VOICE_CLONE: 10, // Voice cloning
  
  // A2E Features
  TALKING_VIDEO: 5,
  TALKING_PHOTO: 5,
  FACE_SWAP: 5,
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
  
  const tierLevels = { 'free': 0, 'basic': 1, 'pro': 2 };
  const userLevel = tierLevels[profile.subscription_tier];
  const requiredLevel = tierLevels[requiredTier];
  
  if (userLevel < requiredLevel) {
    return { 
      success: false, 
      error: `This feature requires ${requiredTier} subscription or higher` 
    };
  }
  
  return { success: true };
}