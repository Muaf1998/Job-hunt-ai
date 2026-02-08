import { useState, type FormEvent } from 'react';
import { Send, Loader2, Sparkles } from 'lucide-react';

interface ChatInputProps {
    onSend: (message: string) => void;
    isLoading: boolean;
}

export default function ChatInput({ onSend, isLoading }: ChatInputProps) {
    const [input, setInput] = useState('');

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        onSend(input);
        setInput('');
    };

    return (
        <div className="p-4 md:p-6 bg-transparent">
            <form
                onSubmit={handleSubmit}
                className="relative flex items-center max-w-4xl mx-auto group"
            >
                <div className="absolute left-4 text-indigo-400/70 group-focus-within:text-indigo-400 transition-colors duration-300">
                    <Sparkles className="w-5 h-5" />
                </div>

                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask me about Aflah's experience, skills, or projects..."
                    disabled={isLoading}
                    className="w-full bg-black/20 backdrop-blur-xl border border-white/10 text-white rounded-2xl py-4 pl-12 pr-14 
                    focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 focus:bg-black/30
                    placeholder:text-white/20 shadow-lg shadow-black/10 transition-all duration-300"
                />

                <button
                    type="submit"
                    disabled={!input.trim() || isLoading}
                    className="absolute right-2 p-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 hover:scale-105
                    disabled:opacity-50 disabled:bg-transparent disabled:text-white/20 disabled:cursor-not-allowed disabled:hover:scale-100
                    transition-all duration-200 shadow-lg shadow-indigo-500/20 active:scale-95"
                >
                    {isLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <Send className="w-5 h-5" />
                    )}
                </button>
            </form>
        </div>
    );
}
