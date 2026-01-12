import { httpClient } from "../utils/httpClient";
import type { ApiResponse } from "../utils/intefacesGenerics";

export interface SystemPromptData {
  promptText: string;
  container: string;
  blobName: string;
  length: number;
  updatedAt: string;
}

export interface UpdateSystemPromptRequest {
  promptText: string;
}


export type GetSystemPromptResponse = ApiResponse<SystemPromptData>;

export type UpdateSystemPromptResponse = ApiResponse<{
  blobUpdate: {
    updated: boolean;
    container: string;
    blobName: string;
    length: number;
    updatedAt: string;
  };
  updatedAgent: {
    updated: boolean;
    updatedAt: string;
  };
}>;



export const getSystemPrompt = async (): Promise<GetSystemPromptResponse> => {
  return httpClient<GetSystemPromptResponse>(
    "/system-prompt",
    {
      method: "GET",
    }
  );
};


export const updateSystemPrompt = async (
  payload: UpdateSystemPromptRequest
): Promise<UpdateSystemPromptResponse> => {
  return httpClient<UpdateSystemPromptResponse>(
    "/system-prompt",
    {
      method: "PUT",
      body: JSON.stringify(payload),
    }
  );
};
