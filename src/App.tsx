import { Route, Routes, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { useMsal } from "@azure/msal-react";

import Login from "./components/Login";
import ProtectedRoute from "./components/ProtectedRoute";
import Home from "./app/pages/HomePage";
import FlowsPage from "./app/pages/FlowsPage";
import CreateFlowPage from "./app/pages/CreateFlowPage";
import PlaygroundPage from "./app/pages/PlaygroundPage";
import EditFlowPage from "./app/pages/EditFlowPage";

import { useSpinnerStore } from "./store/useSpinner";
import Spinner from "./components/ui/Spinner";

function App() {
  const spinner = useSpinnerStore((s) => s.spinner);
  const { instance } = useMsal();

  useEffect(() => {
    const accounts = instance.getAllAccounts();

    if (accounts.length > 0 && !instance.getActiveAccount()) {
      instance.setActiveAccount(accounts[0]);
    }
  }, [instance]);

  return (
    <>
      {spinner && <Spinner />}

      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Navigate to="/login" replace />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/home" element={<Home />} />
          <Route path="/flows" element={<FlowsPage />} />
          <Route path="/create-flow" element={<CreateFlowPage />} />
          <Route path="/edit-flow/:id" element={<EditFlowPage />} />
          <Route path="/playground" element={<PlaygroundPage />} />
        </Route>
      </Routes>
    </>
  );
}

export default App;
