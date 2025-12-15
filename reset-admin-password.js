#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_PRIVATE_KEY;

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function resetPassword() {
  console.log('🔐 Resetting admin password...\n');

  const adminEmail = 'admin@aktionfilm.ai';
  const newPassword = 'Test123456!';

  // 1. Get the user
  console.log('📝 Finding user:', adminEmail);
  const { data: users, error: listError } = await supabase.auth.admin.listUsers();

  if (listError) {
    console.error('❌ Error listing users:', listError.message);
    process.exit(1);
  }

  const user = users.users.find(u => u.email === adminEmail);

  if (!user) {
    console.log('❌ User not found. Creating new user...\n');

    const { data: authData, error: createError } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: newPassword,
      email_confirm: true,
    });

    if (createError) {
      console.error('❌ Failed to create user:', createError.message);
      process.exit(1);
    }

    console.log('✅ User created with ID:', authData.user.id);

    // Wait for profile trigger
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Set admin privileges
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ credits: 9999, is_admin: true })
      .eq('id', authData.user.id);

    if (updateError) {
      console.error('⚠️  Could not update profile automatically');
      console.log('Run this SQL manually:');
      console.log(`UPDATE profiles SET credits = 9999, is_admin = true WHERE id = '${authData.user.id}';`);
    } else {
      console.log('✅ Admin privileges set');
    }
  } else {
    console.log('✅ User found with ID:', user.id);
    console.log('\n📝 Resetting password...');

    const { error: updateError } = await supabase.auth.admin.updateUserById(
      user.id,
      { password: newPassword }
    );

    if (updateError) {
      console.error('❌ Failed to reset password:', updateError.message);
      process.exit(1);
    }

    console.log('✅ Password reset successfully');

    // Also make sure they're admin with credits
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ credits: 9999, is_admin: true })
      .eq('id', user.id);

    if (!profileError) {
      console.log('✅ Admin privileges confirmed');
    }
  }

  console.log('\n🎉 All done!\n');
  console.log('═══════════════════════════════════════');
  console.log('  Login Credentials:');
  console.log('  ');
  console.log('  Email:    admin@aktionfilm.ai');
  console.log('  Password: Test123456!');
  console.log('  ');
  console.log('═══════════════════════════════════════');
  console.log('\n✨ Go to http://localhost:3000/login\n');
  console.log('COPY THESE EXACTLY:');
  console.log('Email: admin@aktionfilm.ai');
  console.log('Password: Test123456!');
  console.log('');
}

resetPassword().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
