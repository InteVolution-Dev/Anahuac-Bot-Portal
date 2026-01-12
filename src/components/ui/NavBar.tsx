import { useNavigate, useLocation } from "react-router-dom";
import {
  Bot,
  Home,
  Workflow,
  Brain,
  TerminalSquare,
  LogOut,
  Rocket,
} from "lucide-react";
import { deployChangeAgent } from "../../api/deploy";
import { useSpinnerStore } from "../../store/useSpinner";
import Swal from "sweetalert2";

export default function SideNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const openSpinner = useSpinnerStore((s) => s.openSpinner);
  const closeSpinner = useSpinnerStore((s) => s.closeSpinner);

  const onUploadChangeDeployAgent = async () => {
    try {
      openSpinner()
      const response = await deployChangeAgent();
      Swal.fire({
        title: "¡Éxito!",
        text: "Cambios listos en el Agente de producción",
        icon: "success",
      });
      console.log("Deploy success:", response.code.message);

    } catch (error: any) {
      console.error("Deploy failed:", error.message);
      closeSpinner()
      Swal.fire({
        title: "¡Error!",
        text: "Algo salio mal al tratar de subir los cambios",
        icon: "error",
      });

    } finally {
      closeSpinner()
    }
  };

  const confirmUpload = async () => {
  const result = await Swal.fire({
    title: "¿Estás seguro?",
    text: "Esta acción subira los cambios al agente de producción",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#f97316",
    cancelButtonColor: "#6b7280",
    confirmButtonText: "Sí, confirmar",
    cancelButtonText: "Cancelar",
  });
  if (result.isConfirmed) {
    onUploadChangeDeployAgent();
  } 
};

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("username");
    navigate("/login");
  };

  const isActive = (path: string) =>
    location.pathname === path ||
    location.pathname.startsWith(`${path}/`);

  return (
    <aside className="fixed top-0 left-0 h-full w-60 bg-white dark:bg-gray-900 
                      border-r border-gray-200 dark:border-gray-800 
                      flex flex-col justify-between shadow-lg">

      {/* 🔸 Logo */}
      <div>
        <div
          onClick={() => navigate("/home")}
          className="flex items-center gap-3 px-6 py-6 cursor-pointer 
                     hover:bg-orange-50 dark:hover:bg-gray-800 transition-colors"
        >
          <div className="p-2 bg-orange-500/10 rounded-xl">
            <Bot className="w-6 h-6 text-orange-500" />
          </div>
          <span className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">
            Anahuac <span className="text-orange-500">IA</span>
          </span>
        </div>

        {/* 🔸 Menú principal */}
        <nav className="mt-4 flex flex-col gap-1">

          {/* Inicio */}
          <button
            onClick={() => navigate("/home")}
            className={`flex items-center gap-3 px-6 py-3 text-sm font-medium rounded-lg transition-all 
              ${isActive("/home")
                ? "bg-orange-50 text-orange-600 dark:bg-gray-800 dark:text-orange-400"
                : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200"
              }`}
          >
            <Home className="w-4 h-4" />
            Inicio
          </button>

          {/* Flujos */}
          <button
            onClick={() => navigate("/flows")}
            className={`flex items-center gap-3 px-6 py-3 text-sm font-medium rounded-lg transition-all 
              ${isActive("/flows") || isActive("/edit-flow")
                ? "bg-orange-50 text-orange-600 dark:bg-gray-800 dark:text-orange-400"
                : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200"
              }`}
          >
            <Workflow className="w-4 h-4" />
            Flujos
          </button>
          {/* Playground */}
          <button
            onClick={() => navigate("/playground")}
            className={`flex items-center gap-3 px-6 py-3 text-sm font-medium rounded-lg transition-all 
              ${isActive("/playground")
                ? "bg-orange-50 text-orange-600 dark:bg-gray-800 dark:text-orange-400"
                : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200"
              }`}
          >
            <TerminalSquare className="w-4 h-4" />
            Playground
          </button>
        </nav>
      </div>
      <div className="px-4">
        <button
          className="flex items-center gap-2 px-4 py-2 w-full justify-center rounded-xl 
             border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 
             text-gray-700 dark:text-gray-300 font-medium shadow-sm transition-all 
             hover:bg-gray-50 dark:hover:bg-gray-700/60"
          onClick={confirmUpload}
        >
          Desplegar

          <Rocket
            className="w-4 h-4 text-orange-500 "
          />
        </button>
      </div>



      {/* 🔸 Logout */}
      <div className="mb-6 px-6">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-4 py-2 text-sm font-medium 
                     text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 
                     rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Salir
        </button>
      </div>
    </aside>
  );
}
