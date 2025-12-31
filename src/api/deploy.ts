import { httpClient } from "../utils/httpClient";

/* =========================
 * Base API types
 * ========================= */
export interface ApiCode {
  http: number;
  message: string;
}

export interface ApiMeta {
  timestamp: string;
  message: string;
}

export interface ApiResponse<T> {
  code: ApiCode;
  data: T;
  meta: ApiMeta;
}

/* =========================
 * Response
 * ========================= */
export type DeployChangeAgentResponse = ApiResponse<null>;

/* =========================
 * API call
 * ========================= */
export const deployChangeAgent = async (): Promise<DeployChangeAgentResponse> => {
  return httpClient<DeployChangeAgentResponse>(
    "/deploy",
    {
      method: "POST",
    }
  );
};
