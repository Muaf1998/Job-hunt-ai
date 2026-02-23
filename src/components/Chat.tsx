'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, Sparkles } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Utility for safe className merging
export function cn(...inputs: (string | undefined | null | false)[]) {
    return twMerge(clsx(inputs));
}

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
}

export default function Chat() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [threadId, setThreadId] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: input,
        };

        setMessages((prev) => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: userMessage.content, threadId }),
            });

            if (!response.body) throw new Error('No response body');

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let assistantMessageAccumulated = '';

            // Create a unique ID for the assistant message we're about to stream
            const assistantMsgId = (Date.now() + 1).toString();

            // Optimistically add an empty assistant message
            setMessages((prev) => [
                ...prev,
                { id: assistantMsgId, role: 'assistant', content: '' },
            ]);

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n'); // Split by newline to get individual lines

                for (const line of lines) {
                    if (line.startsWith('event: threadId')) {
                        // Extract JSON data
                        const jsonStr = line.substring('event: threadId'.length).trim();
                        // Sometimes the data comes on the next line or same line depending on formatting.
                        // But per the backend:
                        // sendEvent('threadId', { threadId: threadIdToUse });
                        // It sends: event: threadId\ndata: {"threadId":"..."}\n\n
                        // So we need to be careful. The split above might separate event and data.
                        // Let's use a robust buffer approach or just handle the `data:` lines.
                    }
                }

                // Better approach for SSE parsing:
                // Accumulate buffer and split by double newline
                const events = chunk.split('\n\n');
                for (const eventStr of events) {
                    if (!eventStr.trim()) continue;

                    let eventName = '';
                    let eventData: any = null;

                    const eventLines = eventStr.split('\n');
                    for (const line of eventLines) {
                        if (line.startsWith('event: ')) {
                            eventName = line.substring('event: '.length).trim();
                        } else if (line.startsWith('data: ')) {
                            try {
                                eventData = JSON.parse(line.substring('data: '.length).trim());
                            } catch (e) {
                                console.error('Error parsing JSON data', e);
                            }
                        }
                    }

                    if (eventName && eventData) {
                        if (eventName === 'threadId') {
                            setThreadId(eventData.threadId);
                        } else if (eventName === 'textDelta') {
                            assistantMessageAccumulated += eventData.text;
                            setMessages((prev) =>
                                prev.map((msg) =>
                                    msg.id === assistantMsgId
                                        ? { ...msg, content: assistantMessageAccumulated }
                                        : msg
                                )
                            );
                        } else if (eventName === 'status') {
                            // Show status update as a temporary italicized line in the assistant message or a separate toast
                            // For now, let's append it as italics
                            setMessages((prev) =>
                                prev.map((msg) =>
                                    msg.id === assistantMsgId
                                        ? { ...msg, content: assistantMessageAccumulated + `\n\n*${eventData.message}*` }
                                        : msg
                                )
                            );
                        } else if (eventName === 'error') {
                            console.error("Server error:", eventData.message);
                            setMessages((prev) =>
                                prev.map((msg) =>
                                    msg.id === assistantMsgId
                                        ? { ...msg, content: assistantMessageAccumulated + `\n\n**Error:** ${eventData.message}` }
                                        : msg
                                )
                            );
                        } else if (eventName === 'action') {
                            // Handle specific actions if needed
                            // book_meeting is handled by status currently
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error fetching chat response:', error);
            setMessages((prev) => [
                ...prev,
                { id: Date.now().toString(), role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full max-w-2xl mx-auto h-[600px] flex flex-col bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-xl overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-white/10 bg-white/5 flex items-center gap-3">
                <div className="p-2 bg-gradient-to-tr from-blue-500 to-purple-500 rounded-lg">
                    <Bot className="w-6 h-6 text-white" />
                </div>
                <div>
                    <h2 className="text-white font-semibold">Digital Assistant</h2>
                    <p className="text-xs text-gray-300 flex items-center gap-1">
                        <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                        Online & Ready to Help
                    </p>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 opacity-80">
                        <Sparkles className="w-12 h-12 mb-3 text-purple-400 opacity-50" />
                        <p>Ask me anything about my experience,</p>
                        <p>projects, or availability!</p>
                    </div>
                )}
                <AnimatePresence initial={false}>
                    {messages.map((msg) => (
                        <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className={cn(
                                "flex w-full",
                                msg.role === 'user' ? "justify-end" : "justify-start"
                            )}
                        >
                            <div
                                className={cn(
                                    "max-w-[80%] p-3 rounded-2xl text-sm leading-relaxed",
                                    msg.role === 'user'
                                        ? "bg-blue-600 text-white rounded-br-sm"
                                        : "bg-white/10 text-gray-100 rounded-bl-sm border border-white/10"
                                )}
                            >
                                {msg.content}
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
                {isLoading && messages.length > 0 && messages[messages.length - 1].role === 'user' && (
                    <div className="flex items-center gap-2 text-gray-400 text-sm ml-2">
                        <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSubmit} className="p-4 bg-white/5 border-t border-white/10">
                <div className="relative flex items-center">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Type your message..."
                        disabled={isLoading}
                        className="w-full bg-black/20 text-white placeholder-gray-400 border border-white/10 rounded-xl py-3 pl-4 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                    />
                    <button
                        type="submit"
                        disabled={isLoading || !input.trim()}
                        className="absolute right-2 p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </div>
            </form>
        </div>
    );
}
