const { spawnSync } = require("child_process");
const path = require("path");

const rootDir = path.join(__dirname, "..");
const androidDir = path.join(rootDir, "android");
const gradleCommand = process.platform === "win32" ? "gradlew.bat" : "./gradlew";

const env = {
  ...process.env,
  NODE_ENV: "production",
  EAS_BUILD_PROFILE: "production",
  STORIX_REQUIRE_PRODUCTION_API: "true",
  EXPO_PUBLIC_API_URL: "https://api.storix.kr",
};

const run = (command, args, options = {}) => {
  const result = spawnSync(command, args, {
    cwd: options.cwd ?? rootDir,
    env,
    shell: process.platform === "win32",
    stdio: "inherit",
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
};

run("npm", ["run", "prebuild:android"]);
run(gradleCommand, ["bundleRelease"], { cwd: androidDir });
run("npm", ["run", "verify:android:aab"]);
