"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Sparkles } from "lucide-react";

interface Message {
    role: "user" | "model";
    parts: string; // Simplification for now, Gemini uses parts[{text}]
}

export default function ChatInterface() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const sendMessage = async () => {
        if (!input.trim() || loading) return;

        const userMessage = input.trim();
        setInput("");
        setLoading(true);

        // Add user message immediately
        const newHistory = [
            ...messages,
            { role: "user" as const, parts: userMessage },
        ];
        setMessages(newHistory);

        try {
            const response = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: userMessage,
                    history: messages.map((m) => ({
                        role: m.role,
                        parts: [{ text: m.parts }],
                    })),
                }),
            });

            const data = await response.json();

            if (data.text) {
                setMessages([
                    ...newHistory,
                    { role: "model", parts: data.text },
                ]);
            } else {
                // Fallback error
                console.error("API Error Response:", data);
                const errorMessage = data.error || "Aiyyo! Something went wrong mams!";
                setMessages([
                    ...newHistory,
                    { role: "model", parts: `${errorMessage} (Check console for details)` }
                ])
            }
        } catch (error) {
            console.error(error);
            setMessages([
                ...newHistory,
                { role: "model", parts: "Oops! My brain is not working! (Network Error)" },
            ]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-[80vh] w-full max-w-2xl bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl border-4 border-yellow-400 overflow-hidden relative">
            {/* Header */}
            <div className="bg-yellow-400 p-4 flex items-center justify-between shadow-md z-10">
                <div className="flex items-center gap-2">
                    <div className="bg-pink-500 p-2 rounded-full text-white">
                        <Sparkles size={24} />
                    </div>
                    <div>
                        <h1 className="font-comic font-black text-2xl text-pink-600 tracking-wider">PoojakkAI</h1>
                        <p className="text-xs font-bold text-pink-800">Age 18 • Always Wrong!</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="font-bold text-yellow-800 text-sm">Hello Mams!</p>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-pattern">
                <AnimatePresence>
                    {messages.length === 0 && (
                        <div className="flex h-full items-center justify-center text-center p-8 opacity-50">
                            <div>
                                <p className="font-bold text-gray-500 text-xl mb-2">Ask me anything!</p>
                                <p className="text-sm">I promise to give you the worst advice ever.</p>
                            </div>
                        </div>
                    )}
                    {messages.map((msg, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, scale: 0.8, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            transition={{ type: "spring", stiffness: 300, damping: 20 }}
                            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"
                                }`}
                        >
                            <div
                                className={`max-w-[80%] p-3 rounded-2xl text-lg font-medium shadow-sm border-2 ${msg.role === "user"
                                        ? "bg-blue-100 border-blue-300 text-blue-900 rounded-br-none"
                                        : "bg-pink-100 border-pink-300 text-pink-900 rounded-bl-none"
                                    }`}
                            >
                                {msg.parts}
                            </div>
                        </motion.div>
                    ))}
                    {loading && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex justify-start"
                        >
                            <div className="bg-pink-100 border-pink-300 border-2 p-3 rounded-2xl rounded-bl-none text-pink-400">
                                <span className="animate-pulse">Thinking...</span>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t-2 border-yellow-200">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                        placeholder="Type something mams..."
                        className="flex-1 p-3 rounded-xl border-2 border-gray-200 focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-200 transition-all font-medium"
                    />
                    <button
                        onClick={sendMessage}
                        disabled={loading}
                        className="bg-purple-600 hover:bg-purple-700 text-white p-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl active:scale-95 transform duration-100"
                    >
                        <Send size={24} />
                    </button>
                </div>
            </div>
        </div>
    );
}
