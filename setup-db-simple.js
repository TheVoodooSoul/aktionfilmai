#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Load environment
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_PRIVATE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌ Missing env vars: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_PRIVATE_KEY');
  process.exit(1);
}

console.log('🚀 Setting up AktionFilmAI Database\n');
console.log('This script will create all tables, policies, and triggers.\n');

// Read SQL file
const sqlPath = path.join(__dirname, 'migrations', '00_complete_setup.sql');
const sql = fs.readFileSync(sqlPath, 'utf8');

console.log('📝 SQL loaded from migrations/00_complete_setup.sql');
console.log('\n⚠️  MANUAL STEP REQUIRED:\n');
console.log('Please run this SQL in Supabase Dashboard:');
console.log('1. Go to: https://supabase.com/dashboard/project/bqxxyqlbxyvfuanoiwyh/sql/new');
console.log('2. Copy the SQL from: migrations/00_complete_setup.sql');
console.log('3. Paste and click "Run"\n');

console.log('Or copy this command to open the file:');
console.log(`   cat ${sqlPath} | pbcopy`);
console.log('   (This copies the SQL to your clipboard)\n');

console.log('After running the SQL, create super admin:');
console.log('1. Go to Authentication → Users → Add User');
console.log('2. Email: admin@aktionfilm.ai');
console.log('3. Password: (your choice)');
console.log('4. Copy user ID');
console.log('5. Run in SQL Editor:');
console.log('   UPDATE profiles SET credits = 9999, is_admin = true WHERE id = \'USER_ID\';');

process.exit(0);
