import { Sparkles, FileText, Workflow, Info } from "lucide-react";

type SummaryFile = {
  name: string;
  type?: string;
  size?: string;
};

type SummaryFlow = {
  id: number;
  name: string;
};

type KnowledgeConfigSummaryProps = {
  prompt: string;
  files: SummaryFile[];
  flows: SummaryFlow[];
  environment: string
};

export default function KnowledgeConfigSummary({
  prompt,
  files,
  flows,
  environment
}: KnowledgeConfigSummaryProps) {
  const hasConfig = !!prompt || files.length > 0 || flows.length > 0;

  const shortPrompt =
    prompt.length > 180 ? `${prompt.slice(0, 180).trim()}...` : prompt || "";

  return (
    <div className="glass dark:glass-dark rounded-3xl p-6 border border-white/40 dark:border-white/10 shadow-xl shadow-orange-500/5 space-y-5">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-orange-500/10 rounded-xl">
          <Sparkles className="w-5 h-5 text-orange-500" />
        </div>
        <div>
          <p className="text-lg font-bold text-gray-900 dark:text-white">
            Resumen de Configuración actual <span className={`${environment === 'prod'?'text-green-500' : 'text-amber-500'}`}>{environment === 'prod' ? ' (Producción)' : ' (Pruebas)'}</span>
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Vista general de cómo está configurado el modelo.
          </p>
        </div>
      </div>

      {!hasConfig && (
        <div className="flex items-center gap-3 rounded-2xl bg-gray-50 dark:bg-gray-900/60 border border-dashed border-gray-200 dark:border-gray-700 px-4 py-3">
          <Info className="w-4 h-4 text-gray-400" />
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
            Aún no has configurado instrucciones, documentos ni flujos
            conectados.
          </p>
        </div>
      )}

      {shortPrompt && (
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Instrucciones del sistema
          </p>
          <div className="rounded-2xl bg-white/70 dark:bg-gray-900/70 border border-gray-100 dark:border-gray-700 px-4 py-3 text-sm text-gray-700 dark:text-gray-200 leading-relaxed">
            {shortPrompt}
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Documentos de referencia
          </p>
          {files.length === 0 ? (
            <div className="rounded-2xl bg-gray-50 dark:bg-gray-900/60 border border-dashed border-gray-200 dark:border-gray-700 px-4 py-3 text-xs text-gray-500 dark:text-gray-400">
              No hay documentos adjuntos.
            </div>
          ) : (
            <div className="rounded-2xl bg-white/70 dark:bg-gray-900/70 border border-gray-100 dark:border-gray-700 px-3 py-2.5 space-y-1.5">
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                <span className="flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  {files.length} documento{files.length !== 1 && "s"}
                </span>
              </div>
              {files.slice(0, 3).map((file, i) => (
                <p
                  key={i}
                  className="text-xs text-gray-700 dark:text-gray-200 truncate"
                >
                  {file.name}
                </p>
              ))}
              {files.length > 3 && (
                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                  +{files.length - 3} más
                </p>
              )}
            </div>
          )}
        </div>

        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Flujos conectados
          </p>
          {flows.length === 0 ? (
            <div className="rounded-2xl bg-gray-50 dark:bg-gray-900/60 border border-dashed border-gray-200 dark:border-gray-700 px-4 py-3 text-xs text-gray-500 dark:text-gray-400">
              No hay flujos vinculados a esta base.
            </div>
          ) : (
            <div className="rounded-2xl bg-white/70 dark:bg-gray-900/70 border border-gray-100 dark:border-gray-700 px-3 py-2.5 space-y-1.5">
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                <span className="flex items-center gap-1.5">
                  <Workflow className="w-3.5 h-3.5" />
                  {flows.length} flujo{flows.length !== 1 && "s"}
                </span>
              </div>
              {flows.slice(0, 3).map((flow) => (
                <p
                  key={flow.id}
                  className="text-xs text-gray-700 dark:text-gray-200 truncate"
                >
                  {flow.name}
                </p>
              ))}
              {flows.length > 3 && (
                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                  +{flows.length - 3} más
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
