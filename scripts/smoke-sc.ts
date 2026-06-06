#!/usr/bin/env tsx

/**
 * M0 Smoke Test: Verify SoundCloud API credentials and key endpoints.
 * Usage: tsx scripts/smoke-sc.ts [soundcloud-url]
 * Default test URL: https://soundcloud.com/kaytranada
 */

const CLIENT_ID = process.env.SOUNDCLOUD_CLIENT_ID;
const CLIENT_SECRET = process.env.SOUNDCLOUD_CLIENT_SECRET;

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('Missing SOUNDCLOUD_CLIENT_ID or SOUNDCLOUD_CLIENT_SECRET in environment');
  process.exit(1);
}

const TEST_URL = process.argv[2] || 'https://soundcloud.com/kaytranada';

async function getToken(): Promise<string> {
  console.log('1. Testing client credentials flow...');
  console.log(`   Client ID: ${CLIENT_ID!.slice(0, 6)}...`);
  console.log(`   Client Secret: ${CLIENT_SECRET!.slice(0, 6)}...`);

  const endpoints = [
    'https://secure.soundcloud.com/oauth/token',
    'https://api.soundcloud.com/oauth2/token',
  ];

  for (const endpoint of endpoints) {
    console.log(`\n   Trying: ${endpoint}`);

    // Try Basic auth
    const credentials = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'accept': 'application/json; charset=utf-8',
      },
      body: 'grant_type=client_credentials',
    });

    const text = await res.text();
    console.log(`   Status: ${res.status}`);
    console.log(`   Response: ${text.slice(0, 200)}`);

    if (res.ok) {
      const data = JSON.parse(text);
      console.log(`\n   OK — token expires in ${data.expires_in}s\n`);
      return data.access_token;
    }
  }

  throw new Error('All auth endpoints failed — see output above');
}

async function resolve(token: string, url: string) {
  console.log(`2. Testing GET /resolve?url=${url}`);
  const res = await fetch(
    `https://api.soundcloud.com/resolve?url=${encodeURIComponent(url)}`,
    { headers: { 'Authorization': `Bearer ${token}` } },
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Resolve failed (${res.status}): ${body}`);
  }

  const data = await res.json();
  console.log(`   OK — resolved to ${data.kind}: ${data.username || data.title} (id: ${data.id})`);
  console.log(`   Followers: ${data.followers_count}, Tracks: ${data.track_count}\n`);
  return data;
}

async function getTracks(token: string, userId: number) {
  console.log(`3. Testing GET /users/${userId}/tracks?limit=5`);
  const res = await fetch(
    `https://api.soundcloud.com/users/${userId}/tracks?limit=5`,
    { headers: { 'Authorization': `Bearer ${token}` } },
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Tracks failed (${res.status}): ${body}`);
  }

  const tracks = await res.json();
  console.log(`   OK — got ${tracks.length} tracks:\n`);

  for (const t of tracks) {
    console.log(`   - "${t.title}" — ${t.playback_count?.toLocaleString() ?? '?'} plays, ${t.likes_count?.toLocaleString() ?? '?'} likes`);
  }
  console.log();
}

async function main() {
  try {
    const token = await getToken();
    const user = await resolve(token, TEST_URL);
    if (user.kind === 'user') {
      await getTracks(token, user.id);
    }
    console.log('All M0 smoke tests passed.');
  } catch (err) {
    console.error(`FAILED: ${err}`);
    process.exit(1);
  }
}

main();
