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
if (!xml.includes('com.numyar.totichat.staging')) {
  const activity = /(<activity\b(?=[^>]*android:name="\.MainActivity")[^>]*>)/;
  if (!activity.test(xml)) throw new Error('Capacitor MainActivity not found in manifest');
  writeFileSync(file, xml.replace(activity, '$1\n' + filter));
}
