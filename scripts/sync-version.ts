/**
 * sync-version.ts
 *
 * Reads version and versionCode from app.json (source of truth) and syncs them
 * across all related files:
 *   - package.json
 *   - android/app/build.gradle
 *   - update-manifest.json
 *
 * Usage:
 *   bun run scripts/sync-version.ts
 *   bun run sync-version
 */

import fs from "fs";
import path from "path";

const ROOT = path.resolve(__dirname, "..");

function readJson(filePath: string): Record<string, unknown> {
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

function writeJson(filePath: string, data: Record<string, unknown>): void {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n", "utf-8");
}

// ── 1. Read source of truth from app.json ────────────────────────────────────

const appJsonPath = path.join(ROOT, "app.json");
const appJson = readJson(appJsonPath) as {
  expo: { version: string; android: { versionCode: number } };
};

const version = appJson.expo.version;
const versionCode = appJson.expo.android.versionCode;

if (!version || !versionCode) {
  console.error("Missing version or versionCode in app.json");
  process.exit(1);
}

console.log(`Source of truth (app.json): version=${version}, versionCode=${versionCode}`);

let changed = 0;

// ── 2. Sync package.json ─────────────────────────────────────────────────────

const pkgPath = path.join(ROOT, "package.json");
const pkg = readJson(pkgPath);

if (pkg.version !== version) {
  console.log(`  package.json: "${pkg.version}" -> "${version}"`);
  pkg.version = version;
  writeJson(pkgPath, pkg);
  changed++;
} else {
  console.log(`  package.json: already up to date`);
}

// ── 3. Sync android/app/build.gradle ─────────────────────────────────────────

const gradlePath = path.join(ROOT, "android", "app", "build.gradle");

if (fs.existsSync(gradlePath)) {
  let gradle = fs.readFileSync(gradlePath, "utf-8");
  let gradleChanged = false;

  const newVersionCode = gradle.replace(
    /versionCode\s+\d+/,
    `versionCode ${versionCode}`,
  );
  if (newVersionCode !== gradle) {
    gradle = newVersionCode;
    gradleChanged = true;
  }

  const newVersionName = gradle.replace(
    /versionName\s+"[^"]+"/,
    `versionName "${version}"`,
  );
  if (newVersionName !== gradle) {
    gradle = newVersionName;
    gradleChanged = true;
  }

  if (gradleChanged) {
    fs.writeFileSync(gradlePath, gradle, "utf-8");
    console.log(`  build.gradle: synced to versionCode=${versionCode}, versionName="${version}"`);
    changed++;
  } else {
    console.log(`  build.gradle: already up to date`);
  }
} else {
  console.log(`  build.gradle: not found (run "bunx expo prebuild" first)`);
}

// ── 4. Sync update-manifest.json ─────────────────────────────────────────────

const manifestPath = path.join(ROOT, "update-manifest.json");
const manifest = fs.existsSync(manifestPath)
  ? readJson(manifestPath)
  : {};

const manifestNeedsUpdate =
  manifest.versionCode !== versionCode || manifest.versionName !== version;

if (manifestNeedsUpdate) {
  manifest.versionCode = versionCode;
  manifest.versionName = version;
  manifest.publishedAt = manifest.publishedAt ?? new Date().toISOString();

  // Keep existing fields, fill defaults for missing ones
  manifest.downloadUrl =
    manifest.downloadUrl ??
    "https://github.com/mohameddn988/MyWallet/releases/latest";
  manifest.releaseNotesUrl =
    manifest.releaseNotesUrl ??
    "https://github.com/mohameddn988/MyWallet/releases";
  manifest.changelog = manifest.changelog ?? "";

  writeJson(manifestPath, manifest);
  console.log(`  update-manifest.json: synced to versionCode=${versionCode}, versionName="${version}"`);
  changed++;
} else {
  console.log(`  update-manifest.json: already up to date`);
}

// ── Done ─────────────────────────────────────────────────────────────────────

if (changed > 0) {
  console.log(`\nDone! Updated ${changed} file(s).`);
} else {
  console.log(`\nAll files already in sync.`);
}
