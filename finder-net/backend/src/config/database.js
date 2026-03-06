/**
 * Database Configuration
 * Supabase connection setup and configuration
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ SUPABASE_URL and SUPABASE_SERVICE_KEY are required');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false
  }
});

const connectDB = async () => {
  try {
    // Test connection by querying
    const { error } = await supabase.from('users').select('id').limit(1);
    if (error && !error.message.includes('0 rows')) {
      throw error;
    }
    console.log('✅ Supabase Connected Successfully');
  } catch (error) {
    const msg = error.message || String(error);
    console.error('❌ Supabase Connection Failed:', msg);
    if (msg.includes('fetch failed') || msg.includes('Timeout')) {
      console.error('💡 Hint: Your Supabase project may be paused. Visit https://supabase.com/dashboard to restore it.');
    }
    process.exit(1);
  }
};

module.exports = { supabase, connectDB };
