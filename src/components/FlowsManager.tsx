import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Plus,
  Trash2,
  Pencil,
  Server,
  Shield,
  Route,
  CheckCircle,
  ChevronRight,
  ChevronLeft,
  X,
  AlertCircle,
  Layers,
  Key,
  Lock,
  Globe,
  FileJson,
  Zap,
  Copy,
  Check,
  HelpCircle,
  BookOpen,
} from "lucide-react";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";
type AuthType = "none" | "apiKey" | "bearer";
type ParamType = "string" | "number" | "boolean" | "integer";

type ParamLocation = "query" | "path";

interface FlowParameter {
  id: string;
  name: string;
  type: ParamType;
  required: boolean;
  description?: string;
  example?: string; // Optional example value for the parameter
  in: ParamLocation; // 'path' for URL path params like {id}, 'query' for ?param=value
}

interface FlowBodyProperty {
  id: string;
  name: string;
  type: ParamType;
  description: string;
  example: string;
}

// Response property for defining response schema
interface FlowResponseProperty {
  id: string;
  name: string;
  type: ParamType;
  description: string;
  example: string;
}

// Response definition for each HTTP status code
interface FlowResponse {
  id: string;
  statusCode: string; // "200", "201", "400", "401", "404", "500"
  description: string;
  properties: FlowResponseProperty[];
}

interface FlowAuth {
  type: AuthType;
  apiKeyName?: string;
  apiKeyValue?: string;
  bearerToken?: string;
}

// Nuevo: Cada endpoint tiene su propio método, ruta, parámetros y body
interface FlowEndpoint {
  id: string;
  name: string;
  description?: string;
  method: HttpMethod;
  path: string;
  parameters: FlowParameter[];
  bodyProperties: FlowBodyProperty[];
  responses: FlowResponse[];
}

interface Flow {
  id: string;
  name: string;
  description: string;
  baseUrl: string;
  auth: FlowAuth;
  // Mantenemos los campos legacy para compatibilidad, pero usamos endpoints como principal
  method?: HttpMethod;
  path?: string;
  parameters?: FlowParameter[];
  bodyProperties?: FlowBodyProperty[];
  // Nuevo: Array de endpoints
  endpoints: FlowEndpoint[];
  createdAt: string;
  updatedAt: string;
}

interface OpenAPISchema {
  openapi: string;
  info: {
    title: string;
    description: string;
    version: string;
  };
  servers: Array<{ url: string }>;
  paths: Record<string, Record<string, unknown>>;
  components?: {
    securitySchemes?: Record<string, unknown>;
    schemas?: Record<string, unknown>;
  };
}

// ============================================================================
// CUSTOM HOOK: useFlowsStorage
// Simula persistencia con localStorage. Preparado para migración a API real.
// ============================================================================

function useFlowsStorage() {
  const STORAGE_KEY = "conversational_flows";
  const [flows, setFlows] = useState<Flow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Cargar flujos al iniciar
  useEffect(() => {
    // TODO: Reemplazar con llamada real a API (GET /api/flows)
    const loadFlows = () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          setFlows(JSON.parse(stored));
        }
      } catch (error) {
        console.error("Error loading flows:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadFlows();
  }, []);

  // Guardar flujo (crear o actualizar)
  const saveFlow = useCallback((flow: Omit<Flow, "id" | "createdAt" | "updatedAt"> & { id?: string }) => {
    // TODO: Reemplazar con llamada real a API (POST /api/flows o PUT /api/flows/:id)
    setFlows((prev) => {
      const now = new Date().toISOString();
      let updated: Flow[];

      if (flow.id) {
        // Actualizar existente
        updated = prev.map((f) =>
          f.id === flow.id
            ? { ...f, ...flow, updatedAt: now } as Flow
            : f
        );
      } else {
        // Crear nuevo
        const newFlow: Flow = {
          ...flow,
          id: crypto.randomUUID(),
          createdAt: now,
          updatedAt: now,
        } as Flow;
        updated = [...prev, newFlow];
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Eliminar flujo
  const deleteFlow = useCallback((id: string) => {
    // TODO: Reemplazar con llamada real a API (DELETE /api/flows/:id)
    setFlows((prev) => {
      const updated = prev.filter((f) => f.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Obtener flujo por ID
  const getFlow = useCallback((id: string): Flow | undefined => {
    // TODO: Reemplazar con llamada real a API (GET /api/flows/:id)
    return flows.find((f) => f.id === id);
  }, [flows]);

  return { flows, isLoading, saveFlow, deleteFlow, getFlow };
}

// ============================================================================
// UTILITY: Generador de OpenAPI Schema
// ============================================================================

function generateOpenAPISchema(flow: Partial<Flow>): OpenAPISchema {
  const schema: OpenAPISchema = {
    openapi: "3.0.3",
    info: {
      title: flow.name || "API sin nombre",
      description: flow.description || "",
      version: "1.0.0",
    },
    servers: [{ url: flow.baseUrl || "https://api.example.com" }],
    paths: {},
    components: {},
  };

  // Security Schemes
  if (flow.auth?.type === "apiKey") {
    schema.components!.securitySchemes = {
      ApiKeyAuth: {
        type: "apiKey",
        in: "header",
        name: flow.auth.apiKeyName || "X-API-Key",
      },
    };
  } else if (flow.auth?.type === "bearer") {
    schema.components!.securitySchemes = {
      BearerAuth: {
        type: "http",
        scheme: "bearer",
      },
    };
  }

  // Generate paths from endpoints array
  const endpoints = flow.endpoints || [];
  
  endpoints.forEach((endpoint) => {
    if (!endpoint.path || !endpoint.method) return;
    
    const pathKey = endpoint.path.startsWith("/") ? endpoint.path : `/${endpoint.path}`;
    const operation: Record<string, unknown> = {
      summary: endpoint.name || flow.name,
      description: endpoint.description || "",
      operationId: (endpoint.name || endpoint.path)?.toLowerCase().replace(/[^a-z0-9]+/g, "_") || "operation",
    };

    // Security
    if (flow.auth?.type === "apiKey") {
      operation.security = [{ ApiKeyAuth: [] }];
    } else if (flow.auth?.type === "bearer") {
      operation.security = [{ BearerAuth: [] }];
    }

    // Extract path parameters from the route (e.g., /users/{id} -> id)
    const pathParamMatches = pathKey.match(/\{([^}]+)\}/g) || [];
    const pathParamNames = pathParamMatches.map(match => match.slice(1, -1));
    
    // Build parameters array combining path params and query params
    const allParameters: Array<{
      name: string;
      in: string;
      required: boolean;
      description: string;
      schema: { type: string };
      example?: string | number | boolean;
    }> = [];
    
    // Helper to generate example value based on type
    const getExampleValue = (type: string, customExample?: string): string | number | boolean | undefined => {
      if (customExample) {
        if (type === 'integer') return parseInt(customExample) || 0;
        if (type === 'number') return parseFloat(customExample) || 0;
        if (type === 'boolean') return customExample.toLowerCase() === 'true';
        return customExample;
      }
      return undefined;
    };
    
    // Add path parameters (always required)
    pathParamNames.forEach(paramName => {
      const definedParam = endpoint.parameters?.find(p => p.name === paramName && p.in === 'path');
      const paramType = definedParam?.type === 'integer' ? 'integer' : (definedParam?.type || 'string');
      const exampleValue = getExampleValue(paramType, definedParam?.example);
      
      allParameters.push({
        name: paramName,
        in: 'path',
        required: true, // Path params are always required in OpenAPI
        description: definedParam?.description || `Path parameter: ${paramName}`,
        schema: { type: paramType },
        ...(exampleValue !== undefined && { example: exampleValue }),
      });
    });
    
    // Add query parameters
    if (endpoint.parameters && endpoint.parameters.length > 0) {
      endpoint.parameters
        .filter(param => param.in === 'query' || !param.in) // Default to query if not specified
        .forEach(param => {
          const exampleValue = getExampleValue(param.type, param.example);
          allParameters.push({
            name: param.name,
            in: 'query',
            required: param.required,
            description: param.description || '',
            schema: { type: param.type === 'integer' ? 'integer' : param.type },
            ...(exampleValue !== undefined && { example: exampleValue }),
          });
        });
    }
    
    if (allParameters.length > 0) {
      operation.parameters = allParameters;
    }

    // Request Body (solo para POST/PUT)
    if ((endpoint.method === "POST" || endpoint.method === "PUT") && endpoint.bodyProperties && endpoint.bodyProperties.length > 0) {
      const properties: Record<string, { type: string; description: string; example: string | number | boolean }> = {};
      const required: string[] = [];

      endpoint.bodyProperties.forEach((prop) => {
        // Generate example value based on type if not provided
        let exampleValue: string | number | boolean = prop.example || '';
        if (prop.type === 'number') {
          exampleValue = parseFloat(prop.example) || 0;
        } else if (prop.type === 'integer') {
          exampleValue = parseInt(prop.example) || 0;
        } else if (prop.type === 'boolean') {
          exampleValue = prop.example?.toLowerCase() === 'true';
        }

        properties[prop.name] = {
          type: prop.type === "integer" ? "integer" : prop.type,
          description: prop.description || '',
          example: exampleValue,
        };
        // All body properties are required
        required.push(prop.name);
      });

      operation.requestBody = {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties,
              required: required.length > 0 ? required : undefined,
            },
          },
        },
      };
    }

    // Responses
    const responses: Record<string, {
      description: string;
      content?: {
        "application/json": {
          schema: {
            type: string;
            properties?: Record<string, { type: string; description: string; example?: string | number | boolean }>;
          };
        };
      };
    }> = {};

    // Generate responses from custom responses or use defaults
    if (endpoint.responses && endpoint.responses.length > 0) {
      endpoint.responses.forEach((response) => {
        const responseObj: {
          description: string;
          content?: {
            "application/json": {
              schema: {
                type: string;
                properties?: Record<string, { type: string; description: string; example?: string | number | boolean }>;
              };
            };
          };
        } = {
          description: response.description || "Response",
        };

        // Add properties if defined
        if (response.properties && response.properties.length > 0) {
          const properties: Record<string, { type: string; description: string; example?: string | number | boolean }> = {};
          
          response.properties.forEach((prop) => {
            let exampleValue: string | number | boolean | undefined = prop.example || undefined;
            if (prop.type === 'number' && prop.example) {
              exampleValue = parseFloat(prop.example) || 0;
            } else if (prop.type === 'integer' && prop.example) {
              exampleValue = parseInt(prop.example) || 0;
            } else if (prop.type === 'boolean' && prop.example) {
              exampleValue = prop.example?.toLowerCase() === 'true';
            }

            properties[prop.name] = {
              type: prop.type === "integer" ? "integer" : prop.type,
              description: prop.description || "",
              ...(exampleValue !== undefined && { example: exampleValue }),
            };
          });

          responseObj.content = {
            "application/json": {
              schema: {
                type: "object",
                properties,
              },
            },
          };
        } else {
          // If no properties, just add a simple schema
          responseObj.content = {
            "application/json": {
              schema: { type: "object" },
            },
          };
        }

        responses[response.statusCode] = responseObj;
      });
    } else {
      // Default responses if none defined
      responses["200"] = {
        description: "Respuesta exitosa",
        content: {
          "application/json": {
            schema: { type: "object" },
          },
        },
      };
      responses["400"] = { description: "Solicitud inválida" };
      responses["401"] = { description: "No autorizado" };
      responses["500"] = { description: "Error del servidor" };
    }

    operation.responses = responses;

    // Add to paths (merge if path already exists with different method)
    if (!schema.paths[pathKey]) {
      schema.paths[pathKey] = {};
    }
    schema.paths[pathKey][endpoint.method.toLowerCase()] = operation;
  });

  return schema;
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

// Tooltip Component
function Tooltip({ text }: { text: string }) {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const tooltipWidth = 256; // w-64 = 16rem = 256px
    const viewportWidth = window.innerWidth;
    
    // Calculate position - prefer right side, but flip to left if not enough space
    let left = rect.right + 8;
    if (left + tooltipWidth > viewportWidth - 16) {
      left = rect.left - tooltipWidth - 8;
    }
    
    // Center vertically relative to the button
    const top = rect.top + rect.height / 2 - 40;
    
    setPosition({ top: Math.max(8, top), left: Math.max(8, left) });
    setIsVisible(true);
  };

  return (
    <div className="relative inline-flex items-center">
      <button
        type="button"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setIsVisible(false)}
        onClick={(e) => {
          if (!isVisible) {
            handleMouseEnter(e);
          } else {
            setIsVisible(false);
          }
        }}
        className="p-1 text-gray-400 hover:text-orange-500 transition-colors"
      >
        <HelpCircle className="w-4 h-4" />
      </button>
      {isVisible && (
        <div 
          className="fixed z-9999 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl animate-fade-in"
          style={{ top: position.top, left: position.left }}
        >
          <p className="leading-relaxed">{text}</p>
        </div>
      )}
    </div>
  );
}

// Notification Toast
function Toast({ message, type, onClose }: { message: string; type: "success" | "error"; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg animate-slide-in ${
      type === "success" 
        ? "bg-green-500 text-white" 
        : "bg-red-500 text-white"
    }`}>
      {type === "success" ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
      <span className="font-medium">{message}</span>
      <button onClick={onClose} className="ml-2 hover:opacity-70">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

// Help Accordion Component - Documentation Guide
function HelpAccordion() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden text-xs">
      {/* Accordion Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
          <BookOpen className="w-4 h-4 text-orange-500" />
          <span className="font-medium">Guía Rápida</span>
        </div>
        <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? "rotate-90" : ""}`} />
      </button>

      {/* Accordion Content */}
      {isOpen && (
        <div className="p-4 space-y-4 bg-white dark:bg-gray-900/30 animate-fade-in">
          {/* Section: What are Endpoints */}
          <div className="space-y-2">
            <h4 className="font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
              ¿Qué es un Endpoint?
            </h4>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed pl-3">
              Un endpoint es una <strong className="text-blue-600 dark:text-blue-400">ruta específica</strong> dentro de un servicio 
              que realiza una acción. Por ejemplo, <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">/productos</code> para 
              obtener productos o <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">/pedidos</code> para crear pedidos.
            </p>
          </div>

          {/* Section: HTTP Methods */}
          <div className="space-y-2">
            <h4 className="font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              Métodos HTTP
            </h4>
            <div className="grid grid-cols-2 gap-2 pl-3">
              <div className="flex items-center gap-2">
                <span className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 font-bold">GET</span>
                <span className="text-gray-600 dark:text-gray-400">Consultar datos</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 font-bold">POST</span>
                <span className="text-gray-600 dark:text-gray-400">Crear nuevo</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-1.5 py-0.5 rounded bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-400 font-bold">PUT</span>
                <span className="text-gray-600 dark:text-gray-400">Actualizar</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 font-bold">DELETE</span>
                <span className="text-gray-600 dark:text-gray-400">Eliminar</span>
              </div>
            </div>
          </div>

          {/* Section: Dynamic Parameters */}
          <div className="space-y-2">
            <h4 className="font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
              Parámetros Dinámicos en Rutas
            </h4>
            <div className="pl-3 space-y-2">
              <p className="text-gray-600 dark:text-gray-400">
                Usa llaves <code className="bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 px-1.5 py-0.5 rounded font-mono">{"{nombre}"}</code> para 
                valores que cambian en cada petición.
              </p>
              
              {/* Examples box */}
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-2.5 space-y-1.5">
                <p className="text-gray-500 dark:text-gray-400 text-xs font-medium">Ejemplos:</p>
                <div className="space-y-1">
                  <code className="block text-xs bg-white dark:bg-gray-800 px-2 py-1 rounded border border-gray-200 dark:border-gray-700">
                    <span className="text-gray-500">/productos/</span>
                    <span className="text-orange-600 dark:text-orange-400 font-semibold">{"{id}"}</span>
                  </code>
                  <code className="block text-xs bg-white dark:bg-gray-800 px-2 py-1 rounded border border-gray-200 dark:border-gray-700">
                    <span className="text-gray-500">/usuarios/</span>
                    <span className="text-orange-600 dark:text-orange-400 font-semibold">{"{userId}"}</span>
                    <span className="text-gray-500">/pedidos/</span>
                    <span className="text-orange-600 dark:text-orange-400 font-semibold">{"{orderId}"}</span>
                  </code>
                  <code className="block text-xs bg-white dark:bg-gray-800 px-2 py-1 rounded border border-gray-200 dark:border-gray-700">
                    <span className="text-gray-500">/categorias/</span>
                    <span className="text-orange-600 dark:text-orange-400 font-semibold">{"{categoria}"}</span>
                    <span className="text-gray-500">/items</span>
                  </code>
                </div>
              </div>

              {/* Auto-detection note */}
              <div className="flex items-start gap-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg p-2 mt-2">
                <span className="text-orange-500">✨</span>
                <p className="text-xs text-orange-700 dark:text-orange-300">
                  <strong>Detección automática:</strong> Al escribir <code className="bg-orange-100 dark:bg-orange-800/50 px-1 rounded">{"{param}"}</code> en 
                  la ruta, aparecerá automáticamente un panel para configurar el tipo de dato.
                </p>
              </div>
            </div>
          </div>

          {/* Section: Body */}
          <div className="space-y-2">
            <h4 className="font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
              Cuerpo (Body)
            </h4>
            <p className="text-gray-600 dark:text-gray-400 pl-3">
              Para <span className="text-green-600 dark:text-green-400 font-medium">POST</span> y <span className="text-orange-600 dark:text-orange-400 font-medium">PUT</span>, 
              define los campos JSON que se enviarán. Cada campo necesita nombre, tipo, descripción y ejemplo.
            </p>
          </div>

          {/* Section: Example Flow */}
          <div className="space-y-3 border-t border-gray-200 dark:border-gray-700 pt-4">
            <h4 className="font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
              Ejemplo: Flujo "Consultar Calificaciones"
            </h4>
            
            {/* Example Flow Card */}
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 space-y-3">
              {/* Step 1: General */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full font-medium">Paso 1</span>
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">General</span>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-2.5 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 w-20">Nombre:</span>
                    <span className="text-xs font-medium text-gray-800 dark:text-gray-200">Consultar Calificaciones</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 w-20">URL Base:</span>
                    <code className="text-xs bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-blue-600 dark:text-blue-400">https://api.universidad.edu</code>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 w-20">Auth:</span>
                    <span className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded">API Key</span>
                    <span className="text-xs text-gray-400">X-API-Key</span>
                  </div>
                </div>
              </div>

              {/* Step 2: Endpoints */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full font-medium">Paso 2</span>
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Endpoints</span>
                </div>
                
                {/* Endpoint 1: GET */}
                <div className="bg-white dark:bg-gray-800 rounded border border-emerald-200 dark:border-emerald-800/50 p-2.5 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 text-xs font-bold">GET</span>
                    <code className="text-xs text-gray-600 dark:text-gray-300">/alumnos/<span className="text-orange-600 dark:text-orange-400 font-semibold">{"{matricula}"}</span>/calificaciones</code>
                  </div>
                  <div className="pl-2 border-l-2 border-orange-300 dark:border-orange-700">
                    <p className="text-xs text-gray-500">Parámetro detectado:</p>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 px-1.5 py-0.5 rounded">{"{matricula}"}</code>
                      <span className="text-xs text-gray-400">→ Texto</span>
                    </div>
                  </div>
                </div>

                {/* Endpoint 2: POST */}
                <div className="bg-white dark:bg-gray-800 rounded border border-amber-200 dark:border-amber-800/50 p-2.5 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 text-xs font-bold">POST</span>
                    <code className="text-xs text-gray-600 dark:text-gray-300">/calificaciones</code>
                  </div>
                  <div className="pl-2 border-l-2 border-amber-300 dark:border-amber-700">
                    <p className="text-xs text-gray-500">Body (JSON):</p>
                    <div className="mt-1 space-y-1 text-xs">
                      <div className="flex items-center gap-2">
                        <code className="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">matricula</code>
                        <span className="text-gray-400">texto</span>
                        <span className="text-gray-300">|</span>
                        <span className="text-gray-500 italic">"A12345"</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <code className="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">materia</code>
                        <span className="text-gray-400">texto</span>
                        <span className="text-gray-300">|</span>
                        <span className="text-gray-500 italic">"Matemáticas"</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <code className="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">calificacion</code>
                        <span className="text-gray-400">número</span>
                        <span className="text-gray-300">|</span>
                        <span className="text-gray-500 italic">95</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Endpoint 3: PUT */}
                <div className="bg-white dark:bg-gray-800 rounded border border-sky-200 dark:border-sky-800/50 p-2.5 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-400 text-xs font-bold">PUT</span>
                    <code className="text-xs text-gray-600 dark:text-gray-300">/calificaciones/<span className="text-orange-600 dark:text-orange-400 font-semibold">{"{id}"}</span></code>
                  </div>
                  <p className="text-xs text-gray-400 italic">Actualizar calificación existente</p>
                </div>

                {/* Endpoint 4: DELETE */}
                <div className="bg-white dark:bg-gray-800 rounded border border-red-200 dark:border-red-800/50 p-2.5">
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 text-xs font-bold">DELETE</span>
                    <code className="text-xs text-gray-600 dark:text-gray-300">/calificaciones/<span className="text-orange-600 dark:text-orange-400 font-semibold">{"{id}"}</span></code>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tip Box */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/30 rounded-lg p-2.5">
            <p className="text-blue-700 dark:text-blue-400 flex items-start gap-1.5 text-xs">
              <span>💡</span>
              <span>Puedes agregar múltiples endpoints a un mismo flujo para cubrir todas las operaciones del servicio.</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// Delete Confirmation Modal
function DeleteModal({ flowName, onConfirm, onCancel }: { flowName: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full">
            <Trash2 className="w-6 h-6 text-red-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Eliminar Flujo</h3>
        </div>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          ¿Estás seguro de que deseas eliminar <strong>"{flowName}"</strong>? Esta acción no se puede deshacer.
        </p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors"
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
}

// Help Accordion for Responses Step
function ResponsesHelpAccordion() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden text-xs">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
          <BookOpen className="w-4 h-4 text-orange-500" />
          <span className="font-medium">Guía Rápida</span>
        </div>
        <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? "rotate-90" : ""}`} />
      </button>
      {isOpen && (
        <div className="p-4 space-y-4 bg-white dark:bg-gray-900/30 animate-fade-in">
          {/* What are Responses */}
          <div className="space-y-2">
            <h4 className="font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
              ¿Qué son las Respuestas?
            </h4>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed pl-3">
              Las respuestas definen qué datos regresa cada endpoint según el <strong className="text-blue-600 dark:text-blue-400">código de estado HTTP</strong>. 
              Esto ayuda al bot a entender qué información puede esperar del servicio.
            </p>
          </div>

          {/* HTTP Status Codes */}
          <div className="space-y-2">
            <h4 className="font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              Códigos de Estado Comunes
            </h4>
            <div className="grid grid-cols-2 gap-2 pl-3">
              <div className="flex items-center gap-2">
                <span className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 font-bold">200</span>
                <span className="text-gray-600 dark:text-gray-400">Éxito (OK)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 font-bold">201</span>
                <span className="text-gray-600 dark:text-gray-400">Creado</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 font-bold">400</span>
                <span className="text-gray-600 dark:text-gray-400">Error de datos</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 font-bold">401</span>
                <span className="text-gray-600 dark:text-gray-400">No autorizado</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 font-bold">404</span>
                <span className="text-gray-600 dark:text-gray-400">No encontrado</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 font-bold">500</span>
                <span className="text-gray-600 dark:text-gray-400">Error servidor</span>
              </div>
            </div>
          </div>

          {/* Example */}
          <div className="space-y-2 border-t border-gray-200 dark:border-gray-700 pt-4">
            <h4 className="font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
              Ejemplo: GET /usuarios/{"{id}"}
            </h4>
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 space-y-3">
              {/* 200 Response */}
              <div className="bg-white dark:bg-gray-800 rounded border border-emerald-200 dark:border-emerald-800/50 p-2.5">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 text-xs font-bold">200</span>
                  <span className="text-xs text-gray-600 dark:text-gray-400">Usuario encontrado</span>
                </div>
                <div className="space-y-1 text-xs pl-2">
                  <div className="flex items-center gap-2">
                    <code className="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">id</code>
                    <span className="text-gray-400">entero</span>
                    <span className="text-gray-500 italic">"123"</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">nombre</code>
                    <span className="text-gray-400">texto</span>
                    <span className="text-gray-500 italic">"Juan Pérez"</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">email</code>
                    <span className="text-gray-400">texto</span>
                    <span className="text-gray-500 italic">"juan@email.com"</span>
                  </div>
                </div>
              </div>
              {/* 404 Response */}
              <div className="bg-white dark:bg-gray-800 rounded border border-red-200 dark:border-red-800/50 p-2.5">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 text-xs font-bold">404</span>
                  <span className="text-xs text-gray-600 dark:text-gray-400">Usuario no encontrado</span>
                </div>
                <div className="space-y-1 text-xs pl-2">
                  <div className="flex items-center gap-2">
                    <code className="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">error</code>
                    <span className="text-gray-400">texto</span>
                    <span className="text-gray-500 italic">"Usuario no existe"</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tip */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/30 rounded-lg p-2.5">
            <p className="text-blue-700 dark:text-blue-400 flex items-start gap-1.5 text-xs">
              <span>💡</span>
              <span>Configura al menos la respuesta <strong>200 (éxito)</strong> para cada endpoint. Las respuestas de error son opcionales pero recomendadas.</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// Step 3: Responses Configuration
function Step3Responses({
  data,
  onChange,
  errors,
}: {
  data: Partial<Flow>;
  onChange: (updates: Partial<Flow>) => void;
  errors: Record<string, string>;
}) {
  const [expandedEndpoint, setExpandedEndpoint] = useState<string | null>(null);
  const [expandedResponse, setExpandedResponse] = useState<string | null>(null);
  const [responseToDelete, setResponseToDelete] = useState<{ endpointId: string; responseId: string; statusCode: string } | null>(null);

  // Available HTTP status codes
  const statusCodes = [
    { code: "200", label: "200 - OK", description: "Solicitud exitosa", color: "emerald" },
    { code: "201", label: "201 - Creado", description: "Recurso creado exitosamente", color: "emerald" },
    { code: "400", label: "400 - Error de Solicitud", description: "Datos inválidos o mal formados", color: "amber" },
    { code: "401", label: "401 - No Autorizado", description: "Falta autenticación", color: "amber" },
    { code: "403", label: "403 - Prohibido", description: "Sin permisos suficientes", color: "amber" },
    { code: "404", label: "404 - No Encontrado", description: "El recurso no existe", color: "red" },
    { code: "500", label: "500 - Error del Servidor", description: "Error interno del servicio", color: "red" },
  ];

  const colorClasses: Record<string, { bg: string; border: string; text: string }> = {
    emerald: {
      bg: "bg-emerald-100 dark:bg-emerald-900/40",
      border: "border-emerald-200 dark:border-emerald-800/50",
      text: "text-emerald-700 dark:text-emerald-400",
    },
    amber: {
      bg: "bg-amber-100 dark:bg-amber-900/40",
      border: "border-amber-200 dark:border-amber-800/50",
      text: "text-amber-700 dark:text-amber-400",
    },
    red: {
      bg: "bg-red-100 dark:bg-red-900/40",
      border: "border-red-200 dark:border-red-800/50",
      text: "text-red-700 dark:text-red-400",
    },
  };

  const getStatusCodeColor = (code: string) => {
    const found = statusCodes.find((s) => s.code === code);
    return found?.color || "emerald";
  };

  // Add response to endpoint
  const addResponse = (endpointId: string) => {
    const endpoint = data.endpoints?.find((ep) => ep.id === endpointId);
    if (!endpoint) return;

    // Find first status code not yet used
    const usedCodes = endpoint.responses?.map((r) => r.statusCode) || [];
    const availableCode = statusCodes.find((s) => !usedCodes.includes(s.code));
    
    const newResponse: FlowResponse = {
      id: crypto.randomUUID(),
      statusCode: availableCode?.code || "200",
      description: "",
      properties: [],
    };

    const updatedResponses = [...(endpoint.responses || []), newResponse];
    onChange({
      endpoints: data.endpoints?.map((ep) =>
        ep.id === endpointId ? { ...ep, responses: updatedResponses } : ep
      ),
    });
    setExpandedResponse(newResponse.id);
  };

  // Update response
  const updateResponse = (endpointId: string, responseId: string, updates: Partial<FlowResponse>) => {
    onChange({
      endpoints: data.endpoints?.map((ep) =>
        ep.id === endpointId
          ? {
              ...ep,
              responses: ep.responses?.map((r) =>
                r.id === responseId ? { ...r, ...updates } : r
              ),
            }
          : ep
      ),
    });
  };

  // Remove response
  const removeResponse = (endpointId: string, responseId: string) => {
    onChange({
      endpoints: data.endpoints?.map((ep) =>
        ep.id === endpointId
          ? { ...ep, responses: ep.responses?.filter((r) => r.id !== responseId) }
          : ep
      ),
    });
  };

  // Add property to response
  const addResponseProperty = (endpointId: string, responseId: string) => {
    const endpoint = data.endpoints?.find((ep) => ep.id === endpointId);
    const response = endpoint?.responses?.find((r) => r.id === responseId);
    if (!response) return;

    const newProperty: FlowResponseProperty = {
      id: crypto.randomUUID(),
      name: "",
      type: "string",
      description: "",
      example: "",
    };

    updateResponse(endpointId, responseId, {
      properties: [...(response.properties || []), newProperty],
    });
  };

  // Update property
  const updateResponseProperty = (
    endpointId: string,
    responseId: string,
    propertyId: string,
    updates: Partial<FlowResponseProperty>
  ) => {
    const endpoint = data.endpoints?.find((ep) => ep.id === endpointId);
    const response = endpoint?.responses?.find((r) => r.id === responseId);
    if (!response) return;

    updateResponse(endpointId, responseId, {
      properties: response.properties.map((p) =>
        p.id === propertyId ? { ...p, ...updates } : p
      ),
    });
  };

  // Remove property
  const removeResponseProperty = (endpointId: string, responseId: string, propertyId: string) => {
    const endpoint = data.endpoints?.find((ep) => ep.id === endpointId);
    const response = endpoint?.responses?.find((r) => r.id === responseId);
    if (!response) return;

    updateResponse(endpointId, responseId, {
      properties: response.properties.filter((p) => p.id !== propertyId),
    });
  };

  const endpoints = data.endpoints || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-500/10 rounded-lg">
              <FileJson className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                Respuestas de Endpoints
                <span className="text-xs font-normal text-red-500 bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded">* Requerido</span>
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Define qué datos regresa cada endpoint según el código de estado
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Error */}
      {errors.responses && (
        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-lg">
          <AlertCircle className="w-4 h-4 text-red-500" />
          <span className="text-sm text-red-600 dark:text-red-400">{errors.responses}</span>
        </div>
      )}

      {/* Endpoints List */}
      {endpoints.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <Route className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No hay endpoints configurados.</p>
          <p className="text-sm">Vuelve al paso anterior para agregar endpoints.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {endpoints.map((endpoint) => {
            const isExpanded = expandedEndpoint === endpoint.id;
            const responsesCount = endpoint.responses?.length || 0;

            return (
              <div
                key={endpoint.id}
                className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden"
              >
                {/* Endpoint Header */}
                <button
                  onClick={() => setExpandedEndpoint(isExpanded ? null : endpoint.id)}
                  className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <MethodBadge method={endpoint.method} />
                    <code className="text-sm font-mono text-gray-700 dark:text-gray-300">
                      {endpoint.path || "/"}
                    </code>
                    {endpoint.name && (
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        ({endpoint.name})
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      responsesCount > 0
                        ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                    }`}>
                      {responsesCount} respuesta{responsesCount !== 1 ? "s" : ""}
                    </span>
                    <ChevronRight
                      className={`w-5 h-5 text-gray-400 transition-transform ${
                        isExpanded ? "rotate-90" : ""
                      }`}
                    />
                  </div>
                </button>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="p-4 space-y-4 animate-fade-in">
                    {/* Responses List */}
                    {(endpoint.responses || []).map((response) => {
                      const isResponseExpanded = expandedResponse === response.id;
                      const statusColor = getStatusCodeColor(response.statusCode);
                      const colors = colorClasses[statusColor];

                      return (
                        <div
                          key={response.id}
                          className={`border ${colors.border} rounded-lg overflow-hidden`}
                        >
                          {/* Response Header */}
                          <div
                            className={`flex items-center justify-between p-3 ${colors.bg}`}
                          >
                            <button
                              onClick={() => setExpandedResponse(isResponseExpanded ? null : response.id)}
                              className="flex items-center gap-3 flex-1"
                            >
                              <span className={`px-2 py-1 rounded font-bold text-sm ${colors.bg} ${colors.text}`}>
                                {response.statusCode}
                              </span>
                              <span className="text-sm text-gray-700 dark:text-gray-300">
                                {response.description || statusCodes.find((s) => s.code === response.statusCode)?.description || "Sin descripción"}
                              </span>
                              {response.properties.length > 0 && (
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  ({response.properties.length} campo{response.properties.length !== 1 ? "s" : ""})
                                </span>
                              )}
                            </button>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setExpandedResponse(isResponseExpanded ? null : response.id)}
                                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                              >
                                <ChevronRight className={`w-4 h-4 transition-transform ${isResponseExpanded ? "rotate-90" : ""}`} />
                              </button>
                              <button
                                onClick={() => setResponseToDelete({ endpointId: endpoint.id, responseId: response.id, statusCode: response.statusCode })}
                                className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                                title="Eliminar respuesta"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          {/* Response Expanded Content */}
                          {isResponseExpanded && (
                            <div className="p-4 space-y-4 bg-white dark:bg-gray-900/30 animate-fade-in">
                              {/* Status Code & Description */}
                              <div className="flex gap-4">
                                <div className="w-48">
                                  <label className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                                    Código <span className="text-red-500">*</span>
                                  </label>
                                  <div className="relative">
                                    <select
                                      value={response.statusCode}
                                      onChange={(e) => updateResponse(endpoint.id, response.id, { statusCode: e.target.value })}
                                      className={`w-full px-3 py-2 rounded-lg border text-sm font-medium appearance-none cursor-pointer pr-8 ${
                                        response.statusCode.startsWith('2') 
                                          ? 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-400'
                                          : response.statusCode.startsWith('4') && response.statusCode !== '500'
                                            ? 'bg-amber-50 dark:bg-amber-900/30 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400'
                                            : 'bg-red-50 dark:bg-red-900/30 border-red-300 dark:border-red-700 text-red-700 dark:text-red-400'
                                      }`}
                                    >
                                      <optgroup label="✓ Éxito">
                                        {statusCodes.filter(sc => sc.color === 'emerald').map((sc) => (
                                          <option key={sc.code} value={sc.code}>
                                            {sc.label}
                                          </option>
                                        ))}
                                      </optgroup>
                                      <optgroup label="⚠ Cliente">
                                        {statusCodes.filter(sc => sc.color === 'amber').map((sc) => (
                                          <option key={sc.code} value={sc.code}>
                                            {sc.label}
                                          </option>
                                        ))}
                                      </optgroup>
                                      <optgroup label="✕ Servidor">
                                        {statusCodes.filter(sc => sc.color === 'red').map((sc) => (
                                          <option key={sc.code} value={sc.code}>
                                            {sc.label}
                                          </option>
                                        ))}
                                      </optgroup>
                                    </select>
                                    <ChevronRight className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 rotate-90 pointer-events-none text-gray-400" />
                                  </div>
                                </div>
                                <div className="flex-1">
                                  <label className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                                    Descripción <span className="text-red-500">*</span>
                                    <Tooltip text="Describe brevemente qué significa esta respuesta, por ejemplo: 'Usuario encontrado exitosamente' o 'Usuario no existe en el sistema'." />
                                  </label>
                                  <input
                                    type="text"
                                    value={response.description}
                                    onChange={(e) => updateResponse(endpoint.id, response.id, { description: e.target.value })}
                                    placeholder="ej: Usuario encontrado exitosamente"
                                    className={`w-full px-3 py-2 rounded-lg border ${
                                      !response.description ? 'border-orange-300 dark:border-orange-600' : 'border-gray-200 dark:border-gray-600'
                                    } bg-white dark:bg-gray-800 text-sm`}
                                  />
                                </div>
                              </div>

                              {/* Properties Section */}
                              <div className="border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
                                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50">
                                  <div className="flex items-center gap-2">
                                    <FileJson className="w-4 h-4 text-purple-500" />
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                      Campos de la Respuesta
                                    </span>
                                    <Tooltip text="Define los campos que el servicio regresa en esta respuesta. Cada campo necesita nombre, tipo, descripción y un ejemplo del valor." />
                                    {response.properties.length > 0 && (
                                      <span className="bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-xs px-1.5 py-0.5 rounded-full">
                                        {response.properties.length}
                                      </span>
                                    )}
                                  </div>
                                  <button
                                    onClick={() => addResponseProperty(endpoint.id, response.id)}
                                    className="text-xs text-purple-500 hover:text-purple-600 font-medium flex items-center gap-1"
                                  >
                                    <Plus className="w-3 h-3" /> Agregar Campo
                                  </button>
                                </div>

                                {response.properties.length > 0 && (
                                  <div className="p-3 space-y-3">
                                    {response.properties.map((prop, propIndex) => (
                                      <div key={prop.id} className="border border-gray-100 dark:border-gray-700 rounded-lg p-3 bg-white dark:bg-gray-800/30">
                                        <div className="flex items-center justify-between mb-2">
                                          <span className="text-xs font-medium text-gray-500">Campo #{propIndex + 1}</span>
                                          <button
                                            onClick={() => removeResponseProperty(endpoint.id, response.id, prop.id)}
                                            className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                                            title="Eliminar campo"
                                          >
                                            <X className="w-4 h-4" />
                                          </button>
                                        </div>

                                        {/* Row 1: Name and Type */}
                                        <div className="flex gap-2 mb-2">
                                          <div className="flex-1">
                                            <label className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                                              Nombre del campo <span className="text-red-500">*</span>
                                              <Tooltip text="El nombre técnico del campo tal como lo regresa el servicio, por ejemplo: 'id', 'nombre', 'email'." />
                                            </label>
                                            <input
                                              type="text"
                                              value={prop.name}
                                              onChange={(e) => updateResponseProperty(endpoint.id, response.id, prop.id, { name: e.target.value })}
                                              placeholder="ej: id, nombre, email"
                                              className="w-full px-3 py-1.5 rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm"
                                            />
                                          </div>
                                          <div className="w-32">
                                            <label className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                                              Tipo <span className="text-red-500">*</span>
                                              <Tooltip text="El tipo de dato que regresa este campo." />
                                            </label>
                                            <select
                                              value={prop.type}
                                              onChange={(e) => updateResponseProperty(endpoint.id, response.id, prop.id, { type: e.target.value as ParamType })}
                                              className="w-full px-2 py-1.5 rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm"
                                            >
                                              <option value="string">Texto</option>
                                              <option value="number">Número</option>
                                              <option value="integer">Entero</option>
                                              <option value="boolean">Sí/No</option>
                                            </select>
                                          </div>
                                        </div>

                                        {/* Row 2: Description */}
                                        <div className="mb-2">
                                          <label className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                                            Descripción <span className="text-red-500">*</span>
                                            <Tooltip text="Explica qué representa este campo, por ejemplo: 'Identificador único del usuario' o 'Correo electrónico registrado'." />
                                          </label>
                                          <input
                                            type="text"
                                            value={prop.description}
                                            onChange={(e) => updateResponseProperty(endpoint.id, response.id, prop.id, { description: e.target.value })}
                                            placeholder="ej: Identificador único del recurso"
                                            className={`w-full px-3 py-1.5 rounded border ${
                                              !prop.description ? 'border-orange-300 dark:border-orange-600' : 'border-gray-200 dark:border-gray-600'
                                            } bg-white dark:bg-gray-800 text-sm`}
                                          />
                                        </div>

                                        {/* Row 3: Example */}
                                        <div>
                                          <label className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                                            Ejemplo <span className="text-red-500">*</span>
                                            <span className="text-gray-400 ml-1">
                                              {prop.type === 'string' && '(texto)'}
                                              {prop.type === 'number' && '(decimal, ej: 99.99)'}
                                              {prop.type === 'integer' && '(entero, ej: 42)'}
                                              {prop.type === 'boolean' && '(true o false)'}
                                            </span>
                                            <Tooltip text="Un valor de ejemplo que podría regresar este campo." />
                                          </label>
                                          <input
                                            type="text"
                                            value={prop.example}
                                            onChange={(e) => updateResponseProperty(endpoint.id, response.id, prop.id, { example: e.target.value })}
                                            placeholder={
                                              prop.type === 'string' ? 'ej: Juan Pérez, usuario@email.com' :
                                              prop.type === 'number' ? 'ej: 99.99' :
                                              prop.type === 'integer' ? 'ej: 123' :
                                              'ej: true'
                                            }
                                            className={`w-full px-3 py-1.5 rounded border ${
                                              !prop.example ? 'border-orange-300 dark:border-orange-600' : 'border-gray-200 dark:border-gray-600'
                                            } bg-white dark:bg-gray-800 text-sm font-mono`}
                                          />
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {/* Empty state */}
                                {response.properties.length === 0 && (
                                  <div className="p-3 text-xs text-gray-500 dark:text-gray-400 bg-purple-50 dark:bg-purple-900/10">
                                    💡 Agrega los campos que el servicio regresa en esta respuesta. Por ejemplo: id, nombre, email, etc.
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* Add Response Button */}
                    <button
                      onClick={() => addResponse(endpoint.id)}
                      className="w-full py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-500 dark:text-gray-400 hover:border-purple-500 hover:text-purple-500 transition-colors flex items-center justify-center gap-2 text-sm"
                    >
                      <Plus className="w-4 h-4" />
                      Agregar Respuesta
                    </button>

                    {/* Tip */}
                    {(endpoint.responses?.length || 0) === 0 && (
                      <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-xs text-blue-700 dark:text-blue-300">
                        <span>💡</span>
                        <span>Agrega al menos una respuesta <strong>200 (éxito)</strong> para definir qué datos regresa este endpoint.</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Help Accordion */}
      <ResponsesHelpAccordion />

      {/* Delete Response Confirmation Modal */}
      {responseToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full">
                <Trash2 className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Eliminar Respuesta</h3>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              ¿Estás seguro de que deseas eliminar la respuesta <strong className="font-mono text-orange-600 dark:text-orange-400">{responseToDelete.statusCode}</strong>? Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setResponseToDelete(null)}
                className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  removeResponse(responseToDelete.endpointId, responseToDelete.responseId);
                  setResponseToDelete(null);
                }}
                className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Method Badge (Postman-style colors)
function MethodBadge({ method }: { method: HttpMethod }) {
  const styles: Record<HttpMethod, string> = {
    GET: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400",
    POST: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400",
    PUT: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-400",
    DELETE: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",
  };

  return (
    <span className={`px-2.5 py-1 rounded-md text-xs font-bold tracking-wide ${styles[method]}`}>
      {method}
    </span>
  );
}

// Progress Bar for Wizard
function WizardProgress({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) {
  const steps = [
    { icon: Server, label: "General" },
    { icon: Route, label: "Endpoints" },
    { icon: FileJson, label: "Respuestas" },
    { icon: CheckCircle, label: "Resumen y Guardar" },
  ];

  return (
    <div className="flex items-center justify-center mb-8">
      <div className="flex items-center gap-4">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;

          return (
            <div key={index} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                    isCompleted
                      ? "bg-orange-500 text-white"
                      : isCurrent
                      ? "bg-orange-500/20 text-orange-500 ring-2 ring-orange-500"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-400"
                  }`}
                >
                  {isCompleted ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                </div>
                <span className={`text-xs mt-2 font-medium whitespace-nowrap ${isCurrent ? "text-orange-500" : "text-gray-500"}`}>
                  {step.label}
                </span>
              </div>
              {index < totalSteps - 1 && (
                <div className={`w-16 h-0.5 ml-4 ${isCompleted ? "bg-orange-500" : "bg-gray-200 dark:bg-gray-700"}`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Empty State
function EmptyState({ onCreateNew }: { onCreateNew: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-20 h-20 rounded-full bg-orange-500/10 flex items-center justify-center mb-6">
        <Layers className="w-10 h-10 text-orange-500" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
        No tienes flujos configurados
      </h3>
      <p className="text-gray-500 dark:text-gray-400 text-center max-w-md mb-8">
        Los flujos conversacionales te permiten conectar tu bot con servicios externos mediante APIs.
      </p>
      <button
        onClick={onCreateNew}
        className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl shadow-lg shadow-orange-500/30 hover:shadow-orange-500/40 transition-all transform hover:-translate-y-0.5 font-medium"
      >
        <Plus className="w-5 h-5" />
        Crear Nuevo Flujo
      </button>
    </div>
  );
}

// Flow Card
function FlowCard({
  flow,
  onEdit,
  onDelete,
}: {
  flow: Flow;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="group bg-white dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50 rounded-2xl p-5 hover:shadow-lg hover:shadow-gray-200/50 dark:hover:shadow-black/20 transition-all duration-300">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-500/10 rounded-lg">
            <Zap className="w-5 h-5 text-orange-500" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">{flow.name}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">{flow.description}</p>
          </div>
        </div>
        <div className="flex gap-1">
          <button
            onClick={onEdit}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-orange-500 transition-colors"
            title="Editar"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-red-500 transition-colors"
            title="Eliminar"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-3">
        <Globe className="w-4 h-4" />
        <span className="truncate">{flow.baseUrl}</span>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {flow.endpoints && flow.endpoints.length > 0 ? (
          <>
            {flow.endpoints.slice(0, 3).map((endpoint) => (
              <div key={endpoint.id} className="flex items-center gap-1">
                <MethodBadge method={endpoint.method} />
                <code className="text-xs bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-gray-600 dark:text-gray-300 max-w-24 truncate">
                  {endpoint.path}
                </code>
              </div>
            ))}
            {flow.endpoints.length > 3 && (
              <span className="text-xs text-gray-400">+{flow.endpoints.length - 3} más</span>
            )}
          </>
        ) : (
          <span className="text-xs text-gray-400 italic">Sin endpoints configurados</span>
        )}
        {flow.auth.type !== "none" && (
          <div className="ml-auto flex items-center gap-1 text-xs text-gray-400">
            <Lock className="w-3 h-3" />
            <span>{flow.auth.type === "apiKey" ? "API Key" : "Bearer"}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// WIZARD STEPS
// ============================================================================

// Step 1: General Configuration
function Step1General({
  data,
  onChange,
  errors,
}: {
  data: Partial<Flow>;
  onChange: (updates: Partial<Flow>) => void;
  errors: Record<string, string>;
}) {
  const handleAuthTypeChange = (type: AuthType) => {
    onChange({
      auth: {
        type,
        apiKeyName: type === "apiKey" ? data.auth?.apiKeyName || "X-API-Key" : undefined,
        apiKeyValue: type === "apiKey" ? data.auth?.apiKeyValue : undefined,
        bearerToken: type === "bearer" ? data.auth?.bearerToken : undefined,
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
            <Server className="w-5 h-5 text-orange-500" />
            Información General
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Define el nombre, descripción y configuración de conexión del flujo.
          </p>
        </div>
        <span className="text-xs text-red-500 font-medium">* Requerido</span>
      </div>

      <div>
        <div className="flex items-center gap-1 mb-1.5">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Nombre del Flujo <span className="text-red-500">*</span>
          </label>
          <Tooltip text="Dale un nombre descriptivo a esta conexión. Por ejemplo: 'Consultar Productos' o 'Registrar Cliente'. Este nombre te ayudará a identificar rápidamente qué hace cada flujo." />
        </div>
        <input
          type="text"
          value={data.name || ""}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder="Ej: Consulta de Inventario"
          className={`w-full px-4 py-3 rounded-xl border ${
            errors.name ? "border-red-500" : "border-gray-200 dark:border-gray-700"
          } bg-white dark:bg-gray-800 focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 outline-none transition-all`}
        />
        {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
      </div>

      <div>
        <div className="flex items-center gap-1 mb-1.5">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Descripción
          </label>
          <Tooltip text="Explica brevemente qué hace este flujo. Por ejemplo: 'Obtiene la lista de productos disponibles en el inventario'. Esto ayuda a entender el propósito de la conexión." />
        </div>
        <textarea
          value={data.description || ""}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="Describe qué hace este flujo..."
          rows={3}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 outline-none transition-all resize-none"
        />
      </div>

      <div>
        <div className="flex items-center gap-1 mb-1.5">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            URL Base del Servidor <span className="text-red-500">*</span>
          </label>
          <Tooltip text="Es la dirección web donde vive el servicio al que quieres conectarte. Es como la 'dirección de casa' del sistema externo. Ejemplo: https://api.mitienda.com" />
        </div>
        <div className="relative">
          <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="url"
            value={data.baseUrl || ""}
            onChange={(e) => onChange({ baseUrl: e.target.value })}
            placeholder="https://api.miempresa.com"
            className={`w-full pl-10 pr-4 py-3 rounded-xl border ${
              errors.baseUrl ? "border-red-500" : "border-gray-200 dark:border-gray-700"
            } bg-white dark:bg-gray-800 focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 outline-none transition-all`}
          />
        </div>
        {errors.baseUrl && <p className="text-red-500 text-sm mt-1">{errors.baseUrl}</p>}
      </div>

      {/* Authentication Section */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-5 h-5 text-orange-500" />
          <span className="font-medium text-gray-900 dark:text-white">Autenticación</span>
          <Tooltip text="La autenticación es como una 'contraseña' que demuestra que tienes permiso para usar el servicio. Muchos servicios externos la requieren para proteger su información." />
        </div>

        <div className="flex gap-2 mb-4">
          {(["none", "apiKey", "bearer"] as AuthType[]).map((type) => (
            <div key={type} className="flex-1 relative">
              <button
                onClick={() => handleAuthTypeChange(type)}
                className={`w-full py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
                  data.auth?.type === type
                    ? "bg-orange-500 text-white"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                {type === "none" ? "Sin Auth" : type === "apiKey" ? "API Key" : "Bearer Token"}
              </button>
            </div>
          ))}
        </div>
        
        <div className="text-xs text-gray-500 dark:text-gray-400 mb-4 bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg">
          {data.auth?.type === "none" && "💡 El servicio no requiere contraseña. Cualquiera puede acceder."}
          {data.auth?.type === "apiKey" && "🔑 API Key es como una contraseña especial que se envía en cada petición. El proveedor del servicio te la proporciona."}
          {data.auth?.type === "bearer" && "🎫 Bearer Token es un código temporal de acceso, como un pase de entrada que puede expirar."}
        </div>

        {data.auth?.type === "apiKey" && (
          <div className="space-y-3 animate-fade-in">
            <div>
              <div className="flex items-center gap-1 mb-1">
                <label className="block text-sm text-gray-600 dark:text-gray-400">Nombre del Header</label>
                <Tooltip text="Es el 'nombre de la etiqueta' donde va tu clave. El proveedor del servicio te indica cuál usar. Comúnmente es 'X-API-Key' o 'Authorization'." />
              </div>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={data.auth.apiKeyName || ""}
                  onChange={(e) => onChange({ auth: { ...data.auth!, apiKeyName: e.target.value } })}
                  placeholder="X-API-Key"
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-orange-500/50 outline-none"
                />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1 mb-1">
                <label className="block text-sm text-gray-600 dark:text-gray-400">Valor (para pruebas)</label>
                <Tooltip text="Aquí va la clave secreta que te dio el proveedor. Es como tu contraseña personal para acceder al servicio. ¡No la compartas con nadie!" />
              </div>
              <input
                type="password"
                value={data.auth.apiKeyValue || ""}
                onChange={(e) => onChange({ auth: { ...data.auth!, apiKeyValue: e.target.value } })}
                placeholder="••••••••••••"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-orange-500/50 outline-none"
              />
            </div>
          </div>
        )}

        {data.auth?.type === "bearer" && (
          <div className="animate-fade-in">
            <div className="flex items-center gap-1 mb-1">
              <label className="block text-sm text-gray-600 dark:text-gray-400">Token (para pruebas)</label>
              <Tooltip text="El token es un código largo que funciona como tu pase de acceso. Normalmente empieza con letras y números. Lo obtienes al iniciar sesión en el servicio externo." />
            </div>
            <input
              type="password"
              value={data.auth.bearerToken || ""}
              onChange={(e) => onChange({ auth: { ...data.auth!, bearerToken: e.target.value } })}
              placeholder="eyJhbGciOiJIUzI1NiIs..."
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-orange-500/50 outline-none"
            />
          </div>
        )}
      </div>

      {/* Quick Guide Accordion */}
      <GeneralHelpAccordion />
    </div>
  );
}

// Help Accordion for General Step
function GeneralHelpAccordion() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden text-xs">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
          <BookOpen className="w-4 h-4 text-orange-500" />
          <span className="font-medium">Guía Rápida</span>
        </div>
        <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? "rotate-90" : ""}`} />
      </button>
      {isOpen && (
        <div className="p-3 bg-white dark:bg-gray-900/30 space-y-3 text-xs animate-fade-in">
          <div className="space-y-1.5">
            <p className="text-gray-600 dark:text-gray-400">
              <strong className="text-gray-800 dark:text-gray-200">Nombre:</strong> Identificador descriptivo del flujo (ej: "Consultar Inventario").
            </p>
            <p className="text-gray-600 dark:text-gray-400">
              <strong className="text-gray-800 dark:text-gray-200">URL Base:</strong> Dirección del servidor API (ej: <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">https://api.ejemplo.com</code>).
            </p>
            <p className="text-gray-600 dark:text-gray-400">
              <strong className="text-gray-800 dark:text-gray-200">Autenticación:</strong> Credenciales para acceder al servicio (API Key o Bearer Token si es requerido).
            </p>
          </div>

          {/* Example */}
          <div className="pt-2 border-t border-gray-200 dark:border-gray-700 space-y-2">
            <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
              Ejemplo: "Consultar Calificaciones"
            </p>
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-2.5 space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-gray-500 w-16">Nombre:</span>
                <span className="font-medium text-gray-800 dark:text-gray-200">Consultar Calificaciones</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-500 w-16">URL Base:</span>
                <code className="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-blue-600 dark:text-blue-400">https://api.universidad.edu</code>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-500 w-16">Auth:</span>
                <span className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded">API Key</span>
                <span className="text-gray-400">X-API-Key</span>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
            <p className="text-gray-500 dark:text-gray-400 flex items-start gap-1.5">
              <span>💡</span>
              <span>La descripción es opcional pero ayuda a entender el propósito del flujo.</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// Step 2: Endpoints Definition (Multiple endpoints support)
function Step2Endpoints({
  data,
  onChange,
  errors,
}: {
  data: Partial<Flow>;
  onChange: (updates: Partial<Flow>) => void;
  errors: Record<string, string>;
}) {
  const [expandedEndpoint, setExpandedEndpoint] = useState<string | null>(null);
  const [endpointToDelete, setEndpointToDelete] = useState<{ id: string; path: string } | null>(null);

  // Postman-style colors: GET=green, POST=yellow, PUT=blue, DELETE=red
  const methods: { method: HttpMethod; label: string; description: string; color: string }[] = [
    { method: "GET", label: "GET", description: "Consultar", color: "green" },
    { method: "POST", label: "POST", description: "Crear", color: "yellow" },
    { method: "PUT", label: "PUT", description: "Actualizar", color: "blue" },
    { method: "DELETE", label: "DELETE", description: "Eliminar", color: "red" },
  ];

  const colorClasses: Record<string, { selected: string; hover: string; bg: string }> = {
    green: { selected: "bg-emerald-500 text-white", hover: "hover:bg-emerald-50 dark:hover:bg-emerald-900/20", bg: "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800" },
    yellow: { selected: "bg-amber-500 text-white", hover: "hover:bg-amber-50 dark:hover:bg-amber-900/20", bg: "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800" },
    blue: { selected: "bg-sky-500 text-white", hover: "hover:bg-sky-50 dark:hover:bg-sky-900/20", bg: "bg-sky-50 dark:bg-sky-900/20 border-sky-200 dark:border-sky-800" },
    red: { selected: "bg-red-500 text-white", hover: "hover:bg-red-50 dark:hover:bg-red-900/20", bg: "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800" },
  };

  const getMethodColor = (method: HttpMethod) => {
    const m = methods.find(m => m.method === method);
    return m?.color || "blue";
  };

  // Add new endpoint with default 200 response
  const addEndpoint = () => {
    const defaultResponse: FlowResponse = {
      id: crypto.randomUUID(),
      statusCode: "200",
      description: "La petición se realizó correctamente",
      properties: [],
    };
    const newEndpoint: FlowEndpoint = {
      id: crypto.randomUUID(),
      name: "",
      method: "GET",
      path: "",
      parameters: [],
      bodyProperties: [],
      responses: [defaultResponse],
    };
    const updatedEndpoints = [...(data.endpoints || []), newEndpoint];
    onChange({ endpoints: updatedEndpoints });
    setExpandedEndpoint(newEndpoint.id);
  };

  // Update endpoint
  const updateEndpoint = (id: string, updates: Partial<FlowEndpoint>) => {
    onChange({
      endpoints: data.endpoints?.map((ep) => (ep.id === id ? { ...ep, ...updates } : ep)) || [],
    });
  };

  // Handle method change - clear body if switching to GET/DELETE
  const handleMethodChange = (endpointId: string, newMethod: HttpMethod) => {
    const methodsWithBody: HttpMethod[] = ["POST", "PUT"];
    if (!methodsWithBody.includes(newMethod)) {
      // Clear body properties when switching to GET or DELETE
      updateEndpoint(endpointId, { method: newMethod, bodyProperties: [] });
    } else {
      updateEndpoint(endpointId, { method: newMethod });
    }
  };

  // Update path parameter (detected from route)
  const updatePathParameter = (endpointId: string, paramName: string, updates: Partial<FlowParameter>) => {
    const endpoint = data.endpoints?.find((ep) => ep.id === endpointId);
    if (!endpoint) return;
    
    const existingParam = endpoint.parameters.find(p => p.name === paramName && p.in === "path");
    if (existingParam) {
      // Update existing
      updateEndpoint(endpointId, {
        parameters: endpoint.parameters.map((p) => 
          p.name === paramName && p.in === "path" ? { ...p, ...updates } : p
        ),
      });
    } else {
      // Create new path param
      const newParam: FlowParameter = {
        id: crypto.randomUUID(),
        name: paramName,
        type: updates.type || "string",
        required: true,
        in: "path",
        description: updates.description || "",
      };
      updateEndpoint(endpointId, { parameters: [...endpoint.parameters, newParam] });
    }
  };

  // Remove endpoint
  const removeEndpoint = (id: string) => {
    onChange({ endpoints: data.endpoints?.filter((ep) => ep.id !== id) || [] });
    if (expandedEndpoint === id) {
      setExpandedEndpoint(null);
    }
  };

  // Add body property
  const addBodyProperty = (endpointId: string) => {
    const endpoint = data.endpoints?.find((ep) => ep.id === endpointId);
    if (!endpoint) return;
    const newProp: FlowBodyProperty = {
      id: crypto.randomUUID(),
      name: "",
      type: "string",
      description: "",
      example: "",
    };
    updateEndpoint(endpointId, { bodyProperties: [...endpoint.bodyProperties, newProp] });
  };

  // Update body property
  const updateBodyProperty = (endpointId: string, propId: string, updates: Partial<FlowBodyProperty>) => {
    const endpoint = data.endpoints?.find((ep) => ep.id === endpointId);
    if (!endpoint) return;
    updateEndpoint(endpointId, {
      bodyProperties: endpoint.bodyProperties.map((p) => (p.id === propId ? { ...p, ...updates } : p)),
    });
  };

  // Remove body property
  const removeBodyProperty = (endpointId: string, propId: string) => {
    const endpoint = data.endpoints?.find((ep) => ep.id === endpointId);
    if (!endpoint) return;
    updateEndpoint(endpointId, { bodyProperties: endpoint.bodyProperties.filter((p) => p.id !== propId) });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
            <Route className="w-5 h-5 text-orange-500" />
            Endpoints del Servicio
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Configura las rutas disponibles en tu API. Cada ruta puede tener su propio método y datos.
          </p>
        </div>
        <span className="text-xs text-red-500 font-medium">* Requerido</span>
      </div>

      {errors.endpoints && (
        <p className="text-red-500 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">{errors.endpoints}</p>
      )}

      {/* Endpoints List */}
      <div className="space-y-3">
        {data.endpoints?.map((endpoint, index) => {
          const isExpanded = expandedEndpoint === endpoint.id;
          const methodColor = getMethodColor(endpoint.method);
          const showBody = endpoint.method === "POST" || endpoint.method === "PUT";

          return (
            <div
              key={endpoint.id}
              className={`border rounded-xl overflow-hidden transition-all ${
                isExpanded ? colorClasses[methodColor].bg : "border-gray-200 dark:border-gray-700"
              }`}
            >
              {/* Endpoint Header */}
              <div
                className={`flex items-center justify-between p-4 cursor-pointer ${
                  isExpanded ? "" : "hover:bg-gray-50 dark:hover:bg-gray-800/50"
                }`}
                onClick={() => setExpandedEndpoint(isExpanded ? null : endpoint.id)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className="text-sm font-medium text-gray-400">#{index + 1}</span>
                  <MethodBadge method={endpoint.method} />
                  <code className="text-sm text-gray-600 dark:text-gray-300 truncate">
                    {endpoint.path || "/ruta"}
                  </code>
                  {endpoint.name && (
                    <span className="text-sm text-gray-500 dark:text-gray-400 truncate hidden sm:block">
                      — {endpoint.name}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    {endpoint.parameters.length > 0 && (
                      <span className="bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 px-1.5 py-0.5 rounded">
                        {endpoint.parameters.length} params
                      </span>
                    )}
                    {endpoint.bodyProperties.length > 0 && (
                      <span className="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-1.5 py-0.5 rounded">
                        {endpoint.bodyProperties.length} campos
                      </span>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEndpointToDelete({ id: endpoint.id, path: endpoint.path || "sin ruta" });
                    }}
                    className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                    title="Eliminar endpoint"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                </div>
              </div>

              {/* Endpoint Details (Expanded) */}
              {isExpanded && (
                <div className="p-4 pt-0 space-y-4 border-t border-gray-200 dark:border-gray-700">
                  {/* Endpoint Name */}
                  <div>
                    <div className="flex items-center gap-1 mb-1.5">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Nombre del Endpoint
                      </label>
                      <Tooltip text="Un nombre descriptivo para identificar qué hace este endpoint. Ejemplo: 'Obtener productos', 'Crear pedido'." />
                    </div>
                    <input
                      type="text"
                      value={endpoint.name || ""}
                      onChange={(e) => updateEndpoint(endpoint.id, { name: e.target.value })}
                      placeholder="Ej: Obtener lista de productos"
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-orange-500/50 outline-none"
                    />
                  </div>

                  {/* Method Selection */}
                  <div>
                    <div className="flex items-center gap-1 mb-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Método HTTP <span className="text-red-500">*</span>
                      </label>
                      <Tooltip text="El método indica qué acción realizará: consultar (GET), crear (POST), actualizar (PUT) o eliminar (DELETE)." />
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {methods.map(({ method, label, description, color }) => {
                        const isSelected = endpoint.method === method;
                        return (
                          <button
                            key={method}
                            onClick={() => handleMethodChange(endpoint.id, method)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                              isSelected
                                ? colorClasses[color].selected
                                : `border border-gray-200 dark:border-gray-700 ${colorClasses[color].hover}`
                            }`}
                          >
                            {label}
                            <span className={`ml-1.5 text-xs ${isSelected ? "opacity-80" : "text-gray-400"}`}>
                              {description}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Path */}
                  <div>
                    <div className="flex items-center gap-1 mb-1.5">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Ruta <span className="text-red-500">*</span>
                      </label>
                      <Tooltip text="La ruta específica para este endpoint. Usa {nombre} para parámetros dinámicos. Ejemplo: /productos/{id}, /usuarios/{userId}/pedidos" />
                    </div>
                    <div className="relative flex">
                      <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-sm font-mono">
                        /
                      </span>
                      <input
                        type="text"
                        value={endpoint.path?.replace(/^\/+/, '') || ""}
                        onChange={(e) => {
                          // Remove leading slashes from input and store with leading slash
                          const cleanPath = e.target.value.replace(/^\/+/, '');
                          updateEndpoint(endpoint.id, { path: cleanPath ? `/${cleanPath}` : '' });
                        }}
                        placeholder="productos/{id}"
                        className="flex-1 px-4 py-2.5 rounded-r-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-orange-500/50 outline-none font-mono text-sm"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      URL: <code className="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">{(data.baseUrl || "https://...").replace(/\/+$/, '')}{endpoint.path || "/ruta"}</code>
                    </p>
                    {/* Detected path parameters hint */}
                    {endpoint.path && endpoint.path.includes("{") && (
                      <p className="text-xs text-orange-500 mt-1 flex items-center gap-1">
                        <span>🔗</span>
                        Parámetros detectados: {(endpoint.path.match(/\{([^}]+)\}/g) || []).map(m => m.slice(1, -1)).join(", ")}
                      </p>
                    )}
                  </div>

                  {/* Path Parameters (detected from route) */}
                  {endpoint.path && endpoint.path.includes("{") && (() => {
                    const pathParamNames = (endpoint.path.match(/\{([^}]+)\}/g) || []).map(m => m.slice(1, -1));
                    const pathParams = endpoint.parameters.filter(p => p.in === "path");
                    return (
                      <div className="border border-orange-200 dark:border-orange-800/50 rounded-lg overflow-hidden bg-orange-50/50 dark:bg-orange-900/10">
                        <div className="flex items-center justify-between p-3 bg-orange-100/50 dark:bg-orange-900/20">
                          <div className="flex items-center gap-2">
                            <Route className="w-4 h-4 text-orange-500" />
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Parámetros de Ruta</span>
                            <Tooltip text="Parámetros dinámicos en la URL como {id}. Son siempre requeridos y se reemplazan con valores reales." />
                            <span className="bg-orange-200 dark:bg-orange-800/50 text-orange-700 dark:text-orange-300 text-xs px-1.5 py-0.5 rounded-full">
                              {pathParamNames.length}
                            </span>
                          </div>
                        </div>
                        <div className="p-3 space-y-3">
                          {pathParamNames.map((paramName) => {
                            const existingParam = pathParams.find(p => p.name === paramName);
                            return (
                              <div key={paramName} className="border border-gray-100 dark:border-gray-700 rounded-lg p-3 bg-white dark:bg-gray-800/30">
                                {/* Param name badge */}
                                <div className="flex items-center gap-2 mb-3">
                                  <div className="flex items-center gap-1 px-3 py-1.5 rounded border border-orange-300 dark:border-orange-700 bg-orange-100 dark:bg-orange-900/30 text-sm font-mono text-orange-700 dark:text-orange-300">
                                    <span>{`{${paramName}}`}</span>
                                  </div>
                                </div>
                                
                                {/* Row 1: Type and Description */}
                                <div className="flex gap-3 mb-2">
                                  <div className="w-28">
                                    <label className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                                      Tipo <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                      value={existingParam?.type || "string"}
                                      onChange={(e) => {
                                        updatePathParameter(endpoint.id, paramName, { type: e.target.value as ParamType });
                                      }}
                                      className="w-full px-2 py-1.5 rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm"
                                    >
                                      <option value="string">Texto</option>
                                      <option value="integer">Entero</option>
                                      <option value="number">Número</option>
                                    </select>
                                  </div>
                                  <div className="flex-1">
                                    <label className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                                      Descripción <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                      type="text"
                                      value={existingParam?.description || ""}
                                      onChange={(e) => {
                                        updatePathParameter(endpoint.id, paramName, { description: e.target.value });
                                      }}
                                      placeholder="ej: Identificador único del usuario"
                                      className={`w-full px-3 py-1.5 rounded border ${
                                        !existingParam?.description ? 'border-orange-300 dark:border-orange-600' : 'border-gray-200 dark:border-gray-600'
                                      } bg-white dark:bg-gray-800 text-sm`}
                                    />
                                  </div>
                                </div>
                                
                                {/* Row 2: Example (optional) */}
                                <div>
                                  <label className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                                    Ejemplo
                                  </label>
                                  <input
                                    type="text"
                                    value={existingParam?.example || ""}
                                    onChange={(e) => {
                                      updatePathParameter(endpoint.id, paramName, { example: e.target.value });
                                    }}
                                    placeholder="ej: 12345, usr_abc123"
                                    className="w-full px-3 py-1.5 rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-mono"
                                  />
                                </div>
                              </div>
                            );
                          })}
                          <p className="text-xs text-gray-500 mt-2">
                            URL ejemplo: <code className="bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 px-1.5 py-0.5 rounded">
                              {(data.baseUrl || "https://...").replace(/\/+$/, '')}{endpoint.path.replace(/\{([^}]+)\}/g, (_, name) => {
                                const param = pathParams.find(p => p.name === name);
                                if (param?.example) return param.example;
                                const type = param?.type || "string";
                                return type === "integer" || type === "number" ? "123" : "abc123";
                              })}
                            </code>
                          </p>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Body Properties (only for POST/PUT) */}
                  {showBody && (
                    <div className="border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
                      <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50">
                        <div className="flex items-center gap-2">
                          <FileJson className="w-4 h-4 text-green-500" />
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Cuerpo (Body)</span>
                          <Tooltip text="Los datos que se envían al crear o actualizar. Cada campo necesita nombre, tipo, descripción y un ejemplo." />
                          {endpoint.bodyProperties.length > 0 && (
                            <span className="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-xs px-1.5 py-0.5 rounded-full">
                              {endpoint.bodyProperties.length}
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => addBodyProperty(endpoint.id)}
                          className="text-xs text-green-500 hover:text-green-600 font-medium flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" /> Agregar Campo
                        </button>
                      </div>
                      {endpoint.bodyProperties.length > 0 && (
                        <div className="p-3 space-y-3">
                          {endpoint.bodyProperties.map((prop, propIndex) => (
                            <div key={prop.id} className="border border-gray-100 dark:border-gray-700 rounded-lg p-3 bg-white dark:bg-gray-800/30">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-medium text-gray-500">Campo #{propIndex + 1}</span>
                                <button
                                  onClick={() => removeBodyProperty(endpoint.id, prop.id)}
                                  className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                                  title="Eliminar campo"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                              
                              {/* Row 1: Name and Type */}
                              <div className="flex gap-2 mb-2">
                                <div className="flex-1">
                                  <label className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                                    Nombre del campo <span className="text-red-500">*</span>
                                    <Tooltip text="El nombre técnico del campo que espera el servicio. Usa nombres simples sin espacios ni caracteres especiales, como 'email', 'nombre' o 'precio'." />
                                  </label>
                                  <input
                                    type="text"
                                    value={prop.name}
                                    onChange={(e) => updateBodyProperty(endpoint.id, prop.id, { name: e.target.value })}
                                    placeholder="ej: email, nombre, precio"
                                    className="w-full px-3 py-1.5 rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm"
                                  />
                                </div>
                                <div className="w-32">
                                  <label className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                                    Tipo <span className="text-red-500">*</span>
                                    <Tooltip text="El tipo de dato que acepta este campo. 'Texto' para palabras, 'Número' para decimales, 'Entero' para números sin decimales, 'Sí/No' para valores verdadero/falso." />
                                  </label>
                                  <select
                                    value={prop.type}
                                    onChange={(e) => updateBodyProperty(endpoint.id, prop.id, { type: e.target.value as ParamType })}
                                    className="w-full px-2 py-1.5 rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm"
                                  >
                                    <option value="string">Texto</option>
                                    <option value="number">Número</option>
                                    <option value="integer">Entero</option>
                                    <option value="boolean">Sí/No</option>
                                  </select>
                                </div>
                              </div>
                              
                              {/* Row 2: Description */}
                              <div className="mb-2">
                                <label className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                                  Descripción <span className="text-red-500">*</span>
                                  <Tooltip text="Explica para qué sirve este campo en lenguaje sencillo. Esta descripción ayuda a entender qué información debe enviarse, por ejemplo: 'Correo electrónico del cliente para notificaciones'." />
                                </label>
                                <input
                                  type="text"
                                  value={prop.description}
                                  onChange={(e) => updateBodyProperty(endpoint.id, prop.id, { description: e.target.value })}
                                  placeholder="ej: Correo electrónico del usuario"
                                  className={`w-full px-3 py-1.5 rounded border ${
                                    !prop.description ? 'border-orange-300 dark:border-orange-600' : 'border-gray-200 dark:border-gray-600'
                                  } bg-white dark:bg-gray-800 text-sm`}
                                />
                              </div>
                              
                              {/* Row 3: Example */}
                              <div>
                                <label className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                                  Ejemplo <span className="text-red-500">*</span> 
                                  <span className="text-gray-400 ml-1">
                                    {prop.type === 'string' && '(texto)'}
                                    {prop.type === 'number' && '(decimal, ej: 99.99)'}
                                    {prop.type === 'integer' && '(entero, ej: 42)'}
                                    {prop.type === 'boolean' && '(true o false)'}
                                  </span>
                                  <Tooltip text="Un valor de ejemplo real que podría enviarse en este campo. Esto ayuda a verificar que el formato es correcto y sirve como referencia para pruebas." />
                                </label>
                                <input
                                  type="text"
                                  value={prop.example}
                                  onChange={(e) => updateBodyProperty(endpoint.id, prop.id, { example: e.target.value })}
                                  placeholder={
                                    prop.type === 'string' ? 'ej: usuario@email.com' :
                                    prop.type === 'number' ? 'ej: 99.99' :
                                    prop.type === 'integer' ? 'ej: 42' :
                                    'ej: true'
                                  }
                                  className={`w-full px-3 py-1.5 rounded border ${
                                    !prop.example ? 'border-orange-300 dark:border-orange-600' : 'border-gray-200 dark:border-gray-600'
                                  } bg-white dark:bg-gray-800 text-sm font-mono`}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {/* Help for body */}
                      {endpoint.bodyProperties.length === 0 && (
                        <div className="p-3 text-xs text-gray-500 dark:text-gray-400 bg-green-50 dark:bg-green-900/10">
                          💡 Agrega los campos que el servicio necesita recibir. Cada campo debe tener descripción y ejemplo según OpenAPI 3.0.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add Endpoint Button */}
      <button
        onClick={addEndpoint}
        className="w-full py-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-gray-500 dark:text-gray-400 hover:border-orange-500 hover:text-orange-500 transition-colors flex items-center justify-center gap-2"
      >
        <Plus className="w-5 h-5" />
        Agregar Endpoint
      </button>

      {/* Help Text - Accordion */}
      <HelpAccordion />

      {/* Delete Endpoint Confirmation Modal */}
      {endpointToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full">
                <Trash2 className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Eliminar Endpoint</h3>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              ¿Estás seguro de que deseas eliminar el endpoint <strong className="font-mono text-orange-600 dark:text-orange-400">"{endpointToDelete.path}"</strong>? Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setEndpointToDelete(null)}
                className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  removeEndpoint(endpointToDelete.id);
                  setEndpointToDelete(null);
                }}
                className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Step 4: Preview & Save
function Step4Preview({
  data,
  openApiSchema,
}: {
  data: Partial<Flow>;
  openApiSchema: OpenAPISchema;
}) {
  const [copied, setCopied] = useState(false);
  const [showJson, setShowJson] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(openApiSchema, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Helper to get human-readable method description
  const getMethodDescription = (method: string) => {
    const descriptions: Record<string, string> = {
      GET: "consultar información",
      POST: "crear o enviar datos nuevos",
      PUT: "actualizar información existente",
      DELETE: "eliminar información",
    };
    return descriptions[method] || "interactuar con";
  };

  // Helper to get auth description
  const getAuthDescription = () => {
    if (!data.auth || data.auth.type === "none") {
      return null;
    }
    if (data.auth.type === "apiKey") {
      return `Se utilizará una clave de API (API Key)${data.auth.apiKeyName ? ` con el nombre "${data.auth.apiKeyName}"` : ''} que se enviará en los encabezados de cada solicitud para autenticarte.`;
    }
    if (data.auth.type === "bearer") {
      return "Se utilizará autenticación con token Bearer, enviando un token de acceso en cada solicitud para verificar la identidad.";
    }
    return null;
  };

  // Get parameter type in Spanish
  const getParamTypeSpanish = (type: string) => {
    const types: Record<string, string> = {
      string: "texto",
      number: "número decimal",
      integer: "número entero",
      boolean: "verdadero/falso",
    };
    return types[type] || type;
  };

  const endpoints = data.endpoints || [];

  return (
    <div className="space-y-6">
      {/* Info Banner */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/30 rounded-xl p-4">
        <p className="text-sm text-blue-700 dark:text-blue-300">
          🎉 <strong>¡Ya casi terminas!</strong> Revisa que toda la información esté correcta antes de guardar. Una vez guardado, tu bot podrá usar esta conexión para comunicarse con el servicio externo.
        </p>
      </div>

      {/* Detailed Summary */}
      <div className="bg-linear-to-r from-orange-500/10 to-amber-500/10 rounded-xl p-6 border border-orange-200 dark:border-orange-800/30">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2 text-lg">
          <CheckCircle className="w-6 h-6 text-orange-500" />
          Resumen de tu Configuración
        </h3>
        
        <div className="space-y-4">
          {/* Flow Name & Description */}
          <div className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 dark:text-white mb-2 flex items-center gap-2">
              <span className="w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-bold">1</span>
              Información General
            </h4>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              Este flujo se llama <strong className="text-orange-600 dark:text-orange-400">"{data.name || 'Sin nombre'}"</strong>
              {data.description && (
                <> y su propósito es: <em>"{data.description}"</em></>
              )}
              {!data.description && (
                <> (sin descripción adicional)</>
              )}
            </p>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mt-2">
              Se conectará al servidor{" "}
              <code className="bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded text-sm font-mono break-all">
                {data.baseUrl || 'URL no especificada'}
              </code>
            </p>
          </div>

          {/* Authentication */}
          <div className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 dark:text-white mb-2 flex items-center gap-2">
              <span className="w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-bold">2</span>
              Seguridad y Autenticación
            </h4>
            {getAuthDescription() ? (
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed flex items-start gap-2">
                <Lock className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                <span>{getAuthDescription()}</span>
              </p>
            ) : (
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed flex items-start gap-2">
                <span className="text-yellow-500">⚠️</span>
                <span>No se ha configurado autenticación. El servicio debe ser público o manejar la autenticación de otra manera.</span>
              </p>
            )}
          </div>

          {/* Endpoints Summary */}
          <div className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <span className="w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-bold">3</span>
              Endpoints Configurados
              <span className="bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 text-xs px-2 py-0.5 rounded-full ml-auto">
                {endpoints.length} endpoint{endpoints.length !== 1 ? 's' : ''}
              </span>
            </h4>
            
            {endpoints.length > 0 ? (
              <div className="space-y-4">
                {endpoints.map((endpoint) => (
                  <div key={endpoint.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <MethodBadge method={endpoint.method} />
                      <code className="text-sm font-mono text-gray-700 dark:text-gray-300">
                        {endpoint.path || '/'}
                      </code>
                      {endpoint.name && (
                        <span className="text-sm text-gray-500 dark:text-gray-400 ml-auto">
                          {endpoint.name}
                        </span>
                      )}
                    </div>
                    
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      Este endpoint permite <strong>{getMethodDescription(endpoint.method)}</strong> en la ruta{" "}
                      <code className="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-xs">
                        {data.baseUrl}{endpoint.path}
                      </code>
                    </p>

                    {/* Parameters for this endpoint */}
                    {endpoint.parameters.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                        <p className="text-xs font-medium text-purple-600 dark:text-purple-400 mb-1">
                          Parámetros de consulta ({endpoint.parameters.length}):
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {endpoint.parameters.map((param) => (
                            <span
                              key={param.id}
                              className="inline-flex items-center gap-1 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 text-xs px-2 py-0.5 rounded"
                            >
                              {param.name} ({getParamTypeSpanish(param.type)})
                              {param.required && <span className="text-red-500">*</span>}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Body properties for this endpoint */}
                    {(endpoint.method === "POST" || endpoint.method === "PUT") && endpoint.bodyProperties.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                        <p className="text-xs font-medium text-green-600 dark:text-green-400 mb-2">
                          Campos del body ({endpoint.bodyProperties.length}):
                        </p>
                        <div className="space-y-2">
                          {endpoint.bodyProperties.map((prop) => (
                            <div
                              key={prop.id}
                              className="bg-green-50 dark:bg-green-900/20 rounded-lg p-2 text-xs"
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <code className="font-semibold text-green-700 dark:text-green-300">
                                  {prop.name || 'sin nombre'}
                                </code>
                                <span className="text-green-600 dark:text-green-400">
                                  ({getParamTypeSpanish(prop.type)})
                                </span>
                                <span className="text-red-500 text-xs">*requerido</span>
                              </div>
                              {prop.description && (
                                <p className="text-gray-600 dark:text-gray-400 mb-1">
                                  📝 {prop.description}
                                </p>
                              )}
                              {prop.example && (
                                <p className="text-gray-500 dark:text-gray-500 font-mono">
                                  💡 Ejemplo: <span className="text-green-600 dark:text-green-400">{prop.example}</span>
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Responses for this endpoint */}
                    {endpoint.responses && endpoint.responses.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                        <p className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-2">
                          Respuestas configuradas ({endpoint.responses.length}):
                        </p>
                        <div className="space-y-2">
                          {endpoint.responses.map((response) => {
                            const isSuccess = response.statusCode.startsWith('2');
                            const isClientError = response.statusCode.startsWith('4');
                            const colorClass = isSuccess 
                              ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800/50'
                              : isClientError
                                ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800/50'
                                : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/50';
                            const textColor = isSuccess
                              ? 'text-emerald-700 dark:text-emerald-400'
                              : isClientError
                                ? 'text-amber-700 dark:text-amber-400'
                                : 'text-red-700 dark:text-red-400';
                            
                            return (
                              <div
                                key={response.id}
                                className={`rounded-lg p-2 text-xs border ${colorClass}`}
                              >
                                <div className="flex items-center gap-2 mb-1">
                                  <span className={`font-bold ${textColor}`}>
                                    {response.statusCode}
                                  </span>
                                  <span className="text-gray-600 dark:text-gray-400">
                                    {response.description || 'Sin descripción'}
                                  </span>
                                  {response.properties.length > 0 && (
                                    <span className="text-gray-400 dark:text-gray-500 ml-auto">
                                      {response.properties.length} campo{response.properties.length !== 1 ? 's' : ''}
                                    </span>
                                  )}
                                </div>
                                {response.properties.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {response.properties.map((prop) => (
                                      <span
                                        key={prop.id}
                                        className="inline-flex items-center gap-1 bg-white/60 dark:bg-gray-800/60 text-gray-600 dark:text-gray-400 text-xs px-1.5 py-0.5 rounded"
                                      >
                                        <code className="font-mono">{prop.name}</code>
                                        <span className="text-gray-400">({getParamTypeSpanish(prop.type)})</span>
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                No se han configurado endpoints. Vuelve al paso anterior para agregar al menos uno.
              </p>
            )}
          </div>

        </div>
      </div>

      {/* JSON Preview - Accordion */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
        <button
          onClick={() => setShowJson(!showJson)}
          className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <div className="flex items-center gap-2">
            <FileJson className="w-5 h-5 text-gray-500" />
            <span className="font-medium text-gray-700 dark:text-gray-300">Esquema OpenAPI 3.0 (Técnico)</span>
            <Tooltip text="Este código técnico es lo que tu bot usará internamente para conectarse al servicio. No necesitas entenderlo, pero los desarrolladores pueden usarlo para verificar la configuración." />
          </div>
          <div className="flex items-center gap-2">
            {showJson && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleCopy();
                }}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-orange-500 transition-colors px-2 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? "¡Copiado!" : "Copiar"}
              </button>
            )}
            <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${showJson ? "rotate-90" : ""}`} />
          </div>
        </button>
        
        {showJson && (
          <div className="p-4 bg-gray-900">
            <pre className="text-gray-100 overflow-auto max-h-80 text-xs font-mono">
              {JSON.stringify(openApiSchema, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT: FlowsManager
// ============================================================================

export default function FlowsManager() {
  const { flows, isLoading, saveFlow, deleteFlow, getFlow } = useFlowsStorage();
  
  // View state
  const [view, setView] = useState<"dashboard" | "editor">("dashboard");
  const [editingFlowId, setEditingFlowId] = useState<string | null>(null);
  
  // Editor state
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<Partial<Flow>>({
    auth: { type: "none" },
    endpoints: [],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // UI state
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [deleteModalFlow, setDeleteModalFlow] = useState<Flow | null>(null);

  const TOTAL_STEPS = 4;

  // Generate OpenAPI schema in real-time
  const openApiSchema = useMemo(() => generateOpenAPISchema(formData), [formData]);

  // Reset form when entering editor
  const startNewFlow = () => {
    setFormData({
      auth: { type: "none" },
      parameters: [],
      bodyProperties: [],
    });
    setCurrentStep(0);
    setEditingFlowId(null);
    setErrors({});
    setView("editor");
  };

  const startEditFlow = (id: string) => {
    const flow = getFlow(id);
    if (flow) {
      setFormData(flow);
      setCurrentStep(0);
      setEditingFlowId(id);
      setErrors({});
      setView("editor");
    }
  };

  const handleFormChange = (updates: Partial<Flow>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
    // Clear errors for updated fields
    const updatedKeys = Object.keys(updates);
    setErrors((prev) => {
      const newErrors = { ...prev };
      updatedKeys.forEach((key) => delete newErrors[key]);
      return newErrors;
    });
  };

  // Validation
  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 0) {
      if (!formData.name?.trim()) newErrors.name = "El nombre es obligatorio";
      if (!formData.baseUrl?.trim()) newErrors.baseUrl = "La URL base es obligatoria";
      else if (!/^https?:\/\/.+/.test(formData.baseUrl)) newErrors.baseUrl = "URL inválida";
    }

    if (step === 1) {
      if (!formData.endpoints || formData.endpoints.length === 0) {
        newErrors.endpoints = "Agrega al menos un endpoint";
      } else {
        // Check each endpoint
        for (const ep of formData.endpoints) {
          if (!ep.path?.trim()) {
            newErrors.endpoints = "Todos los endpoints deben tener una ruta";
            break;
          }
          // Check path parameters have description
          if (ep.path.includes("{")) {
            const pathParamNames = (ep.path.match(/\{([^}]+)\}/g) || []).map(m => m.slice(1, -1));
            for (const paramName of pathParamNames) {
              const param = ep.parameters.find(p => p.name === paramName && p.in === "path");
              if (!param?.description?.trim()) {
                newErrors.endpoints = `El parámetro "{${paramName}}" en "${ep.path}" necesita una descripción`;
                break;
              }
            }
            if (newErrors.endpoints) break;
          }
          // Check body properties for POST/PUT
          if ((ep.method === "POST" || ep.method === "PUT") && ep.bodyProperties.length > 0) {
            for (const prop of ep.bodyProperties) {
              if (!prop.name?.trim()) {
                newErrors.endpoints = `El campo del body en "${ep.path}" necesita un nombre`;
                break;
              }
              if (!prop.description?.trim()) {
                newErrors.endpoints = `El campo "${prop.name || 'sin nombre'}" en "${ep.path}" necesita una descripción`;
                break;
              }
              if (!prop.example?.trim()) {
                newErrors.endpoints = `El campo "${prop.name || 'sin nombre'}" en "${ep.path}" necesita un ejemplo`;
                break;
              }
            }
          }
          if (newErrors.endpoints) break;
        }
      }
    }

    if (step === 2) {
      // Validate responses - only check that responses have description if they exist
      if (formData.endpoints && formData.endpoints.length > 0) {
        for (const ep of formData.endpoints) {
          // Check each response (responses are optional, but if they exist they need description)
          for (const response of (ep.responses || [])) {
            if (!response.description?.trim()) {
              newErrors.responses = `La respuesta ${response.statusCode} en "${ep.path}" necesita una descripción`;
              break;
            }
            // Check response properties only if they exist
            for (const prop of response.properties) {
              if (!prop.name?.trim()) {
                newErrors.responses = `Un campo de la respuesta ${response.statusCode} en "${ep.path}" necesita un nombre`;
                break;
              }
            }
            if (newErrors.responses) break;
          }
          if (newErrors.responses) break;
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const goNextStep = () => {
    if (validateStep(currentStep)) {
      // Normalize baseUrl: remove trailing slash when leaving step 0
      if (currentStep === 0 && formData.baseUrl) {
        const normalizedUrl = formData.baseUrl.replace(/\/+$/, '');
        if (normalizedUrl !== formData.baseUrl) {
          setFormData((prev) => ({ ...prev, baseUrl: normalizedUrl }));
        }
      }
      // Normalize endpoint paths: ensure they start with / when leaving step 1
      if (currentStep === 1 && formData.endpoints) {
        const normalizedEndpoints = formData.endpoints.map((ep) => ({
          ...ep,
          path: ep.path ? (ep.path.startsWith('/') ? ep.path : `/${ep.path}`) : ep.path,
        }));
        setFormData((prev) => ({ ...prev, endpoints: normalizedEndpoints }));
      }
      setCurrentStep((prev) => Math.min(prev + 1, TOTAL_STEPS - 1));
    }
  };

  const goPrevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const handleSave = () => {
    if (!validateStep(0) || !validateStep(1) || !validateStep(2)) {
      setToast({ message: "Por favor completa todos los campos obligatorios", type: "error" });
      return;
    }

    saveFlow({
      ...formData,
      id: editingFlowId || undefined,
    } as Flow);

    setToast({
      message: editingFlowId ? "Flujo actualizado correctamente" : "Flujo creado correctamente",
      type: "success",
    });
    setView("dashboard");
  };

  const handleDelete = (flow: Flow) => {
    setDeleteModalFlow(flow);
  };

  const confirmDelete = () => {
    if (deleteModalFlow) {
      deleteFlow(deleteModalFlow.id);
      setToast({ message: "Flujo eliminado correctamente", type: "success" });
      setDeleteModalFlow(null);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Toast Notification */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Delete Confirmation Modal */}
      {deleteModalFlow && (
        <DeleteModal
          flowName={deleteModalFlow.name}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteModalFlow(null)}
        />
      )}

      {view === "dashboard" ? (
        /* ==================== DASHBOARD VIEW ==================== */
        <div className="w-1/2 mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Flujos <span className="text-orange-500">Conversacionales</span>
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mt-1">
                Configura las integraciones API para tu bot
              </p>
            </div>
            {flows.length > 0 && (
              <button
                onClick={startNewFlow}
                className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-xl shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 transition-all font-medium"
              >
                <Plus className="w-5 h-5" />
                Nuevo Flujo
              </button>
            )}
          </div>

          {/* Content */}
          {flows.length === 0 ? (
            <EmptyState onCreateNew={startNewFlow} />
          ) : (
            <div className="flex flex-col gap-4">
              {flows.map((flow) => (
                <FlowCard
                  key={flow.id}
                  flow={flow}
                  onEdit={() => startEditFlow(flow.id)}
                  onDelete={() => handleDelete(flow)}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        /* ==================== EDITOR VIEW (WIZARD) ==================== */
        <div className="max-w-3xl mx-auto">
          {/* Editor Header */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => setView("dashboard")}
              className="flex items-center gap-1.5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
              Volver
            </button>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {editingFlowId ? "Editar Flujo" : "Crear Nuevo Flujo"}
            </h2>
            <div className="w-16" /> {/* Spacer for centering */}
          </div>

          {/* Progress Bar */}
          <WizardProgress currentStep={currentStep} totalSteps={TOTAL_STEPS} />

          {/* Step Content */}
          <div className="bg-white dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50 rounded-2xl p-6 shadow-sm mb-6">
            {currentStep === 0 && (
              <Step1General data={formData} onChange={handleFormChange} errors={errors} />
            )}
            {currentStep === 1 && (
              <Step2Endpoints data={formData} onChange={handleFormChange} errors={errors} />
            )}
            {currentStep === 2 && (
              <Step3Responses data={formData} onChange={handleFormChange} errors={errors} />
            )}
            {currentStep === 3 && (
              <Step4Preview data={formData} openApiSchema={openApiSchema} />
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between">
            <button
              onClick={goPrevStep}
              disabled={currentStep === 0}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all ${
                currentStep === 0
                  ? "text-gray-300 dark:text-gray-600 cursor-not-allowed"
                  : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
            >
              <ChevronLeft className="w-5 h-5" />
              Anterior
            </button>

            {currentStep < TOTAL_STEPS - 1 ? (
              <button
                onClick={goNextStep}
                className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-xl shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 transition-all font-medium"
              >
                Siguiente
                <ChevronRight className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={handleSave}
                className="flex items-center justify-center gap-3 bg-green-500 hover:bg-green-600 text-white px-10 py-4 rounded-xl shadow-lg shadow-green-500/25 hover:shadow-green-500/40 transition-all font-semibold text-lg min-w-[200px]"
              >
                <CheckCircle className="w-6 h-6" />
                Guardar Flujo
              </button>
            )}
          </div>
        </div>
      )}

      {/* Custom Styles */}
      <style>{`
        @keyframes slide-in {
          from {
            opacity: 0;
            transform: translateX(100%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}
