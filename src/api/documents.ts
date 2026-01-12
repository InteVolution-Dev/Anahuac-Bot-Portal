export type GetIndexFilesResponse = ApiResponse<IndexFilesData>;
import { httpClient } from "../utils/httpClient";
import type { ApiResponse } from "../utils/intefacesGenerics";

export type StatusType = "FAILED" | "INDEXED";

export interface IndexFile {
  id: string;
  originalName: string;
  status: StatusType;
  blobContainer: string;
  blobName: string;
  size: number;
  contentType: string;
  extension: string;
  vectorStoreFileId: string;
  createdAt: string;
  updatedAt: string;
}

export interface IndexFilesData {
  indexId: string;
  count: number;
  files: IndexFile[];
}

export interface DeleteIndexFileRequest {
  fileRowKey: string;
}

export interface DeleteIndexFileData {
  deleted: boolean,
  fileRowKey: string;
}

export interface UploadIndexFile {
  partitionKey: string;
  rowKey: string;
  blobContainer: string;
  blobName: string;
  originalName: string;
  extension: string;
  contentType: string;
  size: number;
  vectorStoreFileId: string;
  status: "INDEXED" | "FAILED";
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

export type UploadIndexFilesResponse = ApiResponse<UploadIndexFile[]>;


export type DeleteIndexFileResponse = ApiResponse<DeleteIndexFileData>;


export const getIndexFiles = async (): Promise<GetIndexFilesResponse> => {
  return httpClient<GetIndexFilesResponse>(
    "/indexes/files",
    {
      method: "GET",
    }
  );
};

export const deleteIndexFile = async (
  payload: DeleteIndexFileRequest
): Promise<DeleteIndexFileResponse> => {
  return httpClient<DeleteIndexFileResponse>("/indexes/delete-file", {
    method: "DELETE",
    body: JSON.stringify(payload),
  });
};

export const uploadIndexFiles = async (
  files: File[]
): Promise<UploadIndexFilesResponse> => {
  const formData = new FormData();

  files.forEach((file) => {
    formData.append("files", file);
  });

  return httpClient<UploadIndexFilesResponse>(
    "/indexes/upload-files",
    {
      method: "POST",
      body: formData,
    }
  );
};
