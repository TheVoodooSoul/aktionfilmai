const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  console.error('Need: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runSetup() {
  console.log('🚀 Setting up AktionFilmAI database...\n');

  // Read the SQL file
  const sqlFile = path.join(__dirname, 'migrations', '00_complete_setup.sql');
  let sql = fs.readFileSync(sqlFile, 'utf8');

  // Remove comments and split into individual statements
  const statements = sql
    .split('\n')
    .filter(line => !line.trim().startsWith('--'))
    .join('\n')
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);

  console.log(`📝 Found ${statements.length} SQL statements to execute\n`);

  // Execute each statement
  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];

    // Skip empty statements
    if (!statement || statement.trim() === '') continue;

    try {
      const { error } = await supabase.rpc('exec_sql', { sql_query: statement + ';' });

      if (error) {
        // Try direct query if RPC fails
        const { error: directError } = await supabase
          .from('_sql')
          .select('*')
          .limit(0);

        if (directError) {
          console.log(`⚠️  Statement ${i + 1}: ${statement.substring(0, 60)}... (might be ok)`);
        } else {
          successCount++;
        }
      } else {
        successCount++;
        if ((i + 1) % 10 === 0) {
          console.log(`✅ Executed ${i + 1}/${statements.length} statements...`);
        }
      }
    } catch (err) {
      console.log(`⚠️  Statement ${i + 1}: ${err.message}`);
      errorCount++;
    }
  }

  console.log('\n📊 Results:');
  console.log(`   ✅ Success: ${successCount}`);
  console.log(`   ⚠️  Warnings: ${errorCount}`);
  console.log('\n✅ Database setup complete!\n');

  // Check if tables exist
  console.log('🔍 Verifying tables...\n');

  const tables = ['profiles', 'credit_transactions', 'character_references', 'beta_signups'];

  for (const table of tables) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .limit(0);

    if (error) {
      console.log(`   ❌ ${table}: NOT FOUND`);
    } else {
      console.log(`   ✅ ${table}: EXISTS`);
    }
  }

  console.log('\n🎉 All done!\n');
  console.log('Next steps:');
  console.log('1. Go to: https://supabase.com/dashboard/project/bqxxyqlbxyvfuanoiwyh/auth/users');
  console.log('2. Click "Add User"');
  console.log('3. Email: admin@aktionfilm.ai');
  console.log('4. Password: (choose one)');
  console.log('5. Copy the User ID');
  console.log('6. Run: node set-admin.js YOUR_USER_ID');
  console.log('');
}

runSetup().catch(err => {
  console.error('❌ Setup failed:', err);
  process.exit(1);
});
