"use client";

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Message from './Message';
import ChatInput from './ChatInput';
import CalendlyWidget from './CalendlyWidget';

interface MessageType {
  role: 'user' | 'assistant';
  content: string;
  widget?: 'calendly';
}

export default function Chat() {
  const [messages, setMessages] = useState<MessageType[]>([
    { role: 'assistant', content: "Hello! My name is Mosaic! I'm Muhammed Aflah's AI assistant" }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [threadId, setThreadId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (content: string) => {
    setIsLoading(true);
    const userMessage: MessageType = { role: 'user', content };
    setMessages(prev => [...prev, userMessage]);

    // Create a placeholder for the assistant response
    setMessages(prev => [...prev, { role: 'assistant', content: "" }]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: content, threadId }),
      });

      if (!response.ok) throw new Error('Failed to send message');
      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantMessageContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('event: ')) {
            // Event type handling if needed (e.g. 'textDelta', 'threadId')
          } else if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.threadId) {
                setThreadId(data.threadId);
              }
              if (data.text) {
                assistantMessageContent += data.text;
                // Update the last message (which is the assistant placeholder)
                setMessages(prev => {
                  const newMessages = [...prev];
                  newMessages[newMessages.length - 1].content = assistantMessageContent;
                  return newMessages;
                });
              }
              if (data.action === 'book_meeting') {
                setMessages(prev => {
                  const newMessages = [...prev];
                  newMessages[newMessages.length - 1].widget = 'calendly';
                  return newMessages;
                });
              }
            } catch (e) {
              // console.warn('Failed to parse stream chunk JSON', e);
            }
          }
        }
      }

    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => {
        // Remove the empty placeholder if error occurred effectively
        const newMessages = [...prev];
        newMessages[newMessages.length - 1].content = "Sorry, something went wrong. Please try again.";
        return newMessages;
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-black/20 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-indigo-500/20">
              M
            </div>
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-black rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-white/95">Mosaic</h1>
            <p className="text-xs text-indigo-200/60 font-medium tracking-wide">Digital Twin of Muhammed Aflah</p>
          </div>
        </div>
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 scroll-smooth custom-scrollbar">
        <AnimatePresence initial={false} mode='popLayout'>
          {messages.map((msg, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 15, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }} // smooth cubic-bezier
              className="w-full"
            >
              <div className="space-y-4">
                <Message role={msg.role} content={msg.content} />
                {msg.widget === 'calendly' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="overflow-hidden"
                  >
                    <CalendlyWidget />
                  </motion.div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <ChatInput onSend={sendMessage} isLoading={isLoading} />
    </>
  );
}
