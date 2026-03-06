/**
 * Development Server
 * Use this for local development with Supabase
 * Set SUPABASE_URL and SUPABASE_SERVICE_KEY in .env
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing required environment variables:');
  console.error('   SUPABASE_URL - Your Supabase project URL');
  console.error('   SUPABASE_SERVICE_KEY - Your Supabase service role key');
  console.error('');
  console.error('Create a .env file with these values from your Supabase dashboard.');
  process.exit(1);
}

// Set development environment
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

// Start the main server
require('./server');
