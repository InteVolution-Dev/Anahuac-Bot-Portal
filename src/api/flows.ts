import type { OpenAPISchema } from "../components/FlowsManager";
import type {
  FlowsResponse,
  PatchFlowRequest,
  UpdateFlowRequest,
} from "../components/interfaces/flow";

import { httpClient } from "../utils/httpClient";

/* =========================
 * Base types
 * ========================= */
export interface ApiCodeResponse {
  code: {
    http: number;
    message: string;
  };
}

/* =========================
 * GET flows
 * ========================= */
export const getFlows = async (): Promise<FlowsResponse> => {
  return httpClient<FlowsResponse>("/flows-list", {
    method: "GET",
  });
};

/* =========================
 * DELETE flow
 * ========================= */
export const deleteFlowData = async (
  flowName: string,
  storedFlowRowKey: string
): Promise<ApiCodeResponse["code"]> => {
  const response = await httpClient<ApiCodeResponse>(
    "/delete-flow",
    {
      method: "DELETE",
      body: JSON.stringify({
        flowName,
        storedFlowRowKey,
      }),
    }
  );

  return response.code;
};

/* =========================
 * CREATE flow
 * ========================= */
export const createFlowData = async (
  schema: OpenAPISchema
): Promise<ApiCodeResponse["code"]> => {
  const response = await httpClient<ApiCodeResponse>(
    "/create-flow",
    {
      method: "POST",
      body: JSON.stringify(schema),
    }
  );

  return response.code;
};

/* =========================
 * UPDATE flow
 * ========================= */
export const updateFlowData = async (
  payload: UpdateFlowRequest
): Promise<ApiCodeResponse["code"]> => {
  if (!payload.storedFlowRowKey) {
    throw new Error("storedFlowRowKey is required");
  }

  const response = await httpClient<ApiCodeResponse>(
    "/update-flow",
    {
      method: "PUT",
      body: JSON.stringify(payload),
    }
  );

  return response.code;
};

/* =========================
 * PATCH flow
 * ========================= */
export const patchFlowData = async (
  payload: PatchFlowRequest
): Promise<ApiCodeResponse["code"]> => {
  if (!payload.storedFlowRowKey) {
    throw new Error("storedFlowRowKey is required");
  }

  const response = await httpClient<ApiCodeResponse>(
    "/patch-flow",
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    }
  );

  return response.code;
};
