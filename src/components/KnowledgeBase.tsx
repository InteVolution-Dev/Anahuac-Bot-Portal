import { useEffect, useState } from "react";
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
import Swal from "sweetalert2";
import { deleteIndexFile, getIndexFiles, uploadIndexFiles, type StatusType } from "../api/documents";
import { formatDateTimeFriendly, formatFileSize } from "../utils/helpers";
import { useSpinnerStore } from "../store/useSpinner";
import { getSystemPrompt, updateSystemPrompt } from "../api/system_promt";

import { CheckCircle, AlertTriangle } from "lucide-react";
import { StatusIcon } from "./ui/StatusIcon";

export const STATUS_CONFIG: Record<
  StatusType,
  {
    Icon: React.ElementType;
    color: string;
    title: string;
  }
> = {
  INDEXED: {
    Icon: CheckCircle,
    color: "text-green-500",
    title:
      "El archivo fue cargado correctamente y forma parte de la base de conocimientos.",
  },
  FAILED: {
    Icon: AlertTriangle,
    color: "text-red-500",
    title:
      "El archivo fue cargado, sin embargo no pudo ser leído y no está siendo considerado en la base de conocimientos. Remuévalo e intente con otro archivo.",
  },
};

type FormData = {
  prompt: string;
  files: File[];
};

type CurrentDocument = {
  idDocument: string;
  nameDocument: string;
  createdAt: string;
  status: StatusType;
  size: number
};


const ALLOWED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
];

const MAX_FILE_SIZE_MB = 100;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
type KnowledgeBaseProps = {
  clearChat: () => void;
};

export default function KnowledgeBase({
  clearChat,
}: KnowledgeBaseProps) {
  const { register, handleSubmit, setValue, watch } = useForm<FormData>({
    defaultValues: { prompt: "", files: [] },
  });
  const [currentDocuments, setCurrentDocuments] = useState<CurrentDocument[]>([]);
  const MAX_DOCS_VISIBLE = 3;
  const [showAllDocuments, setShowAllDocuments] = useState(false);
  const openSpinner = useSpinnerStore((s) => s.openSpinner);
  const closeSpinner = useSpinnerStore((s) => s.closeSpinner);

  const handleRemoveCurrentDocument = async (doc: CurrentDocument) => {
    const result = await Swal.fire({
      icon: "warning",
      title: "Eliminar documento",
      text: `¿Estás seguro de que deseas eliminar "${doc.nameDocument}"?`,
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#f97316", // naranja UI
      cancelButtonColor: "#9ca3af", // gris suave
      reverseButtons: true,
      focusCancel: true,
    });

    if (!result.isConfirmed) return;

    try {
      openSpinner();

      await deleteIndexFile({
        fileRowKey: doc.idDocument,
      });
      await fetchCurrentDocuments();

      Swal.fire({
        icon: "success",
        title: "Documento eliminado",
        text: "El documento se eliminó correctamente",
        confirmButtonColor: "#f97316",
      });
      clearChat()

    } catch (error) {
      console.error(error);

      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo eliminar el documento",
        confirmButtonColor: "#f97316",
      });
    } finally {
      closeSpinner();
    }
  };

  const files = watch("files");

  const [dragging, setDragging] = useState(false);
  const [showAllFiles, setShowAllFiles] = useState(false);
  const visibleDocuments = showAllDocuments
    ? currentDocuments
    : currentDocuments.slice(0, MAX_DOCS_VISIBLE);

  const hiddenDocumentsCount =
    currentDocuments.length - MAX_DOCS_VISIBLE;

  const hasMoreDocuments = hiddenDocumentsCount > 0;


  const MAX_FILES_VISIBLE = 3;

  const visibleFiles = showAllFiles
    ? files
    : files.slice(0, MAX_FILES_VISIBLE);

  const hiddenCount = files.length - MAX_FILES_VISIBLE;
  const hasMoreFiles = hiddenCount > 0;
  const MAX_FILES_ALLOWED = 3;

  const handleFilesAdded = async (newFiles: FileList | null) => {
    if (!newFiles) return;

    const incomingFiles = Array.from(newFiles);

    // 🚫 Validar máximo de archivos
    if (files.length + incomingFiles.length > MAX_FILES_ALLOWED) {
      Swal.fire({
        icon: "warning",
        title: "Límite de archivos",
        text: `Solo se pueden subir un máximo de ${MAX_FILES_ALLOWED} archivos.`,
        confirmButtonColor: "#f97316",
      });
      return;
    }

    // 🔍 Validar tipos
    const invalidTypeFiles = incomingFiles.filter(
      (file) => !ALLOWED_TYPES.includes(file.type)
    );

    if (invalidTypeFiles.length > 0) {
      Swal.fire({
        icon: "error",
        title: "Formato no válido",
        text: "Solo se permiten archivos PDF, DOCX o TXT",
        confirmButtonColor: "#f97316",
      });
      return;
    }

    // 📦 Validar tamaño
    const oversizedFiles = incomingFiles.filter(
      (file) => file.size > MAX_FILE_SIZE_BYTES
    );

    if (oversizedFiles.length > 0) {
      Swal.fire({
        icon: "error",
        title: "Archivo demasiado grande",
        text: `El tamaño máximo permitido es ${MAX_FILE_SIZE_MB} MB`,
        confirmButtonColor: "#f97316",
      });
      return;
    }

    let updatedFiles = [...files];

    for (const incomingFile of incomingFiles) {
      const existingIndex = updatedFiles.findIndex(
        (f) => f.name === incomingFile.name
      );

      if (existingIndex !== -1) {
        const result = await Swal.fire({
          icon: "warning",
          title: "Archivo duplicado",
          text: `Ya existe un archivo llamado "${incomingFile.name}". ¿Deseas reemplazarlo?`,
          showCancelButton: true,
          confirmButtonText: "Sí, reemplazar",
          cancelButtonText: "Cancelar",
          confirmButtonColor: "#f97316",
        });

        if (result.isConfirmed) {
          updatedFiles.splice(existingIndex, 1, incomingFile);
        }
      } else {
        updatedFiles.push(incomingFile);
      }
    }

    setValue("files", updatedFiles, { shouldValidate: true });

    const input = document.getElementById("fileInput") as HTMLInputElement;
    if (input) input.value = "";
  };


  const handleRemoveFile = (index: number) => {
    setValue(
      "files",
      files.filter((_, i) => i !== index),
      { shouldValidate: true }
    );
  };

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    try {
      openSpinner();
      await updateSystemPrompt({
        promptText: data.prompt,
      });

      if (data.files.length > 0) {
        const response = await uploadIndexFiles(data.files);

        const failedFiles = response.data.filter(
          (file) => file.status === "FAILED"
        );

        if (failedFiles.length > 0) {
          Swal.fire({
            icon: "warning",
            title: "Carga parcial",
            html: `
            Algunos archivos no se pudieron indexar:
            <ul style="text-align:left;margin-top:8px">
              ${failedFiles
                .map(
                  (f) =>
                    `<li>• ${f.originalName}: ${f.errorMessage ?? "Error desconocido"
                    }</li>`
                )
                .join("")}
            </ul>
          `,
            confirmButtonColor: "#f97316",
          });
        }
      }

      Swal.fire({
        icon: "success",
        title: "Configuración guardada",
        text: "El sistema se actualizó correctamente",
        confirmButtonColor: "#22c55e",
      });
      await fetchCurrentDocuments();
      setValue("files", []);
      setShowAllFiles(false);
      clearChat()

    } catch (error) {
      console.error(error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo guardar la configuración",
        confirmButtonColor: "#f97316",
      });
    } finally {
      closeSpinner();
    }
  };


  const fetchSystemPrompt = async () => {
    try {
      openSpinner();

      const response = await getSystemPrompt();

      setValue("prompt", response.data.promptText);

    } catch (error) {
      console.error(error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo cargar la configuración del sistema",
        confirmButtonColor: "#f97316",
      });
    } finally {
      closeSpinner();
    }
  };


  const fetchCurrentDocuments = async () => {
    try {
      openSpinner()
      const response = await getIndexFiles();
      const mappedDocuments: CurrentDocument[] =
        response.data.files.map((file) => ({
          idDocument: file.id,
          size: file.size,
          nameDocument: file.originalName,
          createdAt: file.createdAt,
          status: file.status
        }));

      setCurrentDocuments(mappedDocuments);
      closeSpinner()
    } catch (error) {
      closeSpinner()
      console.error(error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudieron cargar los documentos actuales",
        confirmButtonColor: "#f97316",
      });
    }
  };

  useEffect(() => {
    fetchCurrentDocuments();
    fetchSystemPrompt();
  }, []);



  return (
    <div className="h-full flex flex-col glass dark:glass-dark rounded-3xl p-6 border border-white/50 dark:border-white/10 shadow-xl shadow-orange-500/5">
      {/* ================= Header ================= */}
      <div className="flex items-center gap-3 mb-6 shrink-0">
        <div className="p-2.5 bg-orange-500/10 rounded-xl">
          <Sparkles className="w-5 h-5 text-orange-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          Base de Conocimiento
        </h2>
      </div>

      {/* ================= FORM (SCROLL AQUÍ) ================= */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex-1 space-y-6 pr-1"
      >
        {/* PROMPT */}
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

        {/* ARCHIVOS */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 ml-1">
            Documentos por subir
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
            onClick={() => document.getElementById("fileInput")?.click()}
            className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${dragging
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
              PDF, DOCX, TXT · máx. 100MB
            </p>

            <input
              id="fileInput"
              type="file"
              multiple
              accept=".pdf,.docx,.txt"
              hidden
              onChange={(e) => handleFilesAdded(e.target.files)}
            />
          </div>

          {files.length > 0 && (
            <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white/60 dark:bg-gray-900/50 p-3 space-y-2">
              {visibleFiles.map((file, i) => (
                <div
                  key={i}
                  className="flex justify-between items-center px-3 py-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <FileText className="w-4 h-4 text-blue-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">
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
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-500"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}

              {hasMoreFiles && (
                <button
                  type="button"
                  onClick={() => setShowAllFiles((prev) => !prev)}
                  className="w-full flex items-center justify-center gap-2 text-sm font-medium text-orange-500 pt-2"
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
        <div>
          <div className="pt-4 shrink-0">
            <Button
              text="Guardar Configuración"
              type="submit"
              className="w-full py-3.5 mb-8"
              icon={<Send className="w-4 h-4" />}
            />
          </div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 ml-1">
            Documentos actuales
          </label>
          {currentDocuments.length > 0 ? (
            <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white/60 dark:bg-gray-900/50 p-3 space-y-2">
              {visibleDocuments.map((doc) => (
                <div
                  key={doc.idDocument}
                  className="flex justify-between items-center px-3 py-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <FileText className="w-4 h-4 text-green-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">
                        {doc.nameDocument}
                      </p>
                      <p className="text-xs text-gray-400">
                        {formatDateTimeFriendly(doc.createdAt)}
                      </p>
                      <p className="inline-flex items-center rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                        {formatFileSize(doc.size)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusIcon status={doc.status} />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveCurrentDocument(doc)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-500"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}

              {hasMoreDocuments && (
                <button
                  type="button"
                  onClick={() => setShowAllDocuments((prev) => !prev)}
                  className="w-full flex items-center justify-center gap-2 text-sm font-medium text-orange-500 pt-2"
                >
                  {showAllDocuments ? (
                    <>
                      Ver menos <ChevronUp size={16} />
                    </>
                  ) : (
                    <>
                      +{hiddenDocumentsCount} documentos más <ChevronDown size={16} />
                    </>
                  )}
                </button>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-400 ml-1">
              No hay documentos cargados
            </p>
          )}

        </div>
      </form>
    </div>
  );
}
