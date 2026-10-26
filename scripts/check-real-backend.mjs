#!/usr/bin/env node
// Staging integration guard: report blockers without modifying approved UI.
import { readFileSync } from 'node:fs';
const read = (p) => readFileSync(new URL('../' + p, import.meta.url), 'utf8');
const auth = read('src/components/AuthScreen.tsx');
const state = read('src/context/AppContext.tsx');
const checks = [
  ['simulated Google login', /const handleGoogleLogin\s*=\s*\(\)\s*=>\s*\{[\s\S]*?setTimeout\([\s\S]*?setIsLoggedIn\(true\)/.test(auth)],
  ['simulated phone OTP', /const handleVerifyOtp[\s\S]*?setTimeout\([\s\S]*?setIsLoggedIn\(true\)/.test(auth)],
  ['localStorage session gate', /toti_auth_logged_in|toti_user_v6_313/.test(state)],
  ['mock rooms', /return mockRooms/.test(state)],
  ['mock conversations', /useState<DirectConversation\[\]>\(mockConversations\)/.test(state)],
  ['mock agencies', /useState<Agency\[\]>\(mockAgencies\)/.test(state)],
];
for (const [name, blocked] of checks) console.log(`${blocked ? 'BLOCKED' : 'CLEAR'}: ${name}`);
if (checks.some(([, blocked]) => blocked)) {
  console.error('Backend integration is not ready. Do not claim production readiness.');
  process.exitCode = 1;
}
