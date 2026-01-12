import { useForm, type SubmitHandler } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import Input from "./ui/Input";
import Modal from "./ui/Modal";
import Button from "./ui/Button";
import WindowsIcon from "../assets/brand-windows.svg?react";
import { useState } from "react";
import { Bot, Sparkles } from "lucide-react";

interface Inputs {
  email: string;
  password: string;
}

const Login = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Inputs>();
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);

  const onSubmit: SubmitHandler<Inputs> = (data) => {
    if (!data.email) return;
    localStorage.setItem("isLoggedIn", "true");
    navigate("/home");
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gray-50 dark:bg-gray-950">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-orange-400/20 blur-[100px] animate-[float_8s_ease-in-out_infinite]" />
        <div className="absolute top-[40%] -right-[10%] w-[40%] h-[40%] rounded-full bg-blue-400/20 blur-[100px] animate-[float_10s_ease-in-out_infinite_reverse]" />
      </div>

      {/* Main Card */}
      <div className="w-full max-w-md z-10 p-4 animate-[fadeIn_0.5s_ease-out]">
        <div className="glass dark:glass-dark rounded-3xl shadow-2xl shadow-orange-500/10 p-8 md:p-10 border border-white/50 dark:border-white/10">

          {/* Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-orange-500/10 mb-6">
              <Bot className="w-8 h-8 text-orange-500" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">
              Bienvenido a <span className="text-orange-500">Anahuac IA</span>
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              Tu asistente inteligente para la gestión de flujos
            </p>
          </div>

          {/* Actions */}
          <div className="space-y-4">
            <button
              onClick={() => setIsOpen(true)}
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

      {/* Modal */}
      <Modal
        size="lg"
        isOpen={isOpen}
        title="Ingresa con tu cuenta Microsoft"
        onClose={() => setIsOpen(false)}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-4">
          <div className="space-y-2">
            <Input
              label="Correo electrónico"
              type="email"
              placeholder="nombre@anahuac.mx"
              {...register("email", {
                required: "El correo es obligatorio",
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: "Correo inválido",
                },
              })}
              error={errors.email}
            />
          </div>

          <div className="pt-2">
            <Button text="Iniciar sesión" className="w-full py-3 text-lg" />
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Login;
