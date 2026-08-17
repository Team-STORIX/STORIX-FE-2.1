const { spawnSync } = require("child_process");

const developmentApiUrl = "https://dev.storix.kr";

const env = {
  ...process.env,
  NODE_ENV: "development",
  EXPO_PUBLIC_API_URL: developmentApiUrl,
};

const runOrExit = (command, args) => {
  const result = spawnSync(command, args, {
    env,
    shell: process.platform === "win32",
    stdio: "inherit",
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
};

console.log(`[android:dev] EXPO_PUBLIC_API_URL=${developmentApiUrl}`);
runOrExit("npm", ["run", "prebuild:android"]);
runOrExit("npx", ["expo", "run:android"]);
