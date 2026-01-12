import { URL_API_AGENT } from "../utils/environments";

export interface HttpClientOptions extends RequestInit {
  skipAuth?: boolean;
}

export const httpClient = async <T>(
  endpoint: string,
  options: HttpClientOptions = {}
): Promise<T> => {
  const { skipAuth, headers, body, ...rest } = options;

  const finalHeaders = new Headers(headers);

  // 🔥 SOLO setear Content-Type si NO es FormData
  const isFormData = body instanceof FormData;

  if (!isFormData) {
    finalHeaders.set("Content-Type", "application/json");
  }

  if (!skipAuth) {
    const token = localStorage.getItem("token");
    if (token) {
      finalHeaders.set("Authorization", `Bearer ${token}`);
    }
  }

  console.log("➡️ Request:", endpoint, {
    ...rest,
    body: isFormData ? "[FormData]" : body,
  });

  const response = await fetch(`${URL_API_AGENT}${endpoint}`, {
    ...rest,
    body,
    headers: finalHeaders,
  });

  if (!response.ok) {
    let errorBody: any = null;

    try {
      errorBody = await response.json();
    } catch {
      /* no-op */
    }

    console.error("❌ Response error:", errorBody);
    throw new Error(
      errorBody?.meta?.message ||
      errorBody?.message ||
      "Error de red"
    );
  }

  const data = (await response.json()) as T;

  console.log("✅ Response:", data);

  return data;
};
