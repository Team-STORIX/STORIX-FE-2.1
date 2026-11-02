const fs = require('fs');
const path = require('path');

const wrapperPath = path.join(__dirname, '../android/gradle/wrapper/gradle-wrapper.properties');

if (!fs.existsSync(wrapperPath)) {
  console.error('gradle-wrapper.properties not found');
  process.exit(1);
}

let content = fs.readFileSync(wrapperPath, 'utf8');
let patched = content.replace(/gradle-[\d.]+-bin\.zip/, 'gradle-8.13-bin.zip');

if (content === patched) {
  console.log('Gradle already at 8.13');
} else {
  fs.writeFileSync(wrapperPath, patched);
  console.log('Gradle patched to 8.13');
}

const rootBuildGradlePath = path.join(__dirname, '../android/build.gradle');
if (fs.existsSync(rootBuildGradlePath)) {
  content = fs.readFileSync(rootBuildGradlePath, 'utf8');
  const notifeeRepo = '    maven { url "$rootDir/../node_modules/@notifee/react-native/android/libs" }\n';
  patched = content.includes('@notifee/react-native/android/libs')
    ? content
    : content.replace('  repositories {\n', `  repositories {\n${notifeeRepo}`);

  if (patched !== content) {
    fs.writeFileSync(rootBuildGradlePath, patched);
    console.log('Notifee local Maven repository added');
  }
}

const appBuildGradlePath = path.join(__dirname, '../android/app/build.gradle');
if (fs.existsSync(appBuildGradlePath)) {
  content = fs.readFileSync(appBuildGradlePath, 'utf8');
  const originalContent = content;

  const productionAabGuard = `def productionApiUrl = 'https://api.storix.kr'
`;
  const productionAabGuardBlock = `
def readRootEnvValue = { String name ->
    def envFiles = [rootProject.file('../.env.local'), rootProject.file('../.env')]
    for (envFile in envFiles) {
        if (!envFile.exists()) {
            continue
        }
        def line = envFile.readLines().find { envLine ->
            def trimmed = envLine.trim()
            trimmed && !trimmed.startsWith('#') && trimmed.startsWith("\${name}=")
        }
        if (line != null) {
            return line.substring(line.indexOf('=') + 1).trim().replaceAll(/^['"]|['"]$/, '')
        }
    }
    return null
}

def storixEnvValue = { String name ->
    return System.getenv(name) ?: readRootEnvValue(name)
}

def isReleaseBundleTask = gradle.startParameter.taskNames.any { taskName ->
    def normalized = taskName.toLowerCase()
    normalized == 'bundle' || normalized.endsWith('bundlerelease') || normalized.endsWith(':app:bundlerelease')
}

if (isReleaseBundleTask && storixEnvValue('EXPO_PUBLIC_API_URL') != productionApiUrl) {
    throw new GradleException("Android release AAB requires EXPO_PUBLIC_API_URL=\${productionApiUrl}.")
}
`;

  // Use more stable anchor: keystorePropertiesFile definition
  const keystoreFileAnchor = /def keystorePropertiesFile = rootProject\.file\([^)]+\)\s*\n/;

  if (!content.includes("def productionApiUrl = 'https://api.storix.kr'")) {
    // Try to insert after keystorePropertiesFile
    if (keystoreFileAnchor.test(content)) {
      content = content.replace(
        keystoreFileAnchor,
        (match) => `${match}def keystoreProperties = new Properties()\n${productionAabGuard}`,
      );
    } else {
      // Fallback: try original anchor
      const keystorePropsAnchor = /def keystoreProperties = new Properties\(\)\s*\n/;
      if (keystorePropsAnchor.test(content)) {
        content = content.replace(
          keystorePropsAnchor,
          (match) => `${match}${productionAabGuard}`,
        );
      }
    }
  }

  if (!content.includes("def readRootEnvValue = { String name ->")) {
    // Use regex for more flexible matching
    const keystoreLoadAnchor = /if \(keystorePropertiesFile\.exists\(\)\) \{[^}]*keystoreProperties\.load\(it\)[^}]*\}\s*\n/;

    if (keystoreLoadAnchor.test(content)) {
      content = content.replace(
        keystoreLoadAnchor,
        (match) => `${match}${productionAabGuardBlock}`,
      );
    }
  }

  patched = content;

  if (patched !== originalContent) {
    fs.writeFileSync(appBuildGradlePath, patched);
  }

  // CRITICAL: Verify all required guards are present
  const finalContent = fs.readFileSync(appBuildGradlePath, 'utf8');
  const criticalGuards = {
    productionApiUrl: {
      pattern: /def productionApiUrl = ['"]https:\/\/api\.storix\.kr['"]/,
      description: 'Production API URL constant',
    },
    isReleaseBundleTask: {
      pattern: /def isReleaseBundleTask = gradle\.startParameter\.taskNames/,
      description: 'Release bundle task detection',
    },
    guardException: {
      pattern: /throw new GradleException\("Android release AAB requires EXPO_PUBLIC_API_URL=/,
      description: 'Release AAB guard exception',
    },
  };

  const missingGuards = [];
  for (const [key, guard] of Object.entries(criticalGuards)) {
    if (!guard.pattern.test(finalContent)) {
      missingGuards.push(`  - ${guard.description} (${key})`);
    }
  }

  if (missingGuards.length > 0) {
    console.error('\n❌ CRITICAL: Required Gradle guards missing in build.gradle:');
    console.error(missingGuards.join('\n'));
    console.error('\nThese guards prevent development API in production builds.');
    console.error('Without them, you risk releasing an app pointing to dev.storix.kr.');
    console.error('\nPossible causes:');
    console.error('  - Expo SDK version changed the build.gradle template');
    console.error('  - Manual edits to android/app/build.gradle removed anchors');
    console.error('\nPath: ' + appBuildGradlePath);
    process.exit(1);
  }

  console.log('✅ Android app Gradle patches applied and verified');
}
