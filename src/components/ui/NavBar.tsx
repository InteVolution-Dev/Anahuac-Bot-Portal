import { useNavigate, useLocation } from "react-router-dom";
import { Bot, Home, Settings, LogOut, TerminalSquare, Workflow, Brain, BookCopy } from "lucide-react";

export default function SideNav() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("username");
    navigate("/login");
  };

  const isActive = (path: string) =>
  location.pathname === path || location.pathname.startsWith(`${path}/`);


  return (
    <aside className="fixed top-0 left-0 h-full w-60 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col justify-between shadow-lg">
      {/* 🔸 Logo y navegación principal */}
      <div>
        {/* Logo */}
        <div
          onClick={() => navigate("/home")}
          className="flex items-center gap-3 px-6 py-6 cursor-pointer hover:bg-orange-50 dark:hover:bg-gray-800 transition-colors"
        >
          <div className="p-2 bg-orange-500/10 rounded-xl">
            <Bot className="w-6 h-6 text-orange-500" />
          </div>
          <span className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">
            Anahuac <span className="text-orange-500">IA</span>
          </span>
        </div>

        {/* Menú */}
        <nav className="mt-4 flex flex-col gap-1">
          <button
            onClick={() => navigate("/home")}
            className={`flex items-center gap-3 px-6 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${isActive("/home")
              ? "bg-orange-50 text-orange-600 dark:bg-gray-800 dark:text-orange-400"
              : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200"
              }`}
          >
            <Home className="w-4 h-4" />
            Inicio
          </button>
          <button
            onClick={() => navigate("/flows")}
            className={`flex items-center gap-3 px-6 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
  isActive("/flows") || isActive("/edit-flow")
    ? "bg-orange-50 text-orange-600 dark:bg-gray-800 dark:text-orange-400"
    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200"
}`}


          >
            <Workflow className="w-4 h-4" />
            Flujos
          </button>
          <button
            onClick={() => navigate("/knowledge-base")}
            className={`flex items-center gap-3 px-6 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${isActive("/knowledge-base")
              ? "bg-orange-50 text-orange-600 dark:bg-gray-800 dark:text-orange-400"
              : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200"
              }`}
          > <Brain className="w-4 h-4" />

            Base de conocimientos
          </button>
          <button
            onClick={() => navigate("/playground")}
            className={`flex items-center gap-3 px-6 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${isActive("/playground")
              ? "bg-orange-50 text-orange-600 dark:bg-gray-800 dark:text-orange-400"
              : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200"
              }`}
          >
            <TerminalSquare className="w-4 h-4" />
            Playground
          </button>
        </nav>
      </div>

      {/* 🔹 Botón de Cerrar Sesión */}
      <div className="mb-6 px-6">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-4 py-2 text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors duration-200"
        >
          <LogOut className="w-4 h-4" />
          Salir
        </button>
      </div>
    </aside>
  );
}
