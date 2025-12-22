"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Sparkles, Baby, User, Smile } from "lucide-react";

type Personality = "teen" | "child" | "infant";

interface Message {
    role: "user" | "model";
    parts: string;
}

const personalityInfo: Record<Personality, { name: string; icon: React.ReactNode; color: string; desc: string }> = {
    teen: { name: "Teen", icon: <Smile size={16} />, color: "bg-pink-500", desc: "Sassy & Funny" },
    child: { name: "Child", icon: <User size={16} />, color: "bg-blue-500", desc: "Simple & Quiet" },
    infant: { name: "Infant", icon: <Baby size={16} />, color: "bg-purple-500", desc: "Baby Talk" },
};

export default function ChatInterface() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [personality, setPersonality] = useState<Personality>("teen");
    const [userName, setUserName] = useState<string>("");
    const [waitingForName, setWaitingForName] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Trigger first message when personality changes or on mount
    useEffect(() => {
        if (messages.length === 0 && !loading) {
            initiateConversation();
        }
    }, [personality]);

    const initiateConversation = async () => {
        setLoading(true);
        setUserName("");
        setWaitingForName(true);

        try {
            const response = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: "hello",
                    history: [],
                    personality,
                    userName: null,
                }),
            });

            const data = await response.json();
            if (data.text) {
                setMessages([{ role: "model", parts: data.text }]);
            }
        } catch (error) {
            console.error(error);
            setMessages([{ role: "model", parts: "Oops! Something went wrong!" }]);
        } finally {
            setLoading(false);
        }
    };

    const handlePersonalityChange = (newPersonality: Personality) => {
        setPersonality(newPersonality);
        setMessages([]);
        setUserName("");
        setWaitingForName(false);
    };

    const sendMessage = async () => {
        if (!input.trim() || loading) return;

        const userMessage = input.trim();
        setInput("");
        setLoading(true);

        // If we're waiting for name, capture it
        let currentUserName = userName;
        if (waitingForName && !userName) {
            currentUserName = userMessage;
            setUserName(userMessage);
            setWaitingForName(false);
        }

        const newHistory = [
            ...messages,
            { role: "user" as const, parts: userMessage },
        ];
        setMessages(newHistory);

        try {
            // Filter history to start with user message (Gemini requirement)
            // Skip the initial model greeting when building history
            const historyStartIndex = messages.findIndex(m => m.role === "user");
            const validHistory = historyStartIndex >= 0
                ? messages.slice(historyStartIndex).map((m) => ({
                    role: m.role,
                    parts: [{ text: m.parts }],
                }))
                : [];

            const response = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: userMessage,
                    history: validHistory,
                    personality,
                    userName: currentUserName,
                }),
            });

            const data = await response.json();

            if (data.text) {
                setMessages([
                    ...newHistory,
                    { role: "model", parts: data.text },
                ]);
            } else {
                console.error("API Error Response:", data);
                const errorMessage = data.error || "Something went wrong!";
                setMessages([
                    ...newHistory,
                    { role: "model", parts: `${errorMessage}` }
                ])
            }
        } catch (error) {
            console.error(error);
            setMessages([
                ...newHistory,
                { role: "model", parts: "Oops! Network error!" },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const currentPersonality = personalityInfo[personality];

    return (
        <div className="flex flex-col h-[80vh] w-full max-w-2xl bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl border-4 border-yellow-400 overflow-hidden relative">
            {/* Header */}
            <div className="bg-gradient-to-r from-yellow-400 to-orange-400 p-4 flex items-center justify-between shadow-md z-10">
                <div className="flex items-center gap-3">
                    <div className={`${currentPersonality.color} p-2 rounded-full text-white`}>
                        <Sparkles size={24} />
                    </div>
                    <div>
                        <h1 className="font-comic font-black text-2xl text-white tracking-wider drop-shadow-md">Chat with AI</h1>
                        <p className="text-xs font-bold text-yellow-900">
                            {currentPersonality.name} Mode • {currentPersonality.desc}
                            {userName && ` • Hi ${userName}!`}
                        </p>
                    </div>
                </div>

                {/* Personality Selector */}
                <div className="flex gap-1">
                    {(Object.entries(personalityInfo) as [Personality, typeof personalityInfo[Personality]][]).map(([key, info]) => (
                        <button
                            key={key}
                            onClick={() => handlePersonalityChange(key)}
                            className={`p-2 rounded-full transition-all duration-200 ${personality === key
                                ? `${info.color} text-white scale-110 shadow-lg`
                                : "bg-white/50 text-gray-600 hover:bg-white/80"
                                }`}
                            title={`${info.name}: ${info.desc}`}
                        >
                            {info.icon}
                        </button>
                    ))}
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-pattern">
                <AnimatePresence>
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
                        placeholder={waitingForName ? "Type your name..." : "Type a message..."}
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
