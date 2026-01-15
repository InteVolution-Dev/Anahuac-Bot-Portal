import { useNavigate } from "react-router-dom";
import WindowsIcon from "../assets/brand-windows.svg?react";
import { Bot, Sparkles } from "lucide-react";
import { useMsal } from "@azure/msal-react";
// Local imports
import { apiScopes } from "../utils/authConfig";


const Login = () => {
  const navigate = useNavigate();
  const { instance } = useMsal();

  const handleMicrosoftLogin = async () => {
    try {
      const loginResponse = await instance.loginPopup({
        scopes: ["openid", "profile", "email"],
      });
      // 🔑 ESTO ES CLAVE
      instance.setActiveAccount(loginResponse.account);
      const account = instance.getActiveAccount();

      if (!account) {
        throw new Error("No active account found");
      }

      const tokenResponse = await instance.acquireTokenSilent({
        scopes: apiScopes,
        account
      });
      // localStorage.setItem("accessToken", response.accessToken);
      const apiAccessToken = tokenResponse.accessToken;
      localStorage.setItem("accessToken", apiAccessToken);

      localStorage.setItem(
        "user",
        JSON.stringify({
          name: tokenResponse.account?.name,
          email: tokenResponse.account?.username,
        })
      );

      navigate("/home");
    } catch (error) {
      console.error("Microsoft login error", error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gray-50 dark:bg-gray-950">
      {/* Background */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-orange-400/20 blur-[100px]" />
        <div className="absolute top-[40%] -right-[10%] w-[40%] h-[40%] rounded-full bg-blue-400/20 blur-[100px]" />
      </div>

      {/* Card */}
      <div className="w-full max-w-md z-10 p-4">
        <div className="glass dark:glass-dark rounded-3xl shadow-2xl shadow-orange-500/10 p-8 md:p-10 border border-white/50 dark:border-white/10">

          {/* Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-orange-500/10 mb-6">
              <Bot className="w-8 h-8 text-orange-500" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Bienvenido a <span className="text-orange-500">Anahuac IA</span>
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              Tu asistente inteligente para la gestión de flujos
            </p>
          </div>

          {/* Login Button */}
          <div className="space-y-4">
            <button
              onClick={handleMicrosoftLogin}
              className="w-full flex items-center justify-center gap-3 bg-[#2F2F2F] hover:bg-[#1a1a1a] text-white py-3.5 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-medium"
            >
              <WindowsIcon className="w-5 h-5" />
              <span>Continuar con Microsoft</span>
            </button>

            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200 dark:border-gray-800"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white/50 dark:bg-gray-900/50 text-gray-500 backdrop-blur-sm">
                  Acceso seguro
                </span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
              <Sparkles className="w-4 h-4 text-orange-400" />
              <span>Powered by Intevolution</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Login;
