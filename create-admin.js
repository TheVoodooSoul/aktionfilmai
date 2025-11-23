#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('❌ Missing environment variables');
  console.error('Need: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createAdmin() {
  console.log('🚀 Creating super admin user...\n');

  const adminEmail = 'admin@aktionfilm.ai';
  const adminPassword = 'AktionFilm2025!'; // Change this if you want

  // 1. Create the user
  console.log('📝 Creating user in Supabase Auth...');
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: adminEmail,
    password: adminPassword,
    email_confirm: true, // Auto-confirm, no email needed
  });

  if (authError) {
    console.error('❌ Failed to create user:', authError.message);
    process.exit(1);
  }

  const userId = authData.user.id;
  console.log('✅ User created with ID:', userId);

  // 2. Wait a second for trigger to create profile
  await new Promise(resolve => setTimeout(resolve, 1000));

  // 3. Update profile with admin privileges and credits
  console.log('\n📝 Setting admin privileges and credits...');
  const { error: updateError } = await supabase
    .from('profiles')
    .update({
      credits: 9999,
      is_admin: true
    })
    .eq('id', userId);

  if (updateError) {
    console.error('❌ Failed to update profile:', updateError.message);
    console.log('\nℹ️  Try running this SQL manually:');
    console.log(`UPDATE profiles SET credits = 9999, is_admin = true WHERE id = '${userId}';`);
    process.exit(1);
  }

  console.log('✅ Admin privileges granted');

  // 4. Verify
  console.log('\n🔍 Verifying...');
  const { data: profile, error: verifyError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (verifyError) {
    console.error('⚠️  Could not verify profile:', verifyError.message);
  } else {
    console.log('✅ Profile verified:');
    console.log('   Email:', profile.email);
    console.log('   Credits:', profile.credits);
    console.log('   Is Admin:', profile.is_admin);
  }

  console.log('\n🎉 Super admin created successfully!\n');
  console.log('═══════════════════════════════════════');
  console.log('  Login Credentials:');
  console.log('  Email:    admin@aktionfilm.ai');
  console.log('  Password: AktionFilm2025!');
  console.log('═══════════════════════════════════════');
  console.log('\n✨ Go to http://localhost:3000/login to test!\n');
}

createAdmin().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
