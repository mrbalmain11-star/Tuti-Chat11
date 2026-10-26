# Toti Chat - Android Native Project (Kotlin & Jetpack Compose)

مشروع تطبيق أندرويد حقيقي وأصلي بالكامل (Native Android Application) لتطبيق **توتي شات (Toti Chat)** مبني باستخدام أحدث التقنيات الرسمية:
- **Language**: Kotlin 2.0+
- **UI Toolkit**: Jetpack Compose + Material 3
- **Architecture**: MVVM + StateFlow + Kotlin Coroutines
- **Package Name**: `com.totichat.app`
- **Application Name**: Toti Chat (توتي شات)
- **Min SDK**: 24 (Android 7.0+)
- **Target SDK / Compile SDK**: 35 (Android 15 - أحدث معايير Google Play)

---

## 📁 هيكلية المشروع (Project Architecture):

```text
android/
├── app/
│   ├── build.gradle.kts           # إعدادات التطبيق والتبعيات
│   ├── proguard-rules.pro
│   └── src/
│       └── main/
│           ├── AndroidManifest.xml # أذونات الصوت، الشبكة، الكاميرا وإعدادات التطبيق
│           ├── java/com/totichat/app/
│           │   ├── MainActivity.kt        # نقطة البداية وتشغيل الواجهات
│           │   ├── TotiApplication.kt     # فئة التطبيق العامة
│           │   ├── TotiChatApp.kt         # شجرة التنقل وNavigation Host
│           │   ├── data/
│           │   │   ├── model/Models.kt    # نماذج الغرف، المستخدم، الهدايا، الرسائل
│           │   │   └── repository/TotiRepository.kt # إدارة الحالة والبيانات
│           │   └── ui/
│           │       ├── theme/             # ألوان وخطوط توتي شات الملكية
│           │       ├── components/        # عناصر الواجهة (Header, Seats, Badges, Cards)
│           │       ├── navigation/        # شاشات ومسارات التنقل
│           │       └── screens/           # الشاشات الرئيسية:
│           │           ├── HomeScreen.kt       # قائمة الغرف الصوتية والتصنيفات
│           │           ├── VoiceRoomScreen.kt  # الغرفة الصوتية مع المايكات والهدايا
│           │           ├── MessagesScreen.kt   # المحادثات والرسائل
│           │           └── ProfileScreen.kt    # الملف الشخصي مع المستويات والأوسمة
│           └── res/
│               ├── drawable/              # أيقونات المتجه وخلفيات الأيقونة
│               ├── mipmap-anydpi-v26/     # أيقونة التثبيت التكيفية (Adaptive Launcher Icon)
│               └── values/                # النصوص، الألوان، والثيمات
├── gradle/
│   ├── libs.versions.toml         # Version Catalog المعتمد
│   └── wrapper/
├── build.gradle.kts
├── settings.gradle.kts
├── gradlew & gradlew.bat
└── README.md
```

---

## 🛠️ كيفية فتح وبناء المشروع في Android Studio:

### 1. الفتح في Android Studio:
1. افتح برنامج **Android Studio** (أي إصدار حديث مثل Ladybug أو Koala أو Jellyfish أو Hedgehog).
2. اختر **Open** أو **File -> Open**.
3. حدد مجلد `android` من هذا المشروع.
4. انتظر حتى ينتهي Gradle من المزامنة (Gradle Sync) تلقائياً.

---

## 📦 أوامر بناء APK و AAB:

### بناء حزمة APK تجريبية للتثبيت الفوري (Debug APK):
```bash
./gradlew assembleDebug
```
الملف الناتج:
```text
app/build/outputs/apk/debug/app-debug.apk
```
يمكنك نقله وتثبيته مباشرة على أي هاتف أندرويد.

---

### بناء حزمة APK للإنتاج (Release APK):
```bash
./gradlew assembleRelease
```
الملف الناتج:
```text
app/build/outputs/apk/release/app-release.apk
```

---

### بناء حزمة AAB للنشر على متجر Google Play (Android App Bundle):
```bash
./gradlew bundleRelease
```
الملف الناتج:
```text
app/build/outputs/bundle/release/app-release.aab
```
هذا هو الملف الرسمي الجاهز للرفع على **Google Play Console** لتوزيع التطبيق لجميع المستخدمين حول العالم.
