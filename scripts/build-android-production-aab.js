const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const rootDir = path.join(__dirname, "..");
const androidDir = path.join(rootDir, "android");
const appJsonPath = path.join(rootDir, "app.json");
const envLocalPath = path.join(rootDir, ".env.local");
const gradleCommand = process.platform === "win32" ? "gradlew.bat" : "./gradlew";
const productionApiUrl = "https://api.storix.kr";
const productionLandingBaseUrl = "https://storix.kr";
const productionAabPath = path.join(
  androidDir,
  "app",
  "build",
  "outputs",
  "bundle",
  "release",
  "app-release.aab",
);
const staleReleaseBundlePaths = [
  path.join(androidDir, "app", "build", "generated", "assets", "createBundleReleaseJsAndAssets"),
  path.join(androidDir, "app", "build", "generated", "res", "createBundleReleaseJsAndAssets"),
  path.join(androidDir, "app", "build", "intermediates", "assets", "release"),
  productionAabPath,
];

const env = {
  ...process.env,
  NODE_ENV: "production",
  EAS_BUILD_PROFILE: "production",
  STORIX_REQUIRE_PRODUCTION_API: "true",
  EXPO_PUBLIC_API_URL: productionApiUrl,
  EXPO_PUBLIC_LANDING_BASE_URL: productionLandingBaseUrl,
};

const formatBytes = (bytes) => {
  if (!Number.isFinite(bytes)) return "unknown";
  const mb = bytes / 1024 / 1024;
  return `${mb.toFixed(1)} MB`;
};

const readAppJson = () => JSON.parse(fs.readFileSync(appJsonPath, "utf8"));

const incrementAndroidVersionCode = () => {
  const appJson = readAppJson();
  const currentVersionCode = Number(appJson.expo?.android?.versionCode);

  if (!Number.isInteger(currentVersionCode) || currentVersionCode < 1) {
    throw new Error(
      `[build:android:aab] Invalid expo.android.versionCode: ${appJson.expo?.android?.versionCode}`,
    );
  }

  const nextVersionCode = currentVersionCode + 1;
  appJson.expo.android.versionCode = nextVersionCode;
  fs.writeFileSync(appJsonPath, `${JSON.stringify(appJson, null, 2)}\n`);

  return {
    appVersion: appJson.expo?.version ?? "unknown",
    previousVersionCode: currentVersionCode,
    nextVersionCode,
  };
};

const printBuildSummary = (versionInfo) => {
  console.log("\n========================================");
  console.log("STORIX Android Production AAB Build");
  console.log("========================================");
  console.log(`API server       : ${env.EXPO_PUBLIC_API_URL}`);
  console.log(`Landing          : ${env.EXPO_PUBLIC_LANDING_BASE_URL}`);
  console.log(`NODE_ENV         : ${env.NODE_ENV}`);
  console.log(`EAS profile      : ${env.EAS_BUILD_PROFILE}`);
  console.log(`App version      : ${versionInfo.appVersion}`);
  console.log(
    `Android code     : ${versionInfo.previousVersionCode} -> ${versionInfo.nextVersionCode}`,
  );
  console.log(`AAB output       : ${productionAabPath}`);
  console.log("========================================\n");
};

const printAabResult = () => {
  if (!fs.existsSync(productionAabPath)) {
    console.warn("\nAAB output was not found:");
    console.warn(productionAabPath);
    return;
  }

  const stats = fs.statSync(productionAabPath);
  console.log("\n========================================");
  console.log("Production AAB created");
  console.log("========================================");
  console.log(`API server : ${env.EXPO_PUBLIC_API_URL}`);
  console.log(`Landing    : ${env.EXPO_PUBLIC_LANDING_BASE_URL}`);
  console.log(`File       : ${productionAabPath}`);
  console.log(`Size       : ${formatBytes(stats.size)}`);
  console.log("========================================\n");
};

const run = (command, args, options = {}) =>
  spawnSync(command, args, {
    cwd: options.cwd ?? rootDir,
    env,
    shell: process.platform === "win32",
    stdio: "inherit",
  });

const runOrExit = (command, args, options = {}) => {
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

const removeStaleReleaseBundleArtifacts = () => {
  for (const artifactPath of staleReleaseBundlePaths) {
    fs.rmSync(artifactPath, { force: true, recursive: true });
  }
};

const withTemporaryProductionEnvLocal = (callback) => {
  const originalEnvLocal = fs.existsSync(envLocalPath)
    ? fs.readFileSync(envLocalPath, "utf8")
    : null;
  const currentEnvLocal = originalEnvLocal ?? "";
  let nextEnvLocal = /^EXPO_PUBLIC_API_URL=/m.test(currentEnvLocal)
    ? currentEnvLocal.replace(
        /^EXPO_PUBLIC_API_URL=.*$/m,
        `EXPO_PUBLIC_API_URL=${productionApiUrl}`,
      )
    : `${currentEnvLocal}${currentEnvLocal.endsWith("\n") || currentEnvLocal.length === 0 ? "" : "\n"}EXPO_PUBLIC_API_URL=${productionApiUrl}\n`;

  nextEnvLocal = /^EXPO_PUBLIC_LANDING_BASE_URL=/m.test(nextEnvLocal)
    ? nextEnvLocal.replace(
        /^EXPO_PUBLIC_LANDING_BASE_URL=.*$/m,
        `EXPO_PUBLIC_LANDING_BASE_URL=${productionLandingBaseUrl}`,
      )
    : `${nextEnvLocal}${nextEnvLocal.endsWith("\n") || nextEnvLocal.length === 0 ? "" : "\n"}EXPO_PUBLIC_LANDING_BASE_URL=${productionLandingBaseUrl}\n`;

  if (nextEnvLocal !== currentEnvLocal) {
    fs.writeFileSync(envLocalPath, nextEnvLocal);
  }

  try {
    callback();
  } finally {
    if (originalEnvLocal == null) {
      fs.rmSync(envLocalPath, { force: true });
    } else if (fs.readFileSync(envLocalPath, "utf8") !== originalEnvLocal) {
      fs.writeFileSync(envLocalPath, originalEnvLocal);
    }
  }
};

withTemporaryProductionEnvLocal(() => {
  const versionInfo = incrementAndroidVersionCode();
  printBuildSummary(versionInfo);
  runOrExit("npm", ["run", "prebuild:android"]);
  removeStaleReleaseBundleArtifacts();
  runOrExit(gradleCommand, [":app:createBundleReleaseJsAndAssets", "--rerun-tasks"], { cwd: androidDir });
  runOrExit(gradleCommand, ["bundleRelease"], { cwd: androidDir });

  const verification = run("npm", ["run", "verify:android:aab"]);
  if (verification.status !== 0) {
    fs.rmSync(productionAabPath, { force: true });
    console.error("\nProduction AAB verification failed. Deleted invalid AAB:");
    console.error(productionAabPath);
    process.exit(verification.status ?? 1);
  }

  printAabResult();
});
