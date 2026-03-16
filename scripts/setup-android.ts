/**
 * setup-android.ts
 *
 * Regenerates the android/ folder via `expo prebuild` and re-applies
 * all manual customizations:
 *   1. Release signing config in app/build.gradle
 *   2. APK rename (MyWallet.apk) in app/build.gradle
 *   3. Keystore credentials in gradle.properties
 *   4. colorPrimary / colorPrimaryDark in colors.xml
 *   5. colorPrimary + statusBarColor in styles.xml
 *   6. Reanimated proguard keep rules
 *   7. Copies release.keystore if it exists in project root
 *
 * Usage:
 *   bun run scripts/setup-android.ts
 *   bun run setup-android
 */

import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const ROOT = path.resolve(__dirname, "..");
const ANDROID = path.join(ROOT, "android");

// ── Helpers ──────────────────────────────────────────────────────────────────

function readFile(filePath: string): string {
  return fs.readFileSync(filePath, "utf-8");
}

function writeFile(filePath: string, content: string): void {
  fs.writeFileSync(filePath, content, "utf-8");
}

function patchFile(
  filePath: string,
  search: string | RegExp,
  replacement: string,
  label: string,
): void {
  const content = readFile(filePath);
  const updated = content.replace(search, replacement);

  if (updated === content) {
    console.log(`  [skip] ${label}: pattern not found`);
    return;
  }

  writeFile(filePath, updated);
  console.log(`  [done] ${label}`);
}

// ── 1. Run expo prebuild ─────────────────────────────────────────────────────

console.log("Running expo prebuild --platform android --clean ...\n");
execSync("bunx expo prebuild --platform android --clean --no-install", {
  cwd: ROOT,
  stdio: "inherit",
});
console.log("");

// ── 2. Patch app/build.gradle — release signing config ───────────────────────

const buildGradlePath = path.join(ANDROID, "app", "build.gradle");

// 2a. Add release signing config block after the debug signing config
patchFile(
  buildGradlePath,
  /(\s+debug \{[^}]+\})\n(\s+\})/,
  `$1\n        release {\n            storeFile file(MYWALLET_UPLOAD_STORE_FILE)\n            storePassword MYWALLET_UPLOAD_STORE_PASSWORD\n            keyAlias MYWALLET_UPLOAD_KEY_ALIAS\n            keyPassword MYWALLET_UPLOAD_KEY_PASSWORD\n        }\n$2`,
  "build.gradle: added release signing config",
);

// 2b. Use release signing config in release build type
patchFile(
  buildGradlePath,
  /release \{\n([\s\S]*?)signingConfig signingConfigs\.debug/,
  `release {\n$1signingConfig signingConfigs.release`,
  "build.gradle: set release signingConfig",
);

// 2c. Add APK rename block inside release build type
patchFile(
  buildGradlePath,
  /(crunchPngs enablePngCrunchInRelease\.toBoolean\(\))\n(\s+\})/,
  `$1\n            // Rename the APK output\n            applicationVariants.all { variant ->\n                variant.outputs.all { output ->\n                    outputFileName = "MyWallet.apk"\n                }\n            }\n$2`,
  "build.gradle: added APK rename",
);

// ── 3. Patch gradle.properties — keystore credentials ────────────────────────

const gradlePropsPath = path.join(ANDROID, "gradle.properties");
const keystoreProps = `
# Release signing config
MYWALLET_UPLOAD_STORE_FILE=release.keystore
MYWALLET_UPLOAD_KEY_ALIAS=mywallet
MYWALLET_UPLOAD_STORE_PASSWORD=mohamed2003
MYWALLET_UPLOAD_KEY_PASSWORD=mohamed2003
`;

let gradleProps = readFile(gradlePropsPath);
if (!gradleProps.includes("MYWALLET_UPLOAD_STORE_FILE")) {
  gradleProps = gradleProps.trimEnd() + "\n" + keystoreProps;
  writeFile(gradlePropsPath, gradleProps);
  console.log("  [done] gradle.properties: added keystore credentials");
} else {
  console.log("  [skip] gradle.properties: keystore credentials already present");
}

// ── 4. Patch colors.xml — add colorPrimary and colorPrimaryDark ──────────────

const colorsXmlPath = path.join(
  ANDROID, "app", "src", "main", "res", "values", "colors.xml",
);

patchFile(
  colorsXmlPath,
  "</resources>",
  `  <color name="colorPrimary">#023c69</color>\n  <color name="colorPrimaryDark">#F5F5F5</color>\n</resources>`,
  "colors.xml: added colorPrimary and colorPrimaryDark",
);

// ── 5. Patch styles.xml — add colorPrimary ref and statusBarColor ────────────

const stylesXmlPath = path.join(
  ANDROID, "app", "src", "main", "res", "values", "styles.xml",
);

patchFile(
  stylesXmlPath,
  '<item name="android:editTextBackground">@drawable/rn_edit_text_material</item>',
  '<item name="android:editTextBackground">@drawable/rn_edit_text_material</item>\n    <item name="colorPrimary">@color/colorPrimary</item>\n    <item name="android:statusBarColor">#F5F5F5</item>',
  "styles.xml: added colorPrimary and statusBarColor",
);

// ── 6. Patch proguard-rules.pro — reanimated keep rules ──────────────────────

const proguardPath = path.join(ANDROID, "app", "proguard-rules.pro");

let proguard = readFile(proguardPath);
if (!proguard.includes("reanimated")) {
  proguard = proguard.replace(
    "# Add any project specific keep options here:",
    "# react-native-reanimated\n-keep class com.swmansion.reanimated.** { *; }\n-keep class com.facebook.react.turbomodule.** { *; }\n\n# Add any project specific keep options here:",
  );
  writeFile(proguardPath, proguard);
  console.log("  [done] proguard-rules.pro: added reanimated keep rules");
} else {
  console.log("  [skip] proguard-rules.pro: reanimated rules already present");
}

// ── 7. Copy release.keystore if available ────────────────────────────────────

const keystoreSrc = path.join(ROOT, "release.keystore");
const keystoreDst = path.join(ANDROID, "app", "release.keystore");

if (fs.existsSync(keystoreSrc)) {
  fs.copyFileSync(keystoreSrc, keystoreDst);
  console.log("  [done] Copied release.keystore from project root");
} else if (fs.existsSync(keystoreDst)) {
  console.log("  [skip] release.keystore already exists in android/app/");
} else {
  console.log(
    "  [warn] release.keystore not found — place it at android/app/release.keystore before building a release",
  );
}

// ── 8. Sync version from app.json ────────────────────────────────────────────

console.log("\nSyncing version from app.json...");
execSync("bun run sync-version", { cwd: ROOT, stdio: "inherit" });

// ── Done ─────────────────────────────────────────────────────────────────────

console.log("\nAndroid setup complete! Run `bunx expo run:android` to build.");
