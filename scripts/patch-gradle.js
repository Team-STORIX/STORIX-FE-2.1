const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../android/gradle/wrapper/gradle-wrapper.properties');

if (!fs.existsSync(filePath)) {
  console.error('gradle-wrapper.properties not found');
  process.exit(1);
}

let content = fs.readFileSync(filePath, 'utf8');
const patched = content.replace(/gradle-[\d.]+-bin\.zip/, 'gradle-8.13-bin.zip');

if (content === patched) {
  console.log('✓ Gradle already at 8.13');
} else {
  fs.writeFileSync(filePath, patched);
  console.log('✓ Gradle patched to 8.13');
}
