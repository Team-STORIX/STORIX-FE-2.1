const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const PRODUCTION_API_URL = "https://api.storix.kr";
const DEVELOPMENT_API_URL = "https://dev.storix.kr";

const findLatestAab = () => {
  const bundleDir = path.join(
    __dirname,
    "..",
    "android",
    "app",
    "build",
    "outputs",
    "bundle",
    "release",
  );

  if (!fs.existsSync(bundleDir)) {
    return null;
  }

  const files = fs
    .readdirSync(bundleDir)
    .filter((file) => file.endsWith(".aab"))
    .map((file) => {
      const filePath = path.join(bundleDir, file);
      return {
        filePath,
        mtimeMs: fs.statSync(filePath).mtimeMs,
      };
    })
    .sort((a, b) => b.mtimeMs - a.mtimeMs);

  return files[0]?.filePath ?? null;
};

const readUInt16 = (buffer, offset) => buffer.readUInt16LE(offset);
const readUInt32 = (buffer, offset) => buffer.readUInt32LE(offset);

const findEndOfCentralDirectory = (buffer) => {
  const signature = 0x06054b50;
  const minOffset = Math.max(0, buffer.length - 65557);

  for (let offset = buffer.length - 22; offset >= minOffset; offset -= 1) {
    if (readUInt32(buffer, offset) === signature) {
      return offset;
    }
  }

  throw new Error("Invalid AAB: could not find ZIP central directory.");
};

const listZipEntries = (buffer) => {
  const eocdOffset = findEndOfCentralDirectory(buffer);
  const entryCount = readUInt16(buffer, eocdOffset + 10);
  const centralDirectoryOffset = readUInt32(buffer, eocdOffset + 16);
  const entries = [];
  let offset = centralDirectoryOffset;

  for (let index = 0; index < entryCount; index += 1) {
    if (readUInt32(buffer, offset) !== 0x02014b50) {
      throw new Error("Invalid AAB: malformed ZIP central directory entry.");
    }

    const compressionMethod = readUInt16(buffer, offset + 10);
    const compressedSize = readUInt32(buffer, offset + 20);
    const fileNameLength = readUInt16(buffer, offset + 28);
    const extraFieldLength = readUInt16(buffer, offset + 30);
    const fileCommentLength = readUInt16(buffer, offset + 32);
    const localHeaderOffset = readUInt32(buffer, offset + 42);
    const fileName = buffer
      .slice(offset + 46, offset + 46 + fileNameLength)
      .toString("utf8");

    entries.push({
      compressionMethod,
      compressedSize,
      fileName,
      localHeaderOffset,
    });

    offset += 46 + fileNameLength + extraFieldLength + fileCommentLength;
  }

  return entries;
};

const readZipEntry = (buffer, entry) => {
  const offset = entry.localHeaderOffset;

  if (readUInt32(buffer, offset) !== 0x04034b50) {
    throw new Error(`Invalid AAB: malformed local header for ${entry.fileName}`);
  }

  const fileNameLength = readUInt16(buffer, offset + 26);
  const extraFieldLength = readUInt16(buffer, offset + 28);
  const dataStart = offset + 30 + fileNameLength + extraFieldLength;
  const compressed = buffer.slice(dataStart, dataStart + entry.compressedSize);

  if (entry.compressionMethod === 0) {
    return compressed;
  }

  if (entry.compressionMethod === 8) {
    return zlib.inflateRawSync(compressed);
  }

  return Buffer.alloc(0);
};

const scanAab = (aabPath) => {
  const buffer = fs.readFileSync(aabPath);
  const entries = listZipEntries(buffer);
  const productionNeedle = Buffer.from(PRODUCTION_API_URL);
  const developmentNeedle = Buffer.from(DEVELOPMENT_API_URL);
  const matches = {
    production: [],
    development: [],
  };

  for (const entry of entries) {
    const content = readZipEntry(buffer, entry);

    if (content.includes(productionNeedle)) {
      matches.production.push(entry.fileName);
    }

    if (content.includes(developmentNeedle)) {
      matches.development.push(entry.fileName);
    }
  }

  return matches;
};

const aabPath = path.resolve(process.argv[2] ?? findLatestAab() ?? "");

if (!aabPath || !fs.existsSync(aabPath)) {
  console.error(
    "Android AAB not found. Pass a path: npm run verify:android:aab -- path/to/app.aab",
  );
  process.exit(1);
}

const matches = scanAab(aabPath);
const hasProductionApi = matches.production.length > 0;
const hasDevelopmentApi = matches.development.length > 0;

console.log(`AAB: ${aabPath}`);
console.log(`Production API: ${hasProductionApi ? "found" : "not found"}`);
console.log(`Development API: ${hasDevelopmentApi ? "found" : "not found"}`);

if (hasDevelopmentApi) {
  console.error(
    `Development API found in AAB entries: ${matches.development.join(", ")}`,
  );
  process.exit(1);
}

if (!hasProductionApi) {
  console.error(`Production API was not found: ${PRODUCTION_API_URL}`);
  process.exit(1);
}

console.log("Android AAB API verification passed.");
