const fs = require('fs');
const jwt = require('jsonwebtoken');

// Your Apple credentials
const TEAM_ID = '25HXFQ6T89';
const KEY_ID = 'JHX97XLPRV';
const CLIENT_ID = 'com.realtor.aistaging'; // Your Services ID
const PRIVATE_KEY_PATH = './AuthKey_JHX97XLPRV.p8';

// Read the private key
const privateKey = fs.readFileSync(PRIVATE_KEY_PATH, 'utf8');

// Current timestamp (in seconds)
const now = Math.floor(Date.now() / 1000);

// Apple requires max 6 months = 15777000 seconds
// Using 179 days to be safe
const expirationTime = now + (179 * 24 * 60 * 60);

// Generate JWT with explicit claims per Apple's spec
const payload = {
  iss: TEAM_ID,           // Issuer: Your Team ID
  iat: now,               // Issued at: Current timestamp
  exp: expirationTime,    // Expiration: 179 days from now
  aud: 'https://appleid.apple.com', // Audience: Apple's auth server
  sub: CLIENT_ID          // Subject: Your Services ID (Client ID)
};

const token = jwt.sign(
  payload,
  privateKey,
  {
    algorithm: 'ES256',
    header: {
      alg: 'ES256',
      kid: KEY_ID         // Key ID in header
    }
  }
);

console.log('\n✅ Apple Client Secret (JWT) Generated Successfully!\n');
console.log('📋 Copy this token and paste into Supabase "Secret Key" field:\n');
console.log(token);
console.log('\n📅 Token Details:');
console.log(`   • Issued at: ${new Date(now * 1000).toISOString()}`);
console.log(`   • Expires at: ${new Date(expirationTime * 1000).toISOString()}`);
console.log(`   • Valid for: 179 days`);
console.log(`\n⚠️  Set a reminder to regenerate this token in ~5.5 months!\n`);
