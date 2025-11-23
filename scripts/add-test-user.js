const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function addTestUser() {
  const testUserId = '00000000-0000-0000-0000-000000000001';
  const testEmail = 'test@aktionfilm.ai';
  const testPassword = 'test123456';

  console.log('Creating/updating test super admin user...\n');

  // Step 1: Create auth user (this requires service role key)
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: testEmail,
    password: testPassword,
    email_confirm: true,
    user_metadata: {
      name: 'Test Super Admin'
    }
  });

  if (authError) {
    if (authError.message.includes('already registered')) {
      console.log('✅ Auth user already exists');

      // Try to get the existing user
      const { data: users } = await supabase.auth.admin.listUsers();
      const existingUser = users?.users.find(u => u.email === testEmail);

      if (existingUser) {
        console.log(`   User ID: ${existingUser.id}`);
      }
    } else {
      console.error('❌ Error creating auth user:', authError.message);
      return;
    }
  } else {
    console.log('✅ Auth user created');
    console.log(`   User ID: ${authData.user?.id}`);
    console.log(`   Email: ${testEmail}`);
  }

  // Step 2: Create/update profile
  const { data: existing } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', testEmail)
    .maybeSingle();

  if (existing) {
    console.log('\n✅ Profile exists, updating credits...');
    const { error } = await supabase
      .from('profiles')
      .update({
        credits: 1000,
        subscription_tier: 'pro',
        subscription_status: 'active'
      })
      .eq('email', testEmail);

    if (error) {
      console.error('❌ Error updating profile:', error.message);
    } else {
      console.log('✅ Profile updated: 1000 credits');
    }
  } else {
    console.log('\n⏳ Creating profile...');

    // Get the auth user ID
    const { data: users } = await supabase.auth.admin.listUsers();
    const user = users?.users.find(u => u.email === testEmail);

    if (!user) {
      console.error('❌ Could not find auth user to create profile');
      return;
    }

    const { error } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        email: testEmail,
        credits: 1000,
        subscription_tier: 'pro',
        subscription_status: 'active'
      });

    if (error) {
      console.error('❌ Error creating profile:', error.message);
    } else {
      console.log('✅ Profile created with 1000 credits');
    }
  }

  console.log('\n🎉 Test user ready!');
  console.log(`   Email: ${testEmail}`);
  console.log(`   Password: ${testPassword}`);
}

addTestUser();
