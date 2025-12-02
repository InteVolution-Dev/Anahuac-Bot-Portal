import { MessageCircle } from "lucide-react";
import { useParams } from "react-router-dom";
import { useState } from "react";

type Message = { sender: "user" | "bot"; text: string };

export default function Chat() {
  const { id } = useParams();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");

  // Enviar mensaje
  const handleSend = () => {
    if (!input.trim()) return;

    const userMsg: Message = { sender: "user", text: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    // Respuesta fija del bot (simulación)
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: "Este es un mensaje automático del bot 👾" },
      ]);
    }, 700);
  };

  return (
    <div className="pt-24 pb-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex p-3 rounded-2xl bg-orange-500/10 mb-4 shadow-lg shadow-orange-500/20">
            <MessageCircle className="w-8 h-8 text-orange-500" />
          </div>

          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Playground — <span className="text-orange-500">Chat ID</span> 
          </h1>

          <p className="text-gray-500 dark:text-gray-400">
            Prueba tu chatbot con el diseño de tu asistente
          </p>
        </div>

        {/* Card de chat */}
        <div className="glass dark:glass-dark rounded-3xl p-8 border border-white/50 
            dark:border-white/10 shadow-xl">

          <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white flex items-center gap-2">
            <span className="w-1 h-6 bg-orange-500 rounded-full"></span>
            Interacción con el Agente
          </h2>

          {/* Área de mensajes */}
          <div className="h-96 overflow-y-auto p-4 rounded-2xl bg-gray-50/50 
              dark:bg-gray-900/40 border border-gray-200/60 dark:border-gray-700/40
              space-y-4 shadow-inner">

            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${
                  msg.sender === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`px-4 py-2 rounded-2xl max-w-xs text-sm shadow-md ${
                    msg.sender === "user"
                      ? "bg-orange-500 text-white rounded-br-none"
                      : "bg-white/80 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-bl-none"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
          </div>

          {/* Input y botón */}
          <div className="mt-6 flex">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 px-4 py-3 bg-white/60 dark:bg-gray-900/50 border 
                 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 
                 focus:ring-orange-500/50 outline-none transition-all"
              placeholder="Escribe un mensaje..."
            />

            <button
              onClick={handleSend}
              className="ml-3 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl 
                shadow-lg shadow-orange-500/30 hover:shadow-orange-500/40 transition-all font-medium"
            >
              Enviar
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
