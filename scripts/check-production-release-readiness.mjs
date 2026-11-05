#!/usr/bin/env node
// Read-only production release gate. Never prints secret values.
import { readFileSync, existsSync } from 'node:fs';
const errors = [];
const warnings = [];
const staging = JSON.parse(readFileSync('capacitor.config.json', 'utf8'));
const desired = process.env.TOTICHAT_PRODUCTION_APP_ID || 'com.totichat.app';
if (!/^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*){2,}$/.test(desired)) errors.push('Invalid production application ID');
if (desired === staging.appId) errors.push('Production application ID must differ from staging');
if (!existsSync('.github/workflows/staging-verify.yml')) errors.push('Missing known-good staging build workflow');
if (!existsSync('scripts/configure-android-oauth.mjs')) errors.push('Missing Android OAuth callback configurator');
for (const name of ['TOTICHAT_RELEASE_KEYSTORE_BASE64','TOTICHAT_RELEASE_STORE_PASSWORD','TOTICHAT_RELEASE_KEY_ALIAS','TOTICHAT_RELEASE_KEY_PASSWORD']) {
  if (!process.env[name]) errors.push(name + ' is not configured');
}
if (!process.env.TOTICHAT_PRODUCTION_OAUTH_REDIRECT_CONFIRMED) errors.push('Production Google OAuth redirect not confirmed');
if (!process.env.TOTICHAT_PLAY_SIGNING_COMPATIBILITY_CONFIRMED) errors.push('Website and Play APK signing compatibility not confirmed');
if (!process.env.TOTICHAT_RELEASE_APPROVED) errors.push('Release not explicitly approved');
warnings.push('A successful gate does not certify Play Protect acceptance or app safety.');
console.log('Staging application ID:', staging.appId);
console.log('Proposed production application ID:', desired);
for (const issue of errors) console.error('BLOCKED:', issue);
for (const note of warnings) console.log('NOTE:', note);
if (errors.length) { console.error('Production release blocked:', errors.length, 'requirements incomplete.'); process.exitCode = 1; }
else console.log('Configuration checklist satisfied. Actual signed artifact validation is still required.');
