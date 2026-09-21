function readEnv(key: keyof ImportMetaEnv): string {
  const value = import.meta.env[key];
  return typeof value === "string" ? value.trim() : "";
}

export const env = {
  apiBaseUrl: readEnv("VITE_API_BASE_URL").replace(/\/$/, ""),
  socketUrl: readEnv("VITE_SOCKET_URL").replace(/\/$/, ""),
} as const;

export function apiOrigin(baseUrl = env.apiBaseUrl): string {
  return baseUrl.replace(/\/api\/?$/, "");
}
