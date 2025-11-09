const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://oanohrjkniduqkkahmel.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9hbm9ocmprbmlkdXFra2FobWVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE4NDIyOTEsImV4cCI6MjA3NzQxODI5MX0.Soav_sSh5Ww_BJ7AJywhToZhDIXemEb9X7hSj9xNmdo';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testQuery() {
  console.log('Testing pending_sell_orders → profiles join...\n');
  
  const startTime = Date.now();
  
  const { data, error } = await supabase
    .from('pending_sell_orders')
    .select(`
      *,
      profiles (
        full_name,
        email
      ),
      accounts (
        name,
        account_type
      )
    `)
    .eq('status', 'pending')
    .limit(1);
  
  const duration = Date.now() - startTime;
  
  if (error) {
    console.error('❌ Query FAILED:');
    console.error('Message:', error.message);
    console.error('Code:', error.code);
    console.error('Details:', error.details);
    console.error('Hint:', error.hint);
    console.error('Duration:', duration + 'ms\n');
    
    if (error.message.includes('schema cache') || error.message.includes('relationship')) {
      console.error('⚠️  This is a SCHEMA CACHE ERROR');
      console.error('The NOTIFY command was sent, but may need more time to propagate.');
      console.error('Or you may need to manually reload via Supabase Dashboard.\n');
    }
    
    process.exit(1);
  }
  
  console.log('✅ Query SUCCEEDED!');
  console.log('Duration:', duration + 'ms');
  console.log('Records found:', data?.length || 0);
  
  if (data && data.length > 0) {
    console.log('\nSample data:');
    console.log('- Order ID:', data[0].id);
    console.log('- Symbol:', data[0].symbol);
    console.log('- User:', data[0].profiles?.full_name || 'N/A');
    console.log('- Email:', data[0].profiles?.email || 'N/A');
    console.log('- Account:', data[0].accounts?.name || 'N/A');
  }
  
  console.log('\n✨ Schema cache is working correctly!\n');
  process.exit(0);
}

testQuery();
