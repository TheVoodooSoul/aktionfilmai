require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_PRIVATE_KEY
);

async function checkTrainingData() {
  console.log('Checking for training data submissions...\n');

  const { data, error } = await supabase
    .from('shared_training_data')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    console.log('Error:', error.message);
  } else if (data.length === 0) {
    console.log('No training data yet (expected if you haven\'t opted in and generated anything)');
  } else {
    console.log(`Found ${data.length} training data submissions:`);
    data.forEach((item, i) => {
      console.log(`\n${i + 1}. ${item.node_type} (${item.output_type})`);
      console.log(`   Created: ${item.created_at}`);
      console.log(`   Prompt: ${item.prompt?.substring(0, 50)}...`);
    });
  }

  // Check stats
  const { data: stats, error: statsError } = await supabase
    .from('training_data_stats')
    .select('*');

  if (!statsError && stats?.length > 0) {
    console.log('\n📊 Training Data Stats:');
    stats.forEach(stat => {
      console.log(`   ${stat.node_type} (${stat.output_type}): ${stat.total_outputs} outputs`);
    });
  }
}

checkTrainingData();
