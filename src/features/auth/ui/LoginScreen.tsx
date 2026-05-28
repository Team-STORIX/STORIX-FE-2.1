import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuthStore } from "../../../store/auth.store";
import { C, Typography } from "../../../theme";
import { developerLogin } from "../api";
import { useNativeSocialLogin } from "../hooks";

// Dev-only login entry. Gated behind BOTH __DEV__ (stripped from release builds)
// and an explicit opt-in env flag, so it can never surface in a production build.
// EXPO_PUBLIC_* vars are inlined by Metro at build time.
const DEV_LOGIN_ENABLED =
  __DEV__ && process.env.EXPO_PUBLIC_ENABLE_DEV_LOGIN === "true";

// pendingId handed to the backend dev-login endpoint; overridable for local QA.
const DEV_LOGIN_PENDING_ID =
  process.env.EXPO_PUBLIC_DEV_LOGIN_PENDING_ID ?? "It9znl2a";

const logoWord = require("../../../../assets/logos/logo-word.svg");
const kakaoButton = require("../../../../assets/icons/login/login-kakao.svg");
const naverButton = require("../../../../assets/icons/login/login-naver.svg");
const twitterButton = require("../../../../assets/icons/login/login-twitter.svg");
const appleButton = require("../../../../assets/icons/login/login-apple.svg");

export function LoginScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const mutation = useNativeSocialLogin();
  const setLoginTokens = useAuthStore((s) => s.setLoginTokens);
  const [devPending, setDevPending] = useState(false);

  const pendingProvider = mutation.variables;
  const pending = mutation.isPending || devPending;

  const handleDevLogin = async () => {
    setDevPending(true);
    try {
      const res = await developerLogin(DEV_LOGIN_PENDING_ID);
      const accessToken = res?.result?.accessToken;
      if (!accessToken) {
        Alert.alert("오류", "개발자 로그인 응답에 토큰이 없어요.");
        return;
      }
      // Stores accessToken in SecureStore, clears any onboardingToken, and flips
      // isAuthenticated → AuthGate then routes out of (auth). We also navigate
      // explicitly to match the social-login flow.
      await setLoginTokens({ accessToken });
      router.replace("/(tabs)");
    } catch {
      // Failure leaves existing auth state untouched (setLoginTokens never ran).
      Alert.alert("오류", "개발자 로그인에 실패했어요.");
    } finally {
      setDevPending(false);
    }
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.hero}>
        <Image source={logoWord} style={styles.logoWord} contentFit="contain" />
      </View>

      <View style={styles.buttonGroup}>
        {DEV_LOGIN_ENABLED ? (
          <Pressable
            style={({ pressed }) => [
              styles.devButton,
              pending && styles.dimmed,
              pressed && !pending && styles.pressed,
            ]}
            onPress={handleDevLogin}
            disabled={pending}
          >
            <Text style={styles.devButtonText}>개발자 로그인</Text>
          </Pressable>
        ) : null}
        <LoginAssetButton
          source={kakaoButton}
          onPress={() => mutation.mutate("kakao")}
          loading={pending && pendingProvider === "kakao"}
          disabled={pending}
        />
        <LoginAssetButton
          source={naverButton}
          onPress={() => mutation.mutate("naver")}
          loading={pending && pendingProvider === "naver"}
          disabled={pending}
        />
        <LoginAssetButton
          source={twitterButton}
          onPress={() =>
            Alert.alert("안내", "트위터 로그인은 아직 지원되지 않아요.")
          }
          disabled={pending}
        />
        {Platform.OS === "ios" && (
          <LoginAssetButton
            source={appleButton}
            onPress={() =>
              Alert.alert("안내", "Apple 로그인은 아직 준비 중이에요.")
            }
            disabled={pending}
          />
        )}

        {mutation.isError ? (
          <Text style={styles.errorText}>
            {pendingProvider === "kakao"
              ? "카카오 로그인에 실패했습니다. 다시 시도해 주세요."
              : "로그인에 실패했습니다. 다시 시도해 주세요."}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

function LoginAssetButton({
  source,
  onPress,
  loading = false,
  disabled = false,
}: {
  source: number;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
}) {
  // A non-loading button still gets disabled while a sibling provider is pending,
  // so its visual feedback should make that clear without looking "broken":
  // dim it slightly. Loading buttons keep full opacity so the spinner reads cleanly.
  const dimmed = disabled && !loading;
  return (
    <Pressable
      style={({ pressed }) => [
        styles.assetButton,
        dimmed && styles.dimmed,
        pressed && !disabled && styles.pressed,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <Image
        source={source}
        style={styles.assetButtonImage}
        contentFit="contain"
      />
      {loading ? (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="small" color={C.text} />
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: C.card,
    alignItems: "center",
  },
  hero: {
    marginTop: 263,
    alignItems: "center",
  },
  logoWord: {
    width: 120,
    height: 120,
  },
  buttonGroup: {
    marginTop: 64,
    gap: 4,
    alignSelf: "stretch",
    paddingHorizontal: 16,
  },
  assetButton: {
    width: "100%",
    height: 48,
  },
  assetButtonImage: {
    width: "100%",
    height: 48,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  errorText: {
    ...Typography.caption1Medium,
    color: C.error,
    textAlign: "center",
    marginTop: 8,
  },
  devButton: {
    marginTop: 8,
    width: "100%",
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.primary,
    borderRadius: 4,
  },
  devButtonText: {
    ...Typography.body2Bold,
    color: C.card,
  },
  pressed: {
    opacity: 0.82,
  },
  dimmed: {
    opacity: 0.45,
  },
});
