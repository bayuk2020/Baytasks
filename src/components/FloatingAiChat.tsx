/* eslint-disable prettier/prettier */
import { AnimatePresence, motion } from "framer-motion";
import {
  Bot,
  Maximize2,
  Minimize2,
  Minus,
  Send,
  Sparkles,
  User,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { aiApi, type AiChatTurn } from "@/lib/api";

interface Message extends AiChatTurn {
  id: string;
  createdAt: number;
}

const WELCOME: Message = {
  id: "welcome",
  role: "assistant",
  content: "Halo Bay! Aku asisten BayTasks. Mau bikin task, catat habit, cek saldo, atau ngobrol biasa aja juga boleh 👋",
  createdAt: Date.now(),
};

/**
 * Widget chatbot AI mengambang di pojok kanan bawah, tersedia di semua
 * halaman (di-mount sekali di AppShell). Pipeline back-end-nya (AiService +
 * AiToolRegistry + AiToolExecutor) SAMA PERSIS dengan bot Telegram -- widget
 * ini cuma "pembungkus" input/output yang berbeda (HTTP + UI web).
 */
export function FloatingAiChat() {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open) {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [messages, open, sending]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const send = async () => {
    const text = input.trim();
    if (!text || sending) return;

    const userMsg: Message = { id: `u-${Date.now()}`, role: "user", content: text, createdAt: Date.now() };
    const history: AiChatTurn[] = messages
      .filter((m) => m.id !== "welcome")
      .map((m) => ({ role: m.role, content: m.content }));

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setSending(true);

    try {
      const res = await aiApi.chat({ message: text, history });
      const assistantMsg: Message = {
        id: `a-${Date.now()}`,
        role: "assistant",
        content: res.reply || "Maaf, aku belum kepikiran balasan yang pas untuk itu.",
        createdAt: Date.now(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (error) {
      console.error(error);
      const message = error instanceof Error ? error.message : "AI lagi bermasalah, coba lagi sebentar ya.";
      toast.error(message);
      setMessages((prev) => [
        ...prev,
        { id: `err-${Date.now()}`, role: "assistant", content: `⚠️ ${message}`, createdAt: Date.now() },
      ]);
    } finally {
      setSending(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
            className={`flex flex-col rounded-2xl border border-primary/30 bg-card/95 backdrop-blur-2xl shadow-[0_0_60px_-16px_var(--primary)] overflow-hidden transition-[width,height] ${
              expanded ? "w-[26rem] h-[36rem]" : "w-80 h-[28rem]"
            }`}
          >
            {/* HEADER */}
            <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-border bg-secondary/30">
              <div className="flex items-center gap-2 min-w-0">
                <div className="h-8 w-8 shrink-0 rounded-lg grid place-items-center bg-[var(--gradient-neon)]">
                  <Bot className="h-4 w-4 text-primary-foreground" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold truncate">BayTasks AI</div>
                  <div className="text-[10px] text-muted-foreground">Selalu siap bantu</div>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => setExpanded((v) => !v)}
                  className="h-7 w-7 grid place-items-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition"
                  aria-label={expanded ? "Perkecil" : "Perbesar"}
                  title={expanded ? "Perkecil" : "Perbesar"}
                >
                  {expanded ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
                </button>
                <button
                  onClick={() => setOpen(false)}
                  className="h-7 w-7 grid place-items-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition"
                  aria-label="Minimize"
                  title="Minimize"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* MESSAGES */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex items-end gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {m.role === "assistant" && (
                    <div className="h-6 w-6 shrink-0 rounded-full grid place-items-center bg-primary/15 text-primary">
                      <Bot className="h-3.5 w-3.5" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap break-words ${
                      m.role === "user"
                        ? "bg-primary text-primary-foreground rounded-br-sm"
                        : "bg-secondary/60 border border-border rounded-bl-sm"
                    }`}
                  >
                    {m.content}
                  </div>
                  {m.role === "user" && (
                    <div className="h-6 w-6 shrink-0 rounded-full grid place-items-center bg-secondary border border-border text-muted-foreground">
                      <User className="h-3.5 w-3.5" />
                    </div>
                  )}
                </div>
              ))}

              {sending && (
                <div className="flex items-end gap-2 justify-start">
                  <div className="h-6 w-6 shrink-0 rounded-full grid place-items-center bg-primary/15 text-primary">
                    <Bot className="h-3.5 w-3.5" />
                  </div>
                  <div className="rounded-2xl rounded-bl-sm border border-border bg-secondary/60 px-3 py-2">
                    <span className="inline-flex gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:-0.3s]" />
                      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:-0.15s]" />
                      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce" />
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* INPUT */}
            <div className="border-t border-border p-2.5">
              <div className="flex items-end gap-2 rounded-xl border border-border bg-secondary/40 p-1.5 focus-within:ring-1 focus-within:ring-ring">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={onKeyDown}
                  placeholder="Tulis pesan…"
                  rows={1}
                  className="flex-1 resize-none bg-transparent px-2 py-1.5 text-sm outline-none placeholder:text-muted-foreground max-h-24"
                />
                <button
                  onClick={send}
                  disabled={sending || !input.trim()}
                  className="h-8 w-8 shrink-0 grid place-items-center rounded-lg bg-primary text-primary-foreground disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition"
                  aria-label="Kirim"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FLOATING TOGGLE BUTTON */}
      <motion.button
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        onClick={() => setOpen((v) => !v)}
        className="relative h-14 w-14 grid place-items-center rounded-full bg-[var(--gradient-neon)] shadow-[0_0_40px_-8px_var(--primary)] neon-ring"
        aria-label={open ? "Tutup chat AI" : "Buka chat AI"}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={open ? "close" : "open"}
            initial={{ opacity: 0, scale: 0.6, rotate: -45 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, scale: 0.6, rotate: 45 }}
            transition={{ duration: 0.15 }}
          >
            {open ? (
              <Minus className="h-6 w-6 text-primary-foreground" />
            ) : (
              <Sparkles className="h-6 w-6 text-primary-foreground" />
            )}
          </motion.span>
        </AnimatePresence>
      </motion.button>
    </div>
  );
}
