import { MessageCircle, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import Swal from "sweetalert2";
import { continuePlaygroundChat, sendPlaygroundChat } from "../api/playground";

type Message = {
  sender: "user" | "bot";
  text: string;
};

const LS_MESSAGES = "playground_chat_messages";
const LS_CONVERSATION_ID = "playground_chat_conversation_id";

export default function Chat() {
  /* =========================
   * State (lazy init)
   * ========================= */
  const [messages, setMessages] = useState<Message[]>(() => {
    const stored = localStorage.getItem(LS_MESSAGES);
    return stored ? JSON.parse(stored) : [];
  });

  const [conversationId, setConversationId] = useState<string | null>(() =>
    localStorage.getItem(LS_CONVERSATION_ID)
  );

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [botTyping, setBotTyping] = useState(false);

  const bottomRef = useRef<HTMLDivElement | null>(null);

  /* =========================
   * Persist localStorage
   * ========================= */
  useEffect(() => {
    localStorage.setItem(LS_MESSAGES, JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    if (conversationId) {
      localStorage.setItem(LS_CONVERSATION_ID, conversationId);
    }
  }, [conversationId]);

  /* =========================
   * Auto scroll
   * ========================= */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages, botTyping]);

  /* =========================
   * Send message
   * ========================= */
  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userText = input;
    setInput("");

    setMessages((prev) => [...prev, { sender: "user", text: userText }]);

    try {
      setLoading(true);
      setBotTyping(true);

      const response = conversationId
        ? await continuePlaygroundChat({
          conversationId,
          userMessage: userText,
        })
        : await sendPlaygroundChat({
          userMessage: userText,
        });

      setConversationId(response.data.conversationId);

      setTimeout(() => {
        setBotTyping(false);
        setMessages((prev) => [
          ...prev,
          { sender: "bot", text: response.data.response },
        ]);
      }, 600);
    } catch {
      setBotTyping(false);
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: "❌ Error al comunicarse con el asistente" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  /* =========================
   * New chat
   * ========================= */
  const handleNewChat = async () => {
    const result = await Swal.fire({
      title: "¿Iniciar un nuevo chat?",
      text: "Se perderá todo el historial y el contexto de esta conversación.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#f97316",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Sí, borrar",
      cancelButtonText: "Cancelar",
    });

    if (!result.isConfirmed) return;

    setMessages([]);
    setConversationId(null);
    setInput("");
    setBotTyping(false);

    localStorage.removeItem(LS_MESSAGES);
    localStorage.removeItem(LS_CONVERSATION_ID);
  };

  return (
    <div className="pt-6 pb-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="glass dark:glass-dark rounded-3xl p-8 border border-white/50 dark:border-white/10 shadow-xl">
          {/* ================= Header ================= */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <MessageCircle className="w-6 h-6 text-orange-500" />
              Interacción con el Agente
            </h2>

            <button
              onClick={handleNewChat}
              className="flex items-center gap-2 text-sm px-4 py-2 rounded-xl 
              bg-red-500/10 text-red-600 hover:bg-red-500/20 transition"
            >
              <Trash2 className="w-4 h-4" />
              Nuevo chat
            </button>
          </div>

          {/* ================= Messages ================= */}
          <div className="h-96 overflow-y-auto p-4 rounded-2xl bg-gray-50/50 dark:bg-gray-900/40 border border-gray-200/60 dark:border-gray-700/40 space-y-4 shadow-inner">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"
                  }`}
              >
                <div
                  className={`px-4 py-2 rounded-2xl max-w-xs text-sm shadow-md 
  whitespace-pre-line break-words ${msg.sender === "user"
                      ? "bg-orange-500 text-white rounded-br-none"
                      : "bg-white/80 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-bl-none"
                    }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}

            {/* ================= Bot typing ================= */}
            {botTyping && (
              <div className="flex justify-start">
                <div className="px-4 py-2 rounded-2xl bg-white/80 dark:bg-gray-800 shadow-md">
                  <span className="flex gap-1">
                    <span className="animate-bounce">•</span>
                    <span className="animate-bounce delay-150">•</span>
                    <span className="animate-bounce delay-300">•</span>
                  </span>
                </div>
              </div>
            )}

            {/* ancla scroll */}
            <div ref={bottomRef} />
          </div>

          {/* ================= Input ================= */}
          <div className="mt-6 flex">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              className="flex-1 px-4 py-3 bg-white/60 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-orange-500/50 outline-none transition-all"
              placeholder="Escribe un mensaje..."
              disabled={loading}
            />

            <button
              onClick={handleSend}
              disabled={loading}
              className="ml-3 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl 
              shadow-lg shadow-orange-500/30 hover:shadow-orange-500/40 transition-all font-medium disabled:opacity-60"
            >
              {loading ? "Esperando respuesta..." : "Enviar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
