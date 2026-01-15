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

  const isFormData = body instanceof FormData;

  if (!isFormData) {
    finalHeaders.set("Content-Type", "application/json");
  }

  if (!skipAuth) {
    const token = localStorage.getItem("accessToken");
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
      
    }

    console.error("❌ Response error:", errorBody);
    throw new Error(
      errorBody?.meta?.message ||
      errorBody?.message ||
      "Error de red"
    );
  }

  const data = (await response.json()) as T;

  return data;
};
