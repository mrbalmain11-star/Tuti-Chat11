import { readFileSync, writeFileSync } from 'node:fs';

const file = 'android/app/src/main/AndroidManifest.xml';
const xml = readFileSync(file, 'utf8');
const filter = `        <intent-filter>
            <action android:name="android.intent.action.VIEW" />
            <category android:name="android.intent.category.DEFAULT" />
            <category android:name="android.intent.category.BROWSABLE" />
            <data android:scheme="com.numyar.totichat.staging"
                  android:host="auth" android:path="/callback" />
        </intent-filter>`;
// Firebase Messaging adds the app package to the manifest before this step.
// Check for the actual OAuth intent filter, not the package name anywhere in XML.
if (!xml.includes('android:scheme="com.numyar.totichat.staging"')) {
  const activity = /(<activity\b(?=[^>]*android:name="\.MainActivity")[^>]*>)/;
  if (!activity.test(xml)) throw new Error('Capacitor MainActivity not found in manifest');
  writeFileSync(file, xml.replace(activity, '$1\n' + filter));
}

const result = readFileSync(file, 'utf8');
if (!result.includes('android:scheme="com.numyar.totichat.staging"') ||
    !result.includes('android:host="auth" android:path="/callback"')) {
  throw new Error('Native Google OAuth callback intent filter missing from Android manifest');
}
console.log('Native Google OAuth callback intent filter verified');
