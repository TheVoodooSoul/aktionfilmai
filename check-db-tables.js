require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_PRIVATE_KEY
);

async function checkDatabase() {
  try {
    console.log('Connecting to Supabase...\n');

    // Check tables using a simple query
    const { data: betaSignups, error: betaError } = await supabase
      .from('beta_signups')
      .select('*')
      .limit(1);

    console.log('✓ beta_signups table exists');

    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(1);

    if (usersError) {
      console.log('✗ users table does NOT exist');
      console.log('  Error:', usersError.message);
    } else {
      console.log('✓ users table exists');
    }

    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);

    if (profilesError) {
      console.log('✗ profiles table does NOT exist');
    } else {
      console.log('✓ profiles table exists');
    }

    const { data: charRefs, error: charError } = await supabase
      .from('character_references')
      .select('*')
      .limit(1);

    if (charError) {
      console.log('✗ character_references table does NOT exist');
    } else {
      console.log('✓ character_references table exists');
    }

    console.log('\nChecking for shared_training_data...');
    const { data: training, error: trainingError } = await supabase
      .from('shared_training_data')
      .select('*')
      .limit(1);

    if (trainingError) {
      console.log('✗ shared_training_data table does NOT exist (expected)');
    } else {
      console.log('✓ shared_training_data table exists');
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkDatabase();
