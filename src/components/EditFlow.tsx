import { ArrowLeft, Save, SquareChartGantt, Braces } from "lucide-react";
import Input from "./ui/Input";
import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm, type SubmitHandler } from "react-hook-form";

type Flujo = {
  id: number;
  name: string;
  description: string;
};

export default function EditFlow() {
  const { id } = useParams();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<Flujo>();

  // 🧠 Cargar datos del flujo seleccionado
  useEffect(() => {
    const flujosData = localStorage.getItem("flujos");
    if (!flujosData) {
      alert("⚠️ No se encontraron flujos en el almacenamiento.");
      return;
    }

    try {
      const flujos: Flujo[] = JSON.parse(flujosData);

      const flujo = flujos.find((f) => f.id === Number(id));
      if (!flujo) {
        alert("❌ No se encontró el flujo con el ID proporcionado.");
        navigate("/home");
        return;
      }

      reset(flujo);
    } catch (error) {
      console.error("❌ Error al parsear los flujos:", error);
      alert("⚠️ El formato en localStorage es inválido.");
      navigate("/home");
    }
  }, [id, reset, navigate]);

  // 💾 Guardar los cambios
  const onSubmit: SubmitHandler<Flujo> = (data) => {
    const flujosData = localStorage.getItem("flujos");
    if (!flujosData) return;

    try {
      const flujos: Flujo[] = JSON.parse(flujosData);
      const actualizados = flujos.map((f) =>
        f.id === Number(id) ? { ...f, ...data } : f
      );

      localStorage.setItem("flujos", JSON.stringify(actualizados));
      alert("✅ Flujo actualizado correctamente");
      navigate("/home");
    } catch (error) {
      console.error("❌ Error al guardar los cambios:", error);
      alert("Ocurrió un error al guardar los cambios del flujo.");
    }
  };

  return (
    <div className="pt-24 pb-12 px-4">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex p-3 rounded-2xl bg-orange-500/10 mb-4 shadow-lg shadow-orange-500/20">
            <SquareChartGantt className="w-8 h-8 text-orange-500" />
          </div>

          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Editar <span className="text-orange-500">Flujo</span>
          </h1>

          <p className="text-gray-500 dark:text-gray-400">
            Modifica los detalles de tu asistente
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">

          {/* Main Info Card */}
          <div className="glass dark:glass-dark rounded-3xl p-8 border border-white/50 dark:border-white/10 shadow-xl">
            <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white flex items-center gap-2">
              <span className="w-1 h-6 bg-orange-500 rounded-full"></span>
              Información General
            </h2>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 ml-1">
                  Nombre del flujo
                </label>
                <Input
                  type="text"
                  {...register("name", { required: "Por favor agrega un nombre" })}
                  error={errors.name}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 ml-1">
                  Descripción
                </label>
                <textarea
                  {...register("description", {
                    required: "Por favor agrega una descripción",
                  })}
                  className={`w-full h-32 resize-none bg-white/50 dark:bg-gray-900/50 border ${
                    errors.description
                      ? "border-red-500"
                      : "border-gray-200 dark:border-gray-700"
                  } rounded-xl p-4 focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all outline-none`}
                />
              </div>
            </div>

            <div className="mt-2">
              <button
                type="button"
                onClick={() => alert("Logica doc Leo")}
                className="text-sm font-medium text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <Braces className="w-4 h-4" /> Configurar JSON
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4">
            <button
              type="button"
              onClick={() => navigate("/create-flow")}
              className="flex items-center gap-2 px-6 py-3 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-medium transition-colors"
            >
              <ArrowLeft className="w-5 h-5" /> Cancelar
            </button>

            <button
              type="submit"
              className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-8 py-3.5 rounded-xl shadow-lg shadow-orange-500/30 hover:shadow-orange-500/40 transition-all transform hover:-translate-y-0.5 font-medium"
            >
              <Save className="w-5 h-5" /> Guardar Cambios
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
