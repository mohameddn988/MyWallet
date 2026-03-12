to run the project locally in ur phone:
bun expo install expo-dev-client
bunx expo run:android


to create a release apk:
npx expo prebuild --platform android
cd android
.\gradlew assembleRelease

B) Android client

Type: Android
Package name: com.anonymous.mywallet
SHA-1 fingerprint → run in your project terminal:
Copy the SHA-1 from Variant: debug → Config: debug
Save → copy the Client ID


Alternative: Keep using ./gradlew (if you want fully local)
This requires you to first deploy the server manually:

Export and deploy to Vercel or Railway:
bunx expo export --platform web

Then deploy that /dist folder

Set the deployed URL in .env:
EXPO_PUBLIC_API_URL=https://your-deployment.vercel.app


Then build locally (debug APK for sharing, no keystore needed):
cd android
./gradlew assembleRelease


SHA-1 certificate fingerprint:
cd android
.\gradlew signingReport

SHA-1 certificate fingerprint Debug: 5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25

SHA-1 certificate fingerprint Release: D8:10:AF:D2:41:8A:A1:DA:EB:0A:84:FE:99:5F:E7:D3:1A:48:1C:75




---

## Changing App Version & Information

App metadata is managed across 3 files:

### 1. app.json (Expo config)
| Field | Purpose | Example |
|-------|---------|---------|
| `name` | Display name in app store | `"MyWallet"` |
| `version` | App version (Expo) | `"1.0.1"` |
| `icon` | App icon path (1024x1024 PNG) | `"./assets/images/Logo.png"` |
| `bundleIdentifier` (iOS) | Unique App Store ID | `"com.yourcompany.mywallet"` |
| `package` (Android) | Unique Google Play ID | `"com.yourcompany.mywallet"` |

### 2. android/app/build.gradle (Android-specific)
| Field | Purpose | Notes |
|-------|---------|-------|
| `versionCode` | Internal version number | **Must increment by 1 for each release** |
| `versionName` | User-facing version | Must match `app.json` |
| `applicationId` | Package name | Must match `app.json` |
| `namespace` | Same as `applicationId` | Keep in sync |

### 3. package.json
Keep the `version` field synced with `app.json`.

---

## Example: Update Version from 1.0.0 → 1.1.0

**Step 1:** Update `app.json`
```json
"version": "1.1.0",
```

**Step 2:** Update `android/app/build.gradle`
```gradle
versionCode 2        // increment by 1
versionName "1.1.0"
```

**Step 3:** Update `package.json`
```json
"version": "1.1.0",
```

**Step 4:** Rebuild
```bash
npx expo prebuild --platform android --clean
cd android
.\gradlew assembleRelease
```

---

## Key Rules

⚠️ **versionCode must always increase** — once you publish versionCode 2, you can never publish versionCode 2 again.

✅ Keep all three files (`app.json`, `android/app/build.gradle`, `package.json`) in sync.

✅ After rebuilding, the APK version will update automatically.

---

## Changing Package Name (com.anonymous.mywallet → com.yourcompany.mywallet)

1. Update `app.json`:
   ```json
   "bundleIdentifier": "com.yourcompany.mywallet",  // iOS
   "android": {
     "package": "com.yourcompany.mywallet"          // Android
   }
   ```

2. Update `android/app/build.gradle`:
   ```gradle
   namespace 'com.yourcompany.mywallet'
   applicationId 'com.yourcompany.mywallet'
   ```

3. Regenerate config:
   ```bash
   npx expo prebuild --platform android --clean
   ```

4. Get new SHA-1 fingerprint for Google OAuth:
   ```bash
   cd android
   ./gradlew signingReport
   ```

5. Update Google Cloud Console with the new SHA-1.
