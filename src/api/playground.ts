import { httpClient } from "../utils/httpClient";

/* =========================
 * Request
 * ========================= */
export interface PlaygroundChatRequest {
  userMessage: string;
}

/* =========================
 * Base API types
 * ========================= */
export interface ApiCode {
  http: number;
  message: string;
}

export interface ApiMeta {
  timestamp: string;
}

export interface ApiResponse<T> {
  code: ApiCode;
  data: T;
  meta: ApiMeta;
}

/* =========================
 * Response
 * ========================= */
export interface PlaygroundChatData {
  conversationId: string;
  response: string;
}

export interface PlaygroundChatContinueRequest {
  conversationId: string;
  userMessage: string;
}


export type PlaygroundChatResponse = ApiResponse<PlaygroundChatData>;

/* =========================
 * Service
 * ========================= */
export const sendPlaygroundChat = async (
  payload: PlaygroundChatRequest
): Promise<PlaygroundChatResponse> => {
  return httpClient<PlaygroundChatResponse>(
    "/playground/chats",
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );
};

export const continuePlaygroundChat = async (
  payload: PlaygroundChatContinueRequest
): Promise<PlaygroundChatResponse> => {
  return httpClient<PlaygroundChatResponse>(
    "/playground/chats/continue",
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );
};
