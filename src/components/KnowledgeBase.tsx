import { useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import {
  Upload,
  X,
  FileText,
  Send,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import Button from "./ui/Button";

type FormData = {
  prompt: string;
  files: File[];
};

export default function KnowledgeBase() {
  const { register, handleSubmit, setValue, watch, reset } = useForm<FormData>({
    defaultValues: { prompt: "", files: [] },
  });

  const files = watch("files");

  const [dragging, setDragging] = useState(false);
  const [showAllFiles, setShowAllFiles] = useState(false);

  const MAX_FILES_VISIBLE = 3;

  const visibleFiles = showAllFiles
    ? files
    : files.slice(0, MAX_FILES_VISIBLE);

  const hiddenCount = files.length - MAX_FILES_VISIBLE;
  const hasMoreFiles = hiddenCount > 0;

  const handleFilesAdded = (newFiles: FileList | null) => {
    if (!newFiles) return;
    setValue("files", [...files, ...Array.from(newFiles)], {
      shouldValidate: true,
    });
  };

  const handleRemoveFile = (index: number) => {
    setValue(
      "files",
      files.filter((_, i) => i !== index),
      { shouldValidate: true }
    );
  };

  const onSubmit: SubmitHandler<FormData> = (data) => {
    console.log("✅ Enviado:", data);
    alert("Datos enviados correctamente");
    reset();
    setShowAllFiles(false);
  };

  return (
    <div className="glass dark:glass-dark rounded-3xl p-6 border border-white/50 dark:border-white/10 shadow-xl shadow-orange-500/5">
      {/* ================= Header ================= */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 bg-orange-500/10 rounded-xl">
          <Sparkles className="w-5 h-5 text-orange-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          Base de Conocimiento
        </h2>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* ================= PROMPT ================= */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 ml-1">
            Instrucciones del Sistema
          </label>
          <textarea
            {...register("prompt", { required: "El prompt es obligatorio" })}
            rows={4}
            placeholder="Describe cómo debe comportarse el asistente..."
            className="w-full bg-white/60 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500/40 transition-all resize-none"
          />
        </div>

        {/* ================= ARCHIVOS ================= */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 ml-1">
            Documentos de Referencia
          </label>

          {/* DROPZONE */}
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
            onClick={() => document.getElementById("fileInput")?.click()}
            className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
              dragging
                ? "border-orange-500 bg-orange-50 dark:bg-orange-900/10"
                : "border-gray-200 dark:border-gray-700 hover:border-orange-400 hover:bg-gray-50 dark:hover:bg-gray-800/40"
            }`}
          >
            <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3">
              <Upload className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Sube o arrastra archivos
            </p>
            <p className="text-xs text-gray-400 mt-1">
              PDF, DOCX, TXT · máx. 10MB
            </p>

            <input
              id="fileInput"
              type="file"
              multiple
              hidden
              onChange={(e) => handleFilesAdded(e.target.files)}
            />
          </div>

          {/* ================= LISTA DE ARCHIVOS ================= */}
          {files.length > 0 && (
            <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white/60 dark:bg-gray-900/50 p-3 space-y-2">
              {visibleFiles.map((file, i) => (
                <div
                  key={i}
                  className="flex justify-between items-center px-3 py-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow"
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
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}

              {/* MOSTRAR MÁS / MENOS */}
              {hasMoreFiles && (
                <button
                  type="button"
                  onClick={() => setShowAllFiles((prev) => !prev)}
                  className="w-full flex items-center justify-center gap-2 text-sm font-medium text-orange-500 hover:text-orange-600 pt-2"
                >
                  {showAllFiles ? (
                    <>
                      Mostrar menos <ChevronUp size={16} />
                    </>
                  ) : (
                    <>
                      +{hiddenCount} documentos más <ChevronDown size={16} />
                    </>
                  )}
                </button>
              )}
            </div>
          )}
        </div>

        {/* ================= BOTÓN ================= */}
        <div className="pt-4">
          <Button
            text="Guardar Configuración"
            type="submit"
            className="w-full py-3.5 text-base shadow-lg shadow-orange-500/20"
            icon={<Send className="w-4 h-4" />}
          />
        </div>
      </form>
    </div>
  );
}
