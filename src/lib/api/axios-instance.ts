import axios, {
  type AxiosError,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";
import {
  getAccessToken,
  getRefreshToken,
  setAccessToken,
  setRefreshToken,
} from "../storage/secure";
// useAuthStore is imported here (not in component context) to call clearAuth()
// on token refresh failure. No circular dependency: auth.store never imports axios-instance.
import { useAuthStore } from "../../store/auth.store";

// ---------- header helpers ----------
// AxiosHeaders (Axios v1) exposes .get()/.set(); plain objects do not.
// Both shapes are handled so interceptors work in tests and in production.

const getAuthorizationHeader = (
  headers: InternalAxiosRequestConfig["headers"],
): string | undefined => {
  if (!headers) return undefined;
  if (typeof (headers as any).get === "function") {
    const v = (headers as any).get("Authorization");
    return typeof v === "string" && v.length > 0 ? v : undefined;
  }
  const h = headers as Record<string, unknown>;
  const val = h["Authorization"] ?? h["authorization"];
  return typeof val === "string" && val.length > 0 ? val : undefined;
};

const setAuthorizationHeader = (
  headers: InternalAxiosRequestConfig["headers"],
  value: string,
): void => {
  if (!headers) return;
  if (typeof (headers as any).set === "function") {
    (headers as any).set("Authorization", value);
    return;
  }
  (headers as Record<string, unknown>)["Authorization"] = value;
};

// ---------- no-refresh endpoint list ----------
// Requests matching these paths must never trigger a token refresh:
//   - The refresh endpoint itself (would cause an infinite loop)
//   - Login / signup / onboarding (caller has no accessToken yet)

const NO_REFRESH_PATHS = [
  "/api/v1/auth/tokens/refresh",
  "/api/v1/auth/users/reader/signup",
  "/api/v1/onboarding/works",
  "/api/v1/auth/login",
  "/api/v1/auth/oauth",
  "/api/v1/auth/users",
  "/api/v1/auth/nickname",
] as const;

const isNoRefreshEndpoint = (url?: string): boolean => {
  if (!url) return false;
  return NO_REFRESH_PATHS.some((path) => url.includes(path));
};

// ---------- concurrent-refresh queue ----------
// If multiple requests fail with 401 at the same time, only one refresh call
// is made. The others are queued and retried once the new token arrives.

let isRefreshing = false;
let refreshQueue: Array<(newAccessToken: string) => void> = [];

const enqueueRefresh = (cb: (token: string) => void): void => {
  refreshQueue.push(cb);
};

const drainQueue = (newAccessToken: string): void => {
  refreshQueue.forEach((cb) => cb(newAccessToken));
  refreshQueue = [];
};

const clearQueue = (): void => {
  refreshQueue = [];
};

// ---------- axios instance ----------

export const apiClient = axios.create({
  // EXPO_PUBLIC_* vars are inlined by Metro at build time (like NEXT_PUBLIC_* in Next.js).
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  timeout: 10_000,
  // No withCredentials — cookies are not used in RN. Tokens live in SecureStore.
  headers: {
    "Content-Type": "application/json",
  },
});

// ---------- request interceptor ----------
// Reads accessToken from SecureStore and attaches it as a Bearer header.
// Skips if the caller already set an Authorization header (e.g. signup with onboardingToken).

apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    if (!config.headers) return config;

    const existing = getAuthorizationHeader(config.headers);
    if (existing) {
      return config; // Caller-supplied header takes precedence.
    }

    const token = await getAccessToken();
    if (token) {
      const authorization = `Bearer ${token}`;
      setAuthorizationHeader(config.headers, authorization);
      if (__DEV__) {
        // TODO: Remove this temporary auth header diagnostic before release.
        // Never log the token value (or Bearer string) — path + method only.
        console.log(
          "[api] Authorization attached",
          config.method?.toUpperCase(),
          config.url,
          `Bearer ${token}`,
        );
      }
    }

    return config;
  },
  (error: AxiosError) => Promise.reject(error),
);

// ---------- response interceptor ----------

type RetryableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const original = error.config as RetryableConfig | undefined;

    // Pass through immediately for non-auth endpoints and non-401 errors.
    if (!original || isNoRefreshEndpoint(original.url)) {
      return Promise.reject(error);
    }
    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error);
    }

    // A refresh is already in flight — queue this request and retry it
    // once the new token is available without triggering another refresh.
    if (isRefreshing) {
      return new Promise<AxiosResponse>((resolve) => {
        enqueueRefresh((newAccessToken) => {
          if (original.headers) {
            setAuthorizationHeader(
              original.headers,
              `Bearer ${newAccessToken}`,
            );
          }
          resolve(apiClient(original));
        });
      });
    }

    // Mark this request so a recursive 401 doesn't re-enter this branch.
    original._retry = true;
    isRefreshing = true;

    try {
      const storedRefreshToken = await getRefreshToken();

      if (!storedRefreshToken) {
        // No refresh token stored — session is unrecoverable.
        isRefreshing = false;
        clearQueue();
        // clearAuth() wipes SecureStore + Zustand state + navigates to login.
        useAuthStore
          .getState()
          .clearAuth()
          .catch(() => {});
        return Promise.reject(error);
      }

      // POST /api/v1/auth/tokens/refresh
      // Body:     { refreshToken: string }
      // Response: { ..., result: { accessToken: string, refreshToken: string } }
      const refreshResponse = await axios.post(
        `${process.env.EXPO_PUBLIC_API_URL}/api/v1/auth/tokens/refresh`,
        { refreshToken: storedRefreshToken },
        { headers: { "Content-Type": "application/json" } },
      );

      const result = refreshResponse.data?.result;
      const newAccessToken: string | undefined = result?.accessToken;
      const newRefreshToken: string | undefined = result?.refreshToken;

      if (typeof newAccessToken !== "string" || newAccessToken.length === 0) {
        throw new Error("Refresh response is missing accessToken");
      }

      // Persist rotated tokens.
      await setAccessToken(newAccessToken);
      if (typeof newRefreshToken === "string" && newRefreshToken.length > 0) {
        await setRefreshToken(newRefreshToken);
      }

      // Unblock all queued requests with the new token.
      drainQueue(newAccessToken);

      // Retry the original request.
      if (original.headers) {
        setAuthorizationHeader(original.headers, `Bearer ${newAccessToken}`);
      }
      return apiClient(original);
    } catch (refreshError) {
      clearQueue();
      // clearAuth() wipes SecureStore + Zustand state + navigates to login.
      useAuthStore
        .getState()
        .clearAuth()
        .catch(() => {});
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);
