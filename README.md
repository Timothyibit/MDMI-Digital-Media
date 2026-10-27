# MDMI Devotionals

<p align="center">
  <img src="android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png" alt="MDMI Devotionals Logo" width="112" height="112" style="border-radius: 20%;" />
</p>

<p align="center">
  <strong>Cross-platform daily devotional, scripture meditation, and prayer journaling app for The Master's Discipleship Ministries Inc. (MDMI).</strong>
</p>

<p align="center">
  <a href="https://github.com/Timothyibit/MDMI-Digital-Media/actions/workflows/build-android.yml">
    <img src="https://img.shields.io/github/actions/workflow/status/Timothyibit/MDMI-Digital-Media/build-android.yml?branch=main&label=Android%20Build&logo=android" alt="Android Build Status" />
  </a>
  <img src="https://img.shields.io/badge/Platform-Web%20%7C%20Android%20(APK%20%26%20AAB)-blue?logo=google-play" alt="Platform" />
  <img src="https://img.shields.io/badge/React-19-61dafb?logo=react" alt="React 19" />
  <img src="https://img.shields.io/badge/Capacitor-8-119EFF?logo=capacitor" alt="Capacitor 8" />
  <img src="https://img.shields.io/badge/Firebase-v12-FFCA28?logo=firebase" alt="Firebase" />
  <img src="https://img.shields.io/badge/AI%20Audio-Gemini%20TTS-8E75C4?logo=google" alt="Gemini TTS" />
</p>

---

## 📖 Overview

**MDMI Devotionals** delivers daily spiritual nourishment, guided prayers, and scripture meditations to believers worldwide. Built for both modern web browsers and native Android devices, the application combines spiritual depth with cutting-edge mobile architecture—ensuring devotions, prayer watches, and ministry broadcasts reach users even when their devices are asleep, offline, or closed.

---

## ✨ Key Features

### 📖 Scripture & Devotional Reader
- **Daily Meditations**: Full scripture passages, devotional thoughts, reflection questions, and prayer points.
- **Distraction-Free Reading Modes**: Dynamic theme switcher featuring **Light**, **Warm Sepia**, **Dark Slate**, and **Midnight Black** palettes.
- **Typography Controls**: Adjustable font scale, customizable line height, and serif/sans-serif font options.
- **Bookmarks & Favorites**: Save meaningful passages for fast recall with instant local and cloud sync.

### 🎙️ AI & Native Audio Narration
- **High-Fidelity Audio Narration**: Powered by Google Gemini 3.1 Flash TTS (`gemini-3.1-flash-tts-preview`) with natural inflection and multiple voice personas (*Kore, Fenrir, Aoede, Puck*).
- **Offline Audio Fallback**: Seamless switch to native on-device text-to-speech (`@capacitor-community/text-to-speech`) when disconnected from the internet.
- **Floating Media Player**: Background audio support with playback speed controls (0.75x–1.5x), rewind/fast-forward, and lock screen media integration.

### 🔔 Bulletproof Multi-Tier Notifications
- **Hardware AlarmManager Engine**: Utilizes `@capacitor/local-notifications` with `allowWhileIdle: true` and `RTC_WAKEUP` to guarantee daily morning alarms (07:00), Noonday prayer watches (12:00), and Midnight vigils (23:30) fire on schedule—even when the app is completely swiped away or the phone is in deep Doze mode.
- **High-Priority Remote Push (FCM v1)**: Firebase Cloud Messaging integration authenticated via a Google Service Account (`firebase-admin` / GoogleAuth) delivering immediate ministry-wide broadcast notifications to Android system trays with custom channel priority and sound.
- **In-App Notification Center**: Unread indicators, categorized ministry announcements, and custom audio chimes.

### ✍️ Prayer Hub & Spiritual Journal
- **Personal Journaling**: Write and organize reflections with date stamps, spiritual tags, and private cloud backup.
- **Prayer Tracker**: Track active prayers, mark answered prayers, and set recurring intercession reminders.
- **Reading Streaks**: Daily habit tracking with streak counters and encouragement milestones.

### 🛡️ Administration Hub
- **Content Management**: Create, edit, and schedule daily devotionals with live Markdown preview.
- **Global Broadcaster**: Broadcast immediate ministry notifications with live connected-device counts and delivery telemetry.
- **Diagnostic Panel**: Real-time push registration verification, audio cache inspection, and device health reports.

---

## 🏗️ Architecture & Tech Stack

```text
MDMI-Digital-Media/
├── android/                   # Native Android Project (Capacitor 8)
│   ├── app/src/main/
│   │   ├── java/org/mdmi/devotionals/MainActivity.java   # Native channel configuration & GoogleAuth
│   │   ├── res/                                         # Density-specific drawables & vector icons
│   │   └── AndroidManifest.xml                          # Permissions, FCM services & Alarm receivers
├── src/                       # React 19 Client
│   ├── components/            # UI components (Reader, Bento, Audio Player, Admin)
│   ├── lib/                   # Firebase Auth & Firestore client configuration
│   ├── services/              # Notification, Audio, Speech, and Sync services
│   ├── store/                 # Zustand state stores (Devotionals, Auth, Notifications, UI)
│   └── tabs/                  # Main navigation views (Today, Reader, Prayer, Admin, Settings)
├── server.ts                  # Node.js / Express backend with Vite middleware & FCM v1 dispatcher
├── capacitor.config.json      # Capacitor native platform mapping
└── .github/workflows/         # Automated Android CI/CD (assembleDebug & bundleRelease)
```

- **Frontend**: React 19, TypeScript, Tailwind CSS, Framer Motion, Lucide Icons, Radix UI.
- **State Management**: Zustand with persistent storage.
- **Native Mobile Layer**: Capacitor 8, Android SDK 34 / 35, Java 21, Gradle 8.
- **Cloud & Database**: Google Firebase Authentication, Cloud Firestore, Firebase Cloud Messaging (FCM HTTP v1).
- **Backend**: Express, Node.js 22, Google Application Default Credentials / Service Account JWT.
- **AI Integration**: `@google/genai` (Gemini 3.1 Flash TTS).

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v20 or v22+
- **npm**: v10+
- **Java Development Kit**: JDK 21 (for Android builds)
- **Android Studio / SDK**: Android SDK Build-Tools 35+, Android Platform 34+

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Timothyibit/MDMI-Digital-Media.git
   cd MDMI-Digital-Media
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the project root (see `.env.example`):
   ```env
   # Google Gemini API Key for TTS narration
   GEMINI_API_KEY="your-gemini-api-key"

   # Live hosted Cloud Run URL for native APK API routing
   APP_URL="https://your-app-domain.run.app"

   # (Optional) Firebase Service Account JSON for remote FCM dispatching
   # FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account",...}'
   ```

4. **Start the Development Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📱 Android Development & Building

### Synchronizing Web Build to Native Android
Whenever you modify web assets in `src/`:
```bash
npm run build
npx cap sync android
```

### Compiling Sideloadable APK (.apk)
```bash
cd android
./gradlew assembleDebug
```
The compiled APK will be located at:
`android/app/build/outputs/apk/debug/app-debug.apk`

### Compiling Google Play Store Bundle (.aab)
```bash
cd android
./gradlew bundleRelease
```
The production bundle will be located at:
`android/app/build/outputs/bundle/release/app-release.aab`

---

## ⚙️ Automated CI/CD (GitHub Actions)

Every push to the `main` branch automatically triggers the `.github/workflows/build-android.yml` pipeline:

1. **Checks out the repository** and provisions Node.js 22 + JDK 21.
2. **Builds the web bundle** and runs `npx cap sync android`.
3. **Injects keystore credentials** securely from GitHub Secrets.
4. **Executes Gradle assemble & bundle** tasks (`assembleDebug bundleRelease`).
5. **Uploads build artifacts directly to GitHub**:
   - `mdmi-devotionals-sideload-apk` (Debug APK for direct installation)
   - `mdmi-devotionals-playstore-aab` (Signed Release Bundle for Play Store)

To download the latest build, visit the **Actions** tab on GitHub, select the latest workflow run, and download the artifact zip.

---

## 🤝 Contributing

Contributions are welcome! If you would like to help enhance MDMI Devotionals:
1. Fork the Project.
2. Create your Feature Branch (`git checkout -b feature/NewSpiritualFeature`).
3. Commit your Changes (`git commit -m 'feat: add prayer points reminder'`).
4. Push to the Branch (`git push origin feature/NewSpiritualFeature`).
5. Open a Pull Request.

---

## 📄 License

This software and its core digital devotional content are published under the **MIT License**. Scripture quotations and ministry teachings remain the intellectual copyright of The Master's Discipleship Ministries Inc. (MDMI).

---

## 💼 Credits & Engineering

Built with devotion and precision by:

### **[T-J Tech](https://www.linkedin.com/company/t-j-tech)**
*Architecting world-class mobile, cloud, and digital media solutions.*

[![LinkedIn](https://img.shields.io/badge/LinkedIn-T--J%20Tech-0A66C2?style=for-the-badge&logo=linkedin)](https://www.linkedin.com/company/t-j-tech)
