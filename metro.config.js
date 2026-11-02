const { getDefaultConfig } = require("expo/metro-config");
const { createHash } = require("node:crypto");

const config = getDefaultConfig(__dirname);

const PRODUCTION_API_URL = "https://api.storix.kr";
const apiUrl = process.env.EXPO_PUBLIC_API_URL ?? "";
const landingBaseUrl = process.env.EXPO_PUBLIC_LANDING_BASE_URL ?? "";
const easBuildProfile = process.env.EAS_BUILD_PROFILE ?? "";
const isLocalRelease =
  process.env.CONFIGURATION === "Release" && easBuildProfile.length === 0;
const isProductionBuild =
  easBuildProfile === "production" ||
  isLocalRelease ||
  process.env.STORIX_REQUIRE_PRODUCTION_API === "true";

if (isProductionBuild && apiUrl !== PRODUCTION_API_URL) {
  throw new Error(
    `[metro] Production build requires EXPO_PUBLIC_API_URL=${PRODUCTION_API_URL}. ` +
      `Received: ${apiUrl || "<empty>"}`,
  );
}

// Expo public environment variables are inlined while Metro transforms modules,
// but Metro's default cache key does not include their values. Without an
// environment-specific cache version, a production archive can reuse transforms
// created for the dev API. Keep dev, preview, and production caches isolated.
const environmentCacheKey = createHash("sha256")
  .update(
    JSON.stringify({
      nodeEnv: process.env.NODE_ENV ?? "",
      configuration: process.env.CONFIGURATION ?? "",
      easBuildProfile,
      apiUrl,
      landingBaseUrl,
    }),
  )
  .digest("hex")
  .slice(0, 16);

config.cacheVersion = `${config.cacheVersion}-storix-${environmentCacheKey}`;

config.resolver.blockList =
  /.*(?:node_modules[\\/]react-native-[^\\/]+[\\/]android[\\/]\.cxx|android[\\/](?:app[\\/]build|\.gradle))[\\/].*/;

module.exports = config;
