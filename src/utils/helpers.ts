import type {
  Flow,
  FlowAuth,
  FlowBodyProperty,
  FlowEndpoint,
  FlowParameter,
  FlowResponse,
  HttpMethod,
  ParamLocation,
  ParamType,
} from "../components/FlowsManager";

import type {
  FlowsResponse,
  BackendFlowComponents,
  BackendSchemaProperty,
  BackendFlowResponse,
} from "../components/interfaces/flow";

/* ======================================================
   TRANSFORM
====================================================== */

export function transformGetFlowsResponseToFullFlow(
  data: FlowsResponse
): Flow[] {
  return data.data.flows.map((flow) => {
    const endpoints: FlowEndpoint[] = [];

    for (const path in flow.paths) {
      const methods = flow.paths[path];

      for (const method in methods) {
        const op = methods[method];

        /* ---------------- BODY ---------------- */
        const bodyProperties: FlowBodyProperty[] =
          op.requestBody?.content?.["application/json"]?.schema?.properties
            ? Object.entries(
                op.requestBody.content["application/json"].schema.properties
              ).map(([name, schema]: [string, BackendSchemaProperty]) => ({
                id: crypto.randomUUID(),
                name,
                type: schema.type as ParamType,
                description: schema.description || "",
                example: String(schema.example ?? ""),
                required:
                  op.requestBody?.content?.["application/json"]?.schema?.required?.includes(
                    name
                  ) ?? false,
              }))
            : [];

        /* ---------------- PARAMETERS ---------------- */
        const parameters: FlowParameter[] = op.parameters
          ? op.parameters.map((param) => ({
              id: crypto.randomUUID(),
              name: param.name,
              in: param.in as ParamLocation,
              required: param.required ?? false,
              description: param.description || "",
              type: param.schema?.type as ParamType,
              example: param.schema?.example !== undefined ? String(param.schema.example) : undefined,
            }))
          : [];

        /* ---------------- RESPONSES ---------------- */
        const responses: FlowResponse[] = Object.entries(
          op.responses || {}
        ).map(([statusCode, resp]: [string, BackendFlowResponse]) => ({
          id: crypto.randomUUID(),
          statusCode,
          description: resp.description || "",
          properties: resp.content?.["application/json"]?.schema?.properties
            ? Object.entries(
                resp.content["application/json"].schema.properties
              ).map(([name, schema]: [string, BackendSchemaProperty]) => ({
                id: crypto.randomUUID(),
                name,
                type: schema.type as ParamType,
                description: schema.description || "",
                example: String(schema.example ?? ""),
              }))
            : [],
        }));

        endpoints.push({
          id: crypto.randomUUID(),
          name: op.summary || path,
          description: op.description || "",
          method: method.toUpperCase() as HttpMethod,
          path,
          parameters,
          bodyProperties,
          responses,
        });
      }
    }

    /* ---------------- AUTH ---------------- */
    const auth: FlowAuth = detectAuth(flow.components);

    return {
      id: flow.id,
      name: flow.name || "",
      description: flow.description || "",
      active: flow.active,
      baseUrl: flow.urlBase,
      auth,
      endpoints,
      createdAt: flow.updatedAt,
      updatedAt: flow.updatedAt,
    };
  });
}

function detectAuth(components?: BackendFlowComponents): FlowAuth {
  if (!components?.securitySchemes) {
    return { type: "none" };
  }

  const { ApiKeyAuth, BearerAuth } = components.securitySchemes;

  if (ApiKeyAuth) {
    return {
      type: "apiKey",
      apiKeyName: ApiKeyAuth.name,
      apiKeyValue: ApiKeyAuth.value ?? "",
    };
  }

  if (BearerAuth) {
    return {
      type: "bearer",
      bearerToken: BearerAuth.value ?? "",
    };
  }

  return { type: "none" };
}

export function removeChatConvertationStorage(){
  localStorage.removeItem("playground_chat_conversation_id")
  localStorage.removeItem("playground_chat_messages")
}

export const formatDateTimeFriendly = (isoDate: string) => {
  const date = new Date(isoDate);

  return date.toLocaleDateString("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }) + " · " +
  date.toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

