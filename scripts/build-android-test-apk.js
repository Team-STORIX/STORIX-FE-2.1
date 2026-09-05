const { spawnSync } = require("child_process");
const path = require("path");

const developmentApiUrl = "https://dev.storix.kr";
const defaultLandingBaseUrl = "https://www-dev.storix.kr";
const landingBaseUrl =
  (process.env.EXPO_PUBLIC_TEST_LANDING_BASE_URL ||
    defaultLandingBaseUrl).replace(/\/+$/, "");
const rootDir = path.resolve(__dirname, "..");
const apkPath = path.join(
  rootDir,
  "android",
  "app",
  "build",
  "outputs",
  "apk",
  "release",
  "app-release.apk",
);

const env = {
  ...process.env,
  NODE_ENV: "production",
  EAS_BUILD_PROFILE: "preview",
  EXPO_PUBLIC_API_URL: developmentApiUrl,
  EXPO_PUBLIC_LANDING_BASE_URL: landingBaseUrl,
};

if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(landingBaseUrl)) {
  console.error("[android:test] Invalid landing URL for Firebase APK.");
  console.error(`[android:test] EXPO_PUBLIC_LANDING_BASE_URL=${landingBaseUrl}`);
  console.error(
    "[android:test] Use a phone-accessible URL, for example a deployed Vercel URL or http://<PC_LAN_IP>:5173.",
  );
  process.exit(1);
}

function runOrExit(command, args) {
  const result = spawnSync(command, args, {
    cwd: rootDir,
    env,
    shell: process.platform === "win32",
    stdio: "inherit",
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

console.log("\n[android:test] Building release APK for Firebase QA");
console.log(`[android:test] API server : ${developmentApiUrl}`);
console.log(`[android:test] Landing    : ${landingBaseUrl}`);
console.log(`[android:test] Output     : ${apkPath}\n`);

runOrExit("npm", ["run", "prebuild:android"]);
runOrExit(".\\android\\gradlew.bat", ["-p", "android", ":app:assembleRelease"]);

console.log("\n[android:test] Done");
console.log(`[android:test] API server : ${developmentApiUrl}`);
console.log(`[android:test] Landing    : ${landingBaseUrl}`);
console.log(`[android:test] File       : ${apkPath}\n`);
