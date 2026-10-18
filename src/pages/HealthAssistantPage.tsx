import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import {
  Bot,
  User,
  Send,
  Sparkles,
  RefreshCw,
  HelpCircle,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";
import { MedicalDisclaimer } from "../components/common/MedicalDisclaimer";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export const HealthAssistantPage: React.FC = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: `Hello ${user?.fullName ? user.fullName.split(" ")[0] : "there"}! I am HealthMate's AI Health & Wellness Assistant. I can explain laboratory test terms, answer nutrition and hydration questions, or help clarify general wellness concepts. What would you like to explore today?`,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const quickPrompts = [
    "What is the difference between HDL and LDL cholesterol?",
    "How does HbA1c differ from a daily fingerstick glucose?",
    "Evidence-based tips to improve deep sleep quality",
    "What is the recommended daily water intake for active adults?",
  ];

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || input;
    if (!text.trim() || loading) return;

    const newMessages: Message[] = [...messages, { role: "user", content: text.trim() }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await api.ai.chat(newMessages);
      setMessages((prev) => [...prev, { role: "assistant", content: res.reply }]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "I apologize, but I encountered an error connecting to the health intelligence service. Please check your connection and try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-teal-50 text-teal-700 rounded-xl">
              <Bot className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">AI Health &amp; Wellness Assistant</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-xl">
            Ask questions about physiological metrics, medical terms, and healthy daily lifestyle practices in a supportive, secure environment.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500">
          <ShieldCheck className="w-4 h-4 text-teal-600" />
          <span>Non-diagnostic informational companion</span>
        </div>
      </div>

      {/* Chat Area Container */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs flex flex-col h-[650px] overflow-hidden">
        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {messages.map((m, idx) => {
            const isUser = m.role === "user";
            return (
              <div
                key={idx}
                className={`flex gap-3 max-w-2xl ${isUser ? "ml-auto flex-row-reverse" : ""}`}
              >
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${
                    isUser
                      ? "bg-teal-600 text-white"
                      : "bg-gradient-to-tr from-teal-700 to-emerald-600 text-white shadow-xs"
                  }`}
                >
                  {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                <div
                  className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-wrap ${
                    isUser
                      ? "bg-teal-600 text-white rounded-tr-xs"
                      : "bg-slate-50 border border-slate-200/80 text-slate-800 rounded-tl-xs shadow-2xs"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex gap-3 max-w-2xl">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-teal-700 to-emerald-600 text-white flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-slate-500 text-xs flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-teal-600" />
                <span>Formulating evidence-based answer...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick prompt suggestions */}
        <div className="px-4 py-2 bg-slate-50/80 border-t border-slate-100 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-teal-600" /> Suggested:
          </span>
          {quickPrompts.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(p)}
              className="text-[11px] px-2.5 py-1 rounded-full bg-white border border-slate-200 hover:border-teal-400 text-slate-700 whitespace-nowrap transition-colors shrink-0 shadow-2xs"
            >
              {p}
            </button>
          ))}
        </div>

        {/* Input box */}
        <div className="p-4 bg-white border-t border-slate-200">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about health terms, nutrition, hydration, or lab test meanings..."
              className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="p-3 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl transition-colors disabled:opacity-40 shadow-xs"
              title="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      <MedicalDisclaimer />
    </div>
  );
};
