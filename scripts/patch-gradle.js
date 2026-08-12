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

  if (!content.includes("def productionApiUrl = 'https://api.storix.kr'")) {
    content = content.replace(
      "def keystoreProperties = new Properties()\n",
      `def keystoreProperties = new Properties()\n${productionAabGuard}`,
    );
  }

  if (!content.includes("def readRootEnvValue = { String name ->")) {
    content = content.replace(
      "if (keystorePropertiesFile.exists()) {\n    keystorePropertiesFile.withInputStream { keystoreProperties.load(it) }\n}\n",
      `if (keystorePropertiesFile.exists()) {\n    keystorePropertiesFile.withInputStream { keystoreProperties.load(it) }\n}\n${productionAabGuardBlock}`,
    );
  }

  const entryPointPatch = `
tasks.named("generateReactNativeEntryPoint").configure {
    doLast {
        def entryPoint = file("$buildDir/generated/autolinking/src/main/java/com/facebook/react/ReactNativeApplicationEntryPoint.java")
        if (entryPoint.exists()) {
            def patched = entryPoint.text
                .replace("kr.storix.app.BuildConfig", "kr.storix.android.BuildConfig")
            if (patched != entryPoint.text) {
                entryPoint.text = patched
            }
        }
    }
}
`;

  patched = content.includes('tasks.named("generateReactNativeEntryPoint").configure')
    ? content
    : content.replace(
        '}\n\n// Apply static values',
        `}\n${entryPointPatch}\n// Apply static values`,
      );

  if (patched !== originalContent) {
    fs.writeFileSync(appBuildGradlePath, patched);
    console.log('Android app Gradle patches applied');
  }
}
