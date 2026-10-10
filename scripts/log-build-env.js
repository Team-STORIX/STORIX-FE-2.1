#!/usr/bin/env node

const buildType = process.argv[2];

const configs = {
  test: {
    emoji: '🔧',
    name: '테스트 빌드',
    format: 'APK',
    server: 'dev.storix.kr',
    env: '개발 서버',
  },
  prod: {
    emoji: '🚀',
    name: '프로덕션 빌드',
    format: 'AAB',
    server: 'api.storix.kr',
    env: '배포 서버',
  },
};

const config = configs[buildType];

if (!config) {
  console.error('❌ 잘못된 빌드 타입:', buildType);
  process.exit(1);
}

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`${config.emoji} ${config.name}`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`📦 파일 형식: ${config.format}`);
console.log(`🌐 연결 서버: ${config.server} (${config.env})`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
