import { httpClient } from "../utils/httpClient";
import type { ApiResponse } from "../utils/intefacesGenerics";


export type DeployChangeAgentResponse = ApiResponse<null>;

export const deployChangeAgent = async (): Promise<DeployChangeAgentResponse> => {
  return httpClient<DeployChangeAgentResponse>(
    "/deploy",
    {
      method: "POST",
    }
  );
};
