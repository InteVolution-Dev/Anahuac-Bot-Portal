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