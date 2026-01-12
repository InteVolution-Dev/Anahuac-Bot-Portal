import { MessageCircle, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import Swal from "sweetalert2";
import {
  continuePlaygroundChat,
  sendPlaygroundChat,
} from "../api/playground";
import KnowledgeBase from "./KnowledgeBase";
import { removeChatConvertationStorage } from "../utils/helpers";

type Message = {
  sender: "user" | "bot";
  text: string;
};

const LS_MESSAGES = "playground_chat_messages";
const LS_CONVERSATION_ID = "playground_chat_conversation_id";

export default function Chat() {
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

  const chatContainerRef = useRef<HTMLDivElement | null>(null);
  const lastMessageRef = useRef<HTMLDivElement | null>(null);

  const [chatCleared, setChatCleared] = useState(false);

  useEffect(() => {
    if (chatCleared) return;

    localStorage.setItem(LS_MESSAGES, JSON.stringify(messages));
  }, [messages, chatCleared]);


  useEffect(() => {
    if (chatCleared) return;

    localStorage.setItem(
      LS_CONVERSATION_ID,
      conversationId ?? ""
    );
  }, [conversationId, chatCleared]);


  useEffect(() => {
    if (!chatCleared) return;

    removeChatConvertationStorage();

    setChatCleared(false);
  }, [chatCleared]);


  useEffect(() => {
    if (!chatContainerRef.current || !lastMessageRef.current) return;

    const top =
      lastMessageRef.current.offsetTop -
      chatContainerRef.current.offsetTop -
      16;

    chatContainerRef.current.scrollTo({
      top,
      behavior: "smooth",
    });
  }, [messages, botTyping]);

  const clearChat = () => {
  setMessages([]);
  setConversationId(null);
  setInput("");
  setBotTyping(false);
  setChatCleared(true);
};

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

  const handleNewChat = async () => {
    const result = await Swal.fire({
      title: "¿Iniciar un nuevo chat?",
      text: "Se perderá el historial y el contexto actual.",
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
    setChatCleared(true);
  };

  /* =========================
   * Render
   * ========================= */
  return (
    <>
      {/* Header */}
      <div className="text-center mb-2 shrink-0">
        <div className="inline-flex p-2 rounded-xl bg-orange-500/10 mb-2 shadow shadow-orange-500/20">
          <MessageCircle className="w-6 h-6 text-orange-500" />
        </div>

        <p className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">
          Playground — <span className="text-orange-500">Chat</span>
        </p>

        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          Prueba tu chatbot con el diseño de tu asistente
        </p>
      </div>


      {/* ===== CONTENIDO PRINCIPAL ===== */}
      <div className="max-w-7xl mx-auto flex-1 w-full overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[520px] overflow-hidden">
          {/* Knowledge Base */}
          <div className="lg:col-span-4 h-full overflow-y-auto">
            <KnowledgeBase
              clearChat={clearChat}
            />
          </div>

          {/* Chat */}
          <div className="lg:col-span-8 h-full overflow-hidden">
            <div className="flex flex-col rounded-3xl bg-white/70 dark:bg-gray-900/60 backdrop-blur-xl border border-gray-200/60 dark:border-white/10">
              {/* Chat Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200/60 dark:border-gray-700/50 shrink-0">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-orange-500" />
                  Interacción con el Agente
                </h2>

                <button
                  onClick={handleNewChat}
                  className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg bg-red-500/10 text-red-600 hover:bg-red-500/20 transition"
                >
                  <Trash2 className="w-4 h-4" />
                  Nuevo chat
                </button>
              </div>
              <div
                ref={chatContainerRef}
                className="overflow-y-auto px-6 py-5 space-y-4 max-h-96 min-h-96 from-gray-50/60 to-gray-100/40 dark:from-gray-900/40 dark:to-gray-900/20"
              >
                {messages.map((msg, i) => {
                  const isLast = i === messages.length - 1;
                  const isUser = msg.sender === "user";

                  return (
                    <div
                      key={i}
                      ref={isLast ? lastMessageRef : null}
                      className={`flex ${isUser ? "justify-end" : "justify-start"
                        }`}
                    >
                      <div
                        className={`px-4 py-2 max-w-xs text-sm shadow-md whitespace-pre-line ${isUser
                          ? "bg-orange-500 text-white rounded-2xl rounded-br-sm"
                          : "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-2xl rounded-bl-sm"
                          }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  );
                })}

                {botTyping && (
                  <div
                    ref={lastMessageRef}
                    className="inline-flex items-center gap-1 px-4 py-2 rounded-xl bg-white dark:bg-gray-800 shadow-md w-fit"
                  >
                    <span className="animate-bounce">•</span>
                    <span className="animate-bounce delay-150">•</span>
                    <span className="animate-bounce delay-300">•</span>
                  </div>
                )}
              </div>

              {/* Input */}
              <div className="border-t border-gray-200/60 dark:border-gray-700/50 px-6 py-4 bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl shrink-0">
                <div className="flex gap-3">
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                    placeholder="Escribe un mensaje..."
                    disabled={loading}
                    className="flex-1 px-4 py-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-orange-500/50 outline-none transition"
                  />

                  <button
                    onClick={handleSend}
                    disabled={loading}
                    className="px-6 py-3 rounded-xl bg-orange-500 text-white font-medium hover:bg-orange-600 shadow-lg shadow-orange-500/30 transition disabled:opacity-60"
                  >
                    {loading ? "Pensando..." : "Enviar"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
