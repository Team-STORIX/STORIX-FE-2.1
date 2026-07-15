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

  if (patched !== content) {
    fs.writeFileSync(appBuildGradlePath, patched);
    console.log('React Native entry point BuildConfig patch added');
  }
}
