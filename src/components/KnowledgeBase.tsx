import { useState, useEffect } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { Upload, X, Workflow, FileText, Send, Sparkles } from "lucide-react";
import Button from "./ui/Button";

type Flow = {
  id: number;
  name: string;
  description?: string;
};

type FormData = {
  prompt: string;
  files: File[];
  flows: Flow[];
};

export default function KnowledgeBase() {
  const { register, handleSubmit, setValue, watch, reset } = useForm<FormData>({
    defaultValues: { prompt: "", files: [], flows: [] },
  });

  const files = watch("files");
  const selectedFlows = watch("flows");

  const [dragging, setDragging] = useState(false);
  const [showFlowSelector, setShowFlowSelector] = useState(false);
  const [storedFlows, setStoredFlows] = useState<Flow[]>([]);

  // 📦 Cargar flujos desde localStorage al abrir el modal
  useEffect(() => {
    if (showFlowSelector) {
      const flujosData = localStorage.getItem("flujos");
      if (flujosData) {
        try {
          const parsed = JSON.parse(flujosData);
          if (Array.isArray(parsed)) {
            // Convertimos solo los datos relevantes
            const cleaned = parsed.map((f) => ({
              id: f.id,
              name: f.name,
              description: f.description,
            }));
            setStoredFlows(cleaned);
          } else {
            setStoredFlows([]);
          }
        } catch (error) {
          console.error("Error al parsear los flujos:", error);
          setStoredFlows([]);
        }
      } else {
        setStoredFlows([]);
      }
    }
  }, [showFlowSelector]);

  const handleFilesAdded = (newFiles: FileList | null) => {
    if (!newFiles) return;
    const updated = [...files, ...Array.from(newFiles)];
    setValue("files", updated, { shouldValidate: true });
  };

  const handleRemoveFile = (index: number) => {
    const updated = files.filter((_, i) => i !== index);
    setValue("files", updated, { shouldValidate: true });
  };

  const handleToggleFlow = (flow: Flow) => {
    const already = selectedFlows.find((f) => f.id === flow.id);
    let updated;
    if (already) {
      updated = selectedFlows.filter((f) => f.id !== flow.id);
    } else {
      updated = [...selectedFlows, flow];
    }
    setValue("flows", updated, { shouldValidate: true });
  };

  const handleRemoveFlow = (id: number) => {
    setValue(
      "flows",
      selectedFlows.filter((f) => f.id !== id),
      { shouldValidate: true }
    );
  };

  const onSubmit: SubmitHandler<FormData> = (data) => {
    console.log("✅ Enviado:", data);
    alert("Datos enviados correctamente");
    reset();
  };

  return (
    <div className="glass dark:glass-dark rounded-3xl p-6 border border-white/50 dark:border-white/10 shadow-xl shadow-orange-500/5">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 bg-orange-500/10 rounded-xl">
          <Sparkles className="w-5 h-5 text-orange-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          Base de Conocimiento
        </h2>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* PROMPT */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 ml-1">
            Instrucciones del Sistema
          </label>
          <textarea
            {...register("prompt", { required: "El prompt es obligatorio" })}
            rows={4}
            placeholder="Describe cómo debe comportarse el asistente..."
            className="w-full bg-white/50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all resize-none"
          />
        </div>

        {/* SECCIÓN: ARCHIVOS */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 ml-1">
            Documentos de Referencia
          </label>
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              handleFilesAdded(e.dataTransfer.files);
            }}
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 group ${dragging
                ? "border-orange-500 bg-orange-50 dark:bg-orange-900/10"
                : "border-gray-200 dark:border-gray-700 hover:border-orange-400 hover:bg-gray-50 dark:hover:bg-gray-800/50"
              }`}
            onClick={() => document.getElementById("fileInput")?.click()}
          >
            <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
              <Upload className="w-6 h-6 text-gray-400 group-hover:text-orange-500 transition-colors" />
            </div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Sube o arrastra archivos
            </p>
            <p className="text-xs text-gray-400 mt-1">
              PDF, DOCX, TXT hasta 10MB
            </p>
            <input
              id="fileInput"
              type="file"
              multiple
              hidden
              onChange={(e) => handleFilesAdded(e.target.files)}
            />
          </div>

          {/* LISTA DE ARCHIVOS */}
          {files.length > 0 && (
            <div className="space-y-2">
              {files.map((file, i) => (
                <div
                  key={i}
                  className="flex justify-between items-center px-4 py-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <FileText className="w-4 h-4 text-blue-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate text-gray-700 dark:text-gray-200">
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-400">
                        {(file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveFile(i)}
                    className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 rounded-lg transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SECCIÓN: FLUJOS */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 ml-1">
            Flujos Conectados
          </label>

          {selectedFlows.length > 0 && (
            <div className="space-y-2 mb-3">
              {selectedFlows.map((flow) => (
                <div
                  key={flow.id}
                  className="flex justify-between items-center px-4 py-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                      <Workflow className="w-4 h-4 text-orange-500" />
                    </div>
                    <div>
                      <p className="font-medium text-sm text-gray-700 dark:text-gray-200">{flow.name}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveFlow(flow.id)}
                    className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 rounded-lg transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={() => setShowFlowSelector(true)}
            className="w-full py-3 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:border-orange-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/10 transition-all flex items-center justify-center gap-2"
          >
            <Workflow className="w-4 h-4" />
            Conectar Flujo Existente
          </button>
        </div>

        {/* BOTONES */}
        <div className="pt-4">
          <Button
            text="Guardar Configuración"
            type="submit"
            className="w-full py-3.5 text-base shadow-lg shadow-orange-500/20"
            icon={<Send className="w-4 h-4" />}
          />
        </div>
      </form>

      {/* MODAL DE SELECCIÓN DE FLUJOS */}
      {showFlowSelector && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-[fadeIn_0.2s_ease-out]">
            <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Seleccionar Flujos
              </h3>
              <button
                onClick={() => setShowFlowSelector(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-4 max-h-[60vh] overflow-y-auto">
              {storedFlows.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Workflow className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No hay flujos disponibles</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {storedFlows.map((flow) => {
                    const isSelected = !!selectedFlows.find(
                      (f) => f.id === flow.id
                    );
                    return (
                      <div
                        key={flow.id}
                        onClick={() => handleToggleFlow(flow)}
                        className={`p-4 cursor-pointer rounded-xl border transition-all duration-200 flex items-center justify-between group ${isSelected
                            ? "bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800"
                            : "bg-gray-50 border-transparent hover:bg-white hover:border-gray-200 dark:bg-gray-800/50 dark:hover:bg-gray-800"
                          }`}
                      >
                        <div>
                          <p className={`font-medium ${isSelected ? "text-orange-700 dark:text-orange-400" : "text-gray-700 dark:text-gray-200"}`}>
                            {flow.name}
                          </p>
                          {flow.description && (
                            <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                              {flow.description}
                            </p>
                          )}
                        </div>
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${isSelected
                            ? "bg-orange-500 border-orange-500"
                            : "border-gray-300 group-hover:border-orange-400"
                          }`}>
                          {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 flex justify-end">
              <button
                onClick={() => setShowFlowSelector(false)}
                className="px-6 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-medium hover:opacity-90 transition-opacity"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
