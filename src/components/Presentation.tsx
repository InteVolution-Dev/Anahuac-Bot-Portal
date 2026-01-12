import { Cpu } from "lucide-react";

export default function Presentation() {
  return (
    <div className="flex flex-col items-center justify-center text-center px-6 relative">
      <div className="relative z-10 max-w-xl p-8 rounded-2xl border border-white/10 backdrop-blur-xl bg-white/40 dark:bg-black/30 shadow-lg">
        
        <div className="flex justify-center mb-4">
          <Cpu className="w-10 h-10 text-orange-500" />
        </div>

        <p className="text-3xl font-bold text-gray-900 dark:text-white">
          Bienvenido a <span className="text-orange-500">Anahuac IA</span>
        </p>
      </div>
    </div>
  );
}
