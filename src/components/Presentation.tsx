import { useNavigate } from "react-router-dom";
import { Sparkles, ArrowRight, Cpu } from "lucide-react";

export default function Presentation() {
  const navigate = useNavigate();

  return (
    <div className="relative h-3/4 flex flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-black">
      {/* 💠 Efecto de fondo futurista */}
      <div className="absolute inset-0 overflow-hidden">
        <img
          src="https://cdn.pixabay.com/photo/2022/07/27/13/23/artificial-intelligence-7349247_1280.jpg"
          alt="IA Futurista"
          className="w-full h-full object-cover opacity-30 blur-sm"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-white/60 via-white/30 to-white/70 dark:from-black/60 dark:via-black/40 dark:to-black/80 backdrop-blur-sm" />
      </div>

      {/* 🧠 Contenido principal */}
      <main className="relative z-10 text-center max-w-3xl px-6 py-12 glass dark:glass-dark border border-white/10 rounded-3xl shadow-lg shadow-orange-500/10 backdrop-blur-2xl">
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-orange-500/10 rounded-2xl border border-orange-500/20">
            <Cpu className="w-8 h-8 text-orange-500" />
          </div>
        </div>

        <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-4 leading-tight">
          Bienvenido a <span className="text-orange-500">Anahuac IA</span>
        </h1>

        <p className="text-gray-600 dark:text-gray-300 text-base sm:text-lg mb-8">
          Una plataforma inteligente donde tus ideas cobran vida.  
          Crea, entrena y ejecuta flujos conversacionales potenciados por inteligencia artificial.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={() => navigate("/crear")}
            className="flex items-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-xl shadow-lg shadow-orange-500/30 transition-all group"
          >
            Comenzar a Crear
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>

          <button
            onClick={() => navigate("/flujos")}
            className="flex items-center gap-2 px-6 py-3 bg-white/60 dark:bg-gray-800/60 hover:bg-white/80 dark:hover:bg-gray-700/60 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-700 dark:text-gray-300 font-medium transition-all backdrop-blur-sm"
          >
            Ver mis flujos
          </button>
        </div>
      </main>
      <div className="absolute -bottom-10 left-10 w-48 h-48 bg-orange-500/20 blur-3xl rounded-full animate-pulse" />
      <div className="absolute top-20 right-20 w-56 h-56 bg-orange-400/10 blur-3xl rounded-full animate-pulse" />
      <footer className="relative z-10 mt-12 text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
        <Sparkles className="w-4 h-4 text-orange-400" />
        <span><span className="font-semibold">Bienvenido</span> Jonathan Robles</span>
      </footer>
    </div>
  );
}
