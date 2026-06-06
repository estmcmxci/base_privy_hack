#!/usr/bin/env tsx

const REQUIRED_VARS = [
    { key: 'SOUNDCLOUD_CLIENT_ID',         description: 'SoundCloud API client ID' },
    { key: 'SOUNDCLOUD_CLIENT_SECRET',      description: 'SoundCloud API client secret' },
    { key: 'DATABASE_URL',                  description: 'Supabase Postgres connection string' },
    { key: 'NEXT_PUBLIC_SUPABASE_URL',      description: 'Supabase project URL' },
    { key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', description: 'Supabase anon key' },
    { key: 'SUPABASE_SERVICE_ROLE_KEY',     description: 'Supabase service role key (server only)' },
    { key: 'NEXT_PUBLIC_APP_URL',           description: 'App base URL' },
    { key: 'CRON_SECRET',                   description: 'Secret for authenticating Vercel Cron requests' },
  ];
  
  const OPTIONAL_VARS = [
    { key: 'NEXT_PUBLIC_PRIVY_APP_ID',     description: 'Privy app ID (required for M7)' },
    { key: 'NEXT_PUBLIC_PRIVY_CLIENT_ID',  description: 'Privy client ID (required for M7)' },
    { key: 'PRIVY_APP_SECRET',             description: 'Privy app secret, server only (required for M7)' },
    { key: 'EAS_CONTRACT_ADDRESS',      description: 'EAS contract address (required for M6)' },
    { key: 'EAS_SCHEMA_UID_PREDICTION', description: 'EAS prediction schema UID (required for M6)' },
    { key: 'EAS_SCHEMA_UID_REPUTATION', description: 'EAS reputation schema UID (required for M6)' },
  ];
  
  let hasErrors = false;
  console.log('\n✓ Checking environment variables...\n');
  
  for (const { key, description } of REQUIRED_VARS) {
    if (!process.env[key]) {
      console.error(`  ✗ MISSING: ${key} — ${description}`);
      hasErrors = true;
    } else {
      console.log(`  ✓ ${key}`);
    }
  }
  
  console.log('\n⚠ Optional (needed for later milestones):\n');
  for (const { key, description } of OPTIONAL_VARS) {
    if (!process.env[key]) {
      console.log(`  - ${key} — ${description}`);
    } else {
      console.log(`  ✓ ${key}`);
    }
  }
  
  if (hasErrors) {
    console.error('\n✗ Missing required env vars. Copy .env.local.example to .env.local and fill in values.\n');
    process.exit(1);
  } else {
    console.log('\n✓ All required env vars present.\n');
  }



