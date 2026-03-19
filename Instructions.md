to run the project locally in ur phone:
bun expo install expo-dev-client
bunx expo run:android


to create a release apk:
npx expo prebuild --platform android
cd android
.\gradlew assembleRelease


SHA-1 certificate fingerprint:


cd android
.\gradlew signingReport

SHA-1 certificate fingerprint Debug: 5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25

SHA-1 certificate fingerprint Release: D8:10:AF:D2:41:8A:A1:DA:EB:0A:84:FE:99:5F:E7:D3:1A:48:1C:75


to create a key store:
keytool -genkeypair -v -storetype JKS -keyalg RSA -keysize 2048 -validity 10000 -storepass mohamed2003 -keypass mohamed2003 -alias mywallet -keystore android/app/release.keystore



or just move the current one:
copy release.keystore android\app\release.keystore

to get the real SHA-1:
keytool -list -v -keystore release.keystore -alias mywallet



