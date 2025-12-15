import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Server-side client with service role (bypasses RLS) - use only in API routes
export function getSupabaseAdmin() {
  const serviceRoleKey = process.env.SUPABASE_PRIVATE_KEY;
  if (!serviceRoleKey) {
    console.warn('SUPABASE_PRIVATE_KEY not set, falling back to anon key');
    return supabase;
  }
  return createClient(supabaseUrl, serviceRoleKey);
}

// Database types
export type Database = {
  profiles: {
    id: string;
    email: string;
    credits: number;
    subscription_tier: 'free' | 'basic' | 'pro';
    subscription_status: 'active' | 'inactive' | 'cancelled';
    training_opt_in: boolean;
    training_revenue_share: number;
    created_at: string;
    updated_at: string;
  };
  beta_signups: {
    id: string;
    email: string;
    created_at: string;
  };
  character_references: {
    id: string;
    user_id: string;
    name: string;
    image_url: string;
    created_at: string;
  };
  canvas_projects: {
    id: string;
    user_id: string;
    name: string;
    data: any;
    thumbnail_url: string | null;
    created_at: string;
    updated_at: string;
  };
  generated_outputs: {
    id: string;
    user_id: string;
    project_id: string;
    output_type: 'image' | 'video' | 'sequence';
    output_url: string;
    prompt_data: any;
    allow_training: boolean;
    created_at: string;
  };
  scripts: {
    id: string;
    user_id: string;
    title: string;
    content: string | null;
    metadata: any;
    created_at: string;
    updated_at: string;
  };
  presets: {
    id: string;
    user_id: string;
    name: string;
    description: string | null;
    preset_data: any;
    is_public: boolean;
    uses_count: number;
    created_at: string;
  };
  contest_submissions: {
    id: string;
    user_id: string;
    contest_month: string;
    video_url: string;
    title: string;
    description: string | null;
    votes: number;
    entry_fee_paid: boolean;
    created_at: string;
  };
  credit_transactions: {
    id: string;
    user_id: string;
    amount: number;
    transaction_type: 'purchase' | 'preview' | 'generation' | 'refund';
    description: string | null;
    created_at: string;
  };
};
