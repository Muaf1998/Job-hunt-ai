import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Bot, User } from 'lucide-react';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface MessageProps {
    role: 'user' | 'assistant';
    content: string;
}

export default function Message({ role, content }: MessageProps) {
    const isUser = role === 'user';

    return (
        <div
            className={cn(
                "flex w-full items-start gap-4 mb-2 group",
                isUser ? "justify-end" : "justify-start"
            )}
        >
            {/* Assistant Avatar */}
            {!isUser && (
                <div className="flex-shrink-0 w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 mt-1">
                    <Bot className="w-5 h-5 md:w-6 md:h-6" />
                </div>
            )}

            <div
                className={cn(
                    "relative max-w-[85%] md:max-w-[75%] rounded-2xl px-5 py-4 text-sm md:text-base leading-relaxed shadow-sm transition-all duration-200",
                    isUser
                        ? "bg-indigo-600 text-white rounded-tr-none shadow-indigo-500/10 hover:shadow-indigo-500/20"
                        : "bg-white/5 backdrop-blur-md border border-white/10 text-gray-100 rounded-tl-none shadow-black/5 hover:bg-white/10"
                )}
            >
                {/* Name Label */}
                <div className={cn(
                    "mb-1 text-[10px] font-bold uppercase tracking-wider opacity-40 select-none",
                    isUser ? "text-indigo-200" : "text-indigo-300"
                )}>
                    {isUser ? 'You' : 'Mosaic'}
                </div>

                <div className="whitespace-pre-wrap">{content}</div>
            </div>

            {/* User Avatar */}
            {isUser && (
                <div className="flex-shrink-0 w-8 h-8 md:w-10 md:h-10 rounded-full bg-zinc-800/80 border border-white/10 flex items-center justify-center text-zinc-400 mt-1">
                    <User className="w-5 h-5 md:w-6 md:h-6" />
                </div>
            )}
        </div>
    );
}
