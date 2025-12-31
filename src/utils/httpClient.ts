import { URL_API_AGENT } from "../utils/environments";

export interface HttpClientOptions extends RequestInit {
  skipAuth?: boolean;
}

export const httpClient = async <T>(
  endpoint: string,
  options: HttpClientOptions = {}
): Promise<T> => {
  const { skipAuth, headers, ...rest } = options;

  const finalHeaders = new Headers(headers);

  finalHeaders.set("Content-Type", "application/json");

  if (!skipAuth) {
    const token = localStorage.getItem("token");
    if (token) {
      finalHeaders.set("Authorization", `Bearer ${token}`);
    }
  }

  console.log("➡️ Request:", endpoint, rest);

  const response = await fetch(`${URL_API_AGENT}${endpoint}`, {
    ...rest,
    headers: finalHeaders,
  });

  if (!response.ok) {
    const errorBody = await response.json();
    console.error("❌ Response error:", errorBody);
    throw new Error(errorBody?.meta?.message || "Error de red");
  }

  const data = (await response.json()) as T;

  console.log("✅ Response:", data);

  return data;
};
