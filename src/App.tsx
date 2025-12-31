import { Route, Routes, Navigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import Login from "./components/Login";
import ProtectedRoute from "./components/ProtectedRoute";
import Home from "./app/pages/HomePage";
import FlowsPage from "./app/pages/FlowsPage";
import CreateFlowPage from "./app/pages/CreateFlowPage";
import PlaygroundPage from "./app/pages/PlaygroundPage";
import EditFlowPage from "./app/pages/EditFlowPage";
import KnowledgeBasePage from "./app/pages/KnowledgeBasePage";
import { useSpinnerStore } from "./store/useSpinner";
import Spinner from "./components/ui/Spinner";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(
    localStorage.getItem("isLoggedIn") === "true"
  );

  const location = useLocation();

  // Escuchar cambios en el almacenamiento (por ejemplo, al cerrar sesión)
  useEffect(() => {
    const handleStorageChange = () => {
      setIsLoggedIn(localStorage.getItem("isLoggedIn") === "true");
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // Actualiza estado al cambiar de ruta (por ejemplo, después de iniciar sesión)
  useEffect(() => {
    setIsLoggedIn(localStorage.getItem("isLoggedIn") === "true");
  }, [location]);

  const spinner = useSpinnerStore((s) => s.spinner);

  return (
    <>
    {spinner&&(<Spinner/>)}
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Navigate to="/login" />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/flows" element={<FlowsPage />} />
          <Route path="/knowledge-base" element={<KnowledgeBasePage />} />
          <Route path="/create-flow" element={<CreateFlowPage />} />
          <Route path="/edit-flow/:id" element={<EditFlowPage />} />
          <Route path="/playground" element={<PlaygroundPage />} />
          <Route path="/home" element={<Home />} />
        </Route>
      </Routes>
    </>
  );
}

export default App;
