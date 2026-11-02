import "@expo/metro-runtime";

import { withErrorOverlay } from "@expo/metro-runtime/error-overlay";
import { App } from "expo-router/build/qualified-entry";
import { AppRegistry } from "react-native";

// 🌐 서버 연결 정보 출력
if (__DEV__) {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'NOT SET';
  const landingUrl = process.env.EXPO_PUBLIC_LANDING_BASE_URL || 'NOT SET';
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🌐 서버 연결 정보');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📡 API 서버: ${apiUrl}`);
  console.log(`🌍 랜딩 URL: ${landingUrl}`);

  // 환경 판단
  if (apiUrl.includes('dev.storix.kr')) {
    console.log('🔧 환경: 개발 서버 (DEV)');
  } else if (apiUrl.includes('api.storix.kr')) {
    console.log('🚀 환경: 프로덕션 서버 (PROD)');
  } else {
    console.log('❓ 환경: 알 수 없음');
  }
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

try {
  require("./src/features/notification/services/registerBackgroundPushHandler").registerBackgroundPushHandler();
} catch (err) {
  if (__DEV__) {
    // eslint-disable-next-line no-console
    console.warn("[push] background handler skipped", err);
  }
}

const Root = process.env.NODE_ENV !== "production" ? withErrorOverlay(App) : App;

AppRegistry.registerComponent("main", () => Root);
