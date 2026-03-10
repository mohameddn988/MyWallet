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
