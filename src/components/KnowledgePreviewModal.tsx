import { X, FileText, FileSpreadsheet, File, Eye } from "lucide-react";
import { useState } from "react";

type MockFile = {
  name: string;
  type: string;
  size: string;
};

const mockFiles: MockFile[] = [
  { name: "instrucciones_asistente.pdf", type: "pdf", size: "240 KB" },
  { name: "datos_clientes.xlsx", type: "xlsx", size: "1.2 MB" },
  { name: "guia_rapida.txt", type: "txt", size: "12 KB" },
];

export default function KnowledgePreviewModal() {
  const [selectedFile, setSelectedFile] = useState<MockFile | null>(null);

  const getIcon = (type: string) => {
    switch (type) {
      case "pdf":
        return <FileText className="w-5 h-5 text-red-500" />;
      case "xlsx":
        return <FileSpreadsheet className="w-5 h-5 text-green-500" />;
      default:
        return <File className="w-5 h-5 text-gray-500" />;
    }
  };

  return (
    <div className="glass dark:glass-dark rounded-3xl p-6 border border-white/50 dark:border-white/10 shadow-xl shadow-orange-500/5">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        Documentos Subidos
      </h2>

      <div className="space-y-3">
        {mockFiles.map((file, i) => (
          <div
            key={i}
            className="flex items-center justify-between bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl px-4 py-3 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700">
                {getIcon(file.type)}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                  {file.name}
                </p>
                <p className="text-xs text-gray-500">{file.size}</p>
              </div>
            </div>

            <button
              onClick={() => setSelectedFile(file)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-orange-500 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-all"
            >
              <Eye className="w-4 h-4" />
              Previsualizar
            </button>
          </div>
        ))}
      </div>

      {selectedFile && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-[fadeIn_0.2s_ease-out] p-4">
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden relative animate-[scaleIn_0.25s_ease-out]">
            <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {selectedFile.name}
              </h3>
              <button
                onClick={() => setSelectedFile(null)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 flex flex-col items-center justify-center h-[400px] text-gray-500 dark:text-gray-400">
              <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-2xl mb-3">
                {getIcon(selectedFile.type)}
              </div>
              <p className="text-sm">
                Aquí se mostrará la previsualización del archivo{" "}
                <span className="font-medium">{selectedFile.name}</span>.
              </p>
              <p className="text-xs text-gray-400 mt-2">
                (Simulación - contenido no cargado)
              </p>
            </div>

            <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 flex justify-end">
              <button
                onClick={() => setSelectedFile(null)}
                className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-medium transition-all"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0 }
            to { opacity: 1 }
          }
          @keyframes scaleIn {
            from { opacity: 0; transform: scale(0.95) }
            to { opacity: 1; transform: scale(1) }
          }
        `}
      </style>
    </div>
  );
}
