import type {
  AxiosError,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";

// Dev-only request/response logging. All entry points no-op in production
// builds, so call sites don't need their own __DEV__ guards.

// Set to false to silence API logs without removing the interceptors.
const ENABLED = __DEV__;

// Bodies larger than this are truncated so the Metro console stays usable.
const MAX_BODY_CHARS = 2_000;

const SENSITIVE_HEADERS = [
  "authorization",
  "onboarding-token",
  "onboardingtoken",
  "refresh-token",
  "cookie",
];

const SENSITIVE_BODY_KEYS = [
  "password",
  "accesstoken",
  "refreshtoken",
  "idtoken",
  "token",
  "fcmtoken",
];

type TimedConfig = InternalAxiosRequestConfig & { _startedAt?: number };

const maskValue = (value: string): string =>
  value.length <= 12 ? "***" : `${value.slice(0, 8)}…***(${value.length})`;

const maskHeaders = (
  headers: InternalAxiosRequestConfig["headers"],
): Record<string, unknown> => {
  if (!headers) return {};
  // AxiosHeaders (v1) exposes toJSON(); plain objects don't.
  const raw: Record<string, unknown> =
    typeof (headers as any).toJSON === "function"
      ? (headers as any).toJSON()
      : { ...(headers as Record<string, unknown>) };

  const masked: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(raw)) {
    masked[key] =
      SENSITIVE_HEADERS.includes(key.toLowerCase()) && typeof value === "string"
        ? value
        : value;
  }
  return masked;
};

const maskBody = (body: unknown): unknown => {
  if (Array.isArray(body)) return body.map(maskBody);
  if (body === null || typeof body !== "object") return body;

  const masked: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(body as Record<string, unknown>)) {
    if (SENSITIVE_BODY_KEYS.includes(key.toLowerCase())) {
      masked[key] = typeof value === "string" ? maskValue(value) : "***";
    } else {
      masked[key] = maskBody(value);
    }
  }
  return masked;
};

// Request bodies arrive as a JSON string once axios has serialized them.
const parseBody = (body: unknown): unknown => {
  if (typeof body !== "string") return body;
  try {
    return JSON.parse(body);
  } catch {
    return body;
  }
};

const format = (body: unknown): string => {
  if (body === undefined) return "";
  let text: string;
  try {
    text = JSON.stringify(maskBody(parseBody(body)), null, 2);
  } catch {
    text = String(body);
  }
  if (text === undefined) return "";
  return text.length > MAX_BODY_CHARS
    ? `${text.slice(0, MAX_BODY_CHARS)}\n… (truncated, ${text.length} chars)`
    : text;
};

const elapsedMs = (config?: TimedConfig): string => {
  const startedAt = config?._startedAt;
  return startedAt ? `${Date.now() - startedAt}ms` : "-";
};

const target = (config?: InternalAxiosRequestConfig): string =>
  `${config?.method?.toUpperCase() ?? "?"} ${config?.url ?? "?"}`;

export const logRequest = (config: TimedConfig): TimedConfig => {
  if (!ENABLED) return config;
  config._startedAt = Date.now();

  console.log(`\n➡️  [API] ${target(config)}`);
  console.log("   baseURL:", config.baseURL);
  console.log("   headers:", maskHeaders(config.headers));
  if (config.params) console.log("   params:", config.params);
  if (config.data !== undefined) console.log("   body:", format(config.data));

  return config;
};

export const logResponse = (response: AxiosResponse): AxiosResponse => {
  if (!ENABLED) return response;
  const config = response.config as TimedConfig;

  console.log(
    `\n✅ [API] ${response.status} ${target(config)} (${elapsedMs(config)})`,
  );
  console.log("   data:", format(response.data));

  return response;
};

export const logError = (error: AxiosError): AxiosError => {
  if (!ENABLED) return error;
  const config = error.config as TimedConfig | undefined;

  if (error.response) {
    console.log(
      `\n❌ [API] ${error.response.status} ${target(config)} (${elapsedMs(config)})`,
    );
    console.log("   data:", format(error.response.data));
  } else {
    // No response: timeout, DNS failure, offline, request cancelled.
    console.log(
      `\n💥 [API] ${error.code ?? "NETWORK_ERROR"} ${target(config)} (${elapsedMs(config)})`,
    );
    console.log("   message:", error.message);
  }

  return error;
};
