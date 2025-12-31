// ===========================
// 1) Tipos de getFlows (OPENAPI-LIKE)
// ===========================

import type { OpenAPISchema } from "../FlowsManager";

export interface FlowsResponse {
  code: {
    http: number;
    message: string;
  };
  data: {
    flows: BackendFlow[];
  };
  meta: {
    timestamp: string;
  };
}

// ===========================
// FLOW
// ===========================

export interface BackendFlow {
  id: string;
  name: string;
  urlBase: string;
  description: string;
  active: boolean;
  updatedAt: string;

  paths: Record<string, Record<string, BackendFlowMethod>>;
  components?: BackendFlowComponents;
}

// ===========================
// METHODS
// ===========================

export interface BackendFlowMethod {
  summary: string;
  description: string;
  operationId: string;

  // OpenAPI security
  security?: Array<Record<string, string[]>>;

  // Path / Query / Header params
  parameters?: BackendFlowParameter[];

  requestBody?: {
    required: boolean;
    content: {
      "application/json": {
        schema: BackendSchema;
      };
    };
  };

  responses: Record<string, BackendFlowResponse>;
}

// ===========================
// PARAMETERS
// ===========================

export interface BackendFlowParameter {
  name: string;
  in: "path" | "query" | "header" | "cookie";
  required?: boolean;
  description?: string;
  schema: {
    type: string;
    example?: string | number | boolean;
  };
}

// ===========================
// RESPONSES
// ===========================

export interface BackendFlowResponse {
  description: string;
  content?: {
    "application/json"?: {
      schema: BackendSchema;
    };
  };
}

// ===========================
// SCHEMA
// ===========================

export interface BackendSchema {
  type: string;
  properties?: Record<string, BackendSchemaProperty>;
  required?: string[];
}

// ===========================
// SCHEMA PROPERTY
// ===========================

export interface BackendSchemaProperty {
  type: string;
  description?: string;
  example?: string | number | boolean;
}

// ===========================
// COMPONENTS
// ===========================

export interface BackendFlowComponents {
  securitySchemes?: {
    ApiKeyAuth?: BackendApiKeySecurityScheme;
    BearerAuth?: BackendBearerSecurityScheme;
  };
}

// ===========================
// SECURITY SCHEMES
// ===========================

export interface BackendApiKeySecurityScheme {
  type: "apiKey";
  in: "header" | "query";
  name: string;
  value?: string;
}

export interface BackendBearerSecurityScheme {
  type: "http";
  scheme: "bearer";
  value?: string;
}

// ===========================
// UPDATE FLOW PAYLOAD
// ===========================

export interface UpdateFlowRequest {
  // --- dominio ---
  flowName: string;
  storedFlowRowKey: string;

  // --- OpenAPI envuelto ---
  openApiJson: OpenAPISchema & {
    // extras de tu dominio (NO OpenAPI puro)
    active?: boolean;
  };
}


export interface PatchFlowRequest {
  // --- dominio ---
  active: boolean;
  storedFlowRowKey: string;
}

