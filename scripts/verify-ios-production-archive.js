const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const ARCHIVES_ROOT = path.join(
  os.homedir(),
  "Library",
  "Developer",
  "Xcode",
  "Archives",
);
const PRODUCTION_API_URL = "https://api.storix.kr";
const DEVELOPMENT_API_URL = "https://dev.storix.kr";

function findArchives(directory, depth = 0) {
  if (!fs.existsSync(directory) || depth > 2) return [];

  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (!entry.isDirectory()) return [];

    const entryPath = path.join(directory, entry.name);
    if (entry.name.endsWith(".xcarchive")) return [entryPath];

    return findArchives(entryPath, depth + 1);
  });
}

function findMainBundle(archivePath) {
  const applicationsPath = path.join(
    archivePath,
    "Products",
    "Applications",
  );

  if (!fs.existsSync(applicationsPath)) return null;

  const appName = fs
    .readdirSync(applicationsPath)
    .find((entry) => entry.endsWith(".app"));

  return appName
    ? path.join(applicationsPath, appName, "main.jsbundle")
    : null;
}

const requestedArchive = process.argv[2]
  ? path.resolve(process.argv[2])
  : null;
const archivePath =
  requestedArchive ??
  findArchives(ARCHIVES_ROOT).sort(
    (left, right) => fs.statSync(right).mtimeMs - fs.statSync(left).mtimeMs,
  )[0];

if (!archivePath) {
  throw new Error("No Xcode archive was found.");
}

const bundlePath = findMainBundle(archivePath);
if (!bundlePath || !fs.existsSync(bundlePath)) {
  throw new Error(`main.jsbundle was not found in ${archivePath}`);
}

const bundle = fs.readFileSync(bundlePath);
const containsProductionApi = bundle.includes(Buffer.from(PRODUCTION_API_URL));
const containsDevelopmentApi = bundle.includes(Buffer.from(DEVELOPMENT_API_URL));

console.log(`Archive: ${archivePath}`);
console.log(`Production API: ${containsProductionApi ? "found" : "missing"}`);
console.log(`Development API: ${containsDevelopmentApi ? "found" : "not found"}`);

if (!containsProductionApi || containsDevelopmentApi) {
  throw new Error(
    "Archive API verification failed. Do not upload this build to App Store Connect.",
  );
}

console.log("Archive API verification passed.");
