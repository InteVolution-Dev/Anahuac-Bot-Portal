import Input from "./ui/Input";
import { useForm, type SubmitHandler } from "react-hook-form";

type VariableInputs = {
  variableName: string;
  variableDescription: string;
  variableType: string;
};

interface Props {
  onAddVariable: (variable: VariableInputs) => void;
}

export default function AddVariable({ onAddVariable }: Props) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<VariableInputs>();

  const onSubmit: SubmitHandler<VariableInputs> = (data) => {
    onAddVariable(data);
    reset();
  };

  return (
    <div className="mt-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
        {/* 🧩 Nombre */}
        <div className="flex flex-col">
          <Input
            type="text"
            placeholder="Nombre de la variable"
            {...register("variableName", {
              required: "Por favor agrega un nombre",
            })}
            error={errors.variableName}
          />
       
        </div>

        {/* 🧩 Tipo */}
        <div className="flex flex-col">
          <select
            {...register("variableType", {
              required: "Selecciona un tipo de variable",
            })}
            className={`h-11 bg-gray-100 border ${
              errors.variableType ? "border-red-500" : "border-gray-300"
            } rounded-lg p-2 focus:ring-2 focus:ring-orange-500`}
          >
            <option value="">Selecciona un tipo de variable</option>
            <option value="text">Texto</option>
            <option value="email">Correo electrónico</option>
            <option value="date">Fecha</option>
            <option value="number">Número</option>
          </select>
          {errors.variableType && (
            <span className="text-red-500 text-sm mt-1">
              {errors.variableType.message}
            </span>
          )}
        </div>

        {/* 🧩 Descripción */}
        <div className="flex flex-col">
          <Input
            type="text"
            placeholder="Descripción de la variable"
            {...register("variableDescription", {
              required: "Por favor agrega una descripción",
            })}
            error={errors.variableDescription}
          />
        
        </div>
      </div>

      {/* 🧩 Botón Agregar */}
      <div className="mt-3">
        <button
          type="button"
          onClick={handleSubmit(onSubmit)}
          className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center flex items-center gap-2"
        >
          Agregar variable
        </button>
      </div>
    </div>
  );
}
