#!/usr/bin/env python3
"""Wire staged Firebase Messaging into the disposable Capacitor Android project.

Run only after 'npx cap sync android'. This does not touch APK packaging,
audio engine, or the checked-in Kotlin demo app.
"""
from pathlib import Path
import shutil
import json

root = Path("android")
app = root / "app"
main = app / "src/main/java/com/numyar/totichat/staging/MainActivity.java"
manifest = app / "src/main/AndroidManifest.xml"
project_gradle = root / "build.gradle"
app_gradle = app / "build.gradle"
source = Path("staging/native-push")
assert main.is_file() and manifest.is_file()
assert project_gradle.is_file() and app_gradle.is_file()
config = app / "google-services.json"
assert config.is_file(), "Matching Firebase config must be restored first"
firebase = json.loads(config.read_text())
assert firebase["project_info"]["project_id"] == "totichatpro", "Unexpected Firebase project"
assert any(
    client["client_info"]["android_client_info"]["package_name"] == "com.numyar.totichat.staging"
    for client in firebase["client"]
), "Missing exact staging Android package in Firebase config"

for name in ("TotiPushPlugin.java", "TotiPushMessagingService.java"):
    shutil.copyfile(source / name, main.parent / name)

text = main.read_text()
anchor = "super.onCreate(state);"
assert anchor in text, "MainActivity changed; refusing unsafe patch"
assert "registerPlugin(TotiPushPlugin.class);" not in text
text = text.replace(anchor, "registerPlugin(TotiPushPlugin.class);\n                  " + anchor, 1)
main.write_text(text)

text = manifest.read_text()
assert "</application>" in text
assert 'android:name="com.numyar.totichat.staging.TotiPushMessagingService"' not in text
text = text.replace("</application>", """    <service
            android:name="com.numyar.totichat.staging.TotiPushMessagingService"
            android:exported="false">
            <intent-filter>
                <action android:name="com.google.firebase.MESSAGING_EVENT" />
            </intent-filter>
        </service>
    </application>""", 1)
if 'android.permission.POST_NOTIFICATIONS' not in text:
    text = text.replace("<application", '<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />\n    <application', 1)
manifest.write_text(text)

text = project_gradle.read_text()
anchor = "dependencies {"
assert anchor in text, "Unexpected root Gradle format"
assert "com.google.gms:google-services" not in text
text = text.replace(anchor, anchor + "\n        classpath 'com.google.gms:google-services:4.4.2'", 1)
project_gradle.write_text(text)

text = app_gradle.read_text()
assert "dependencies {" in text, "Unexpected app Gradle format"
assert "com.android.application" in text, "Unexpected generated Android app Gradle configuration"
assert "com.google.firebase:firebase-messaging" not in text
text = text.replace("dependencies {", "dependencies {\n    implementation 'com.google.firebase:firebase-messaging:24.1.2'", 1)
text += "\napply plugin: 'com.google.gms.google-services'\n"
app_gradle.write_text(text)
print("Capacitor staging Firebase Messaging native integration prepared")
