import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/src/lib/utils';
import { Icon } from './Icon';
import * as Gemini from '@/src/services/geminiService';
import { ChatMessage } from '@/src/types';

export function ChatUI({ context, onClose }: { context: string; onClose: () => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus input when chat opens
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || isTyping) return;

    setInput('');
    setError(null);
    setMessages(prev => [...prev, { role: 'user', text: trimmed }]);
    setIsTyping(true);

    try {
      const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }],
      }));
      const response = await Gemini.chatWithNotes(trimmed, context, history);
      setMessages(prev => [...prev, { role: 'model', text: response }]);
    } catch (err) {
      console.error('Chat error:', err);
      setError('Failed to get a response. Please try again.');
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="w-full max-w-2xl h-[80vh] glass-card rounded-[32px] overflow-hidden flex flex-col shadow-2xl relative"
      >
        {/* Header */}
        <div className="p-6 border-b border-white/20 flex justify-between items-center bg-white/20 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-violet-600 flex items-center justify-center text-white">
              <Icon name="psychology" fill />
            </div>
            <div>
              <h3 className="font-bold text-slate-800">Chat with Notes</h3>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Powered by Gemini</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/40 rounded-full transition-colors cursor-pointer"
            aria-label="Close chat"
          >
            <Icon name="close" />
          </button>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-40 select-none">
              <Icon name="forum" className="text-6xl mb-2" />
              <p className="font-medium">Ask anything about your study material.</p>
              <p className="text-sm mt-1">I'll use your uploaded notes as context.</p>
            </div>
          )}

          <AnimatePresence initial={false}>
            {messages.map((m, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}
              >
                <div
                  className={cn(
                    'max-w-[80%] p-4 rounded-2xl text-sm',
                    m.role === 'user'
                      ? 'bg-violet-600 text-white rounded-tr-none'
                      : 'bg-white/60 text-slate-800 rounded-tl-none border border-white/60'
                  )}
                >
                  {m.role === 'model' ? (
                    <div className="prose prose-sm prose-slate max-w-none prose-p:my-1 prose-headings:my-2">
                      <ReactMarkdown>{m.text}</ReactMarkdown>
                    </div>
                  ) : (
                    m.text
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Typing indicator */}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-white/60 px-4 py-3 rounded-2xl rounded-tl-none border border-white/60 flex gap-1 items-center">
                {[0, 0.2, 0.4].map((delay, i) => (
                  <motion.div
                    key={i}
                    animate={{ opacity: [0.3, 1, 0.3], y: [0, -4, 0] }}
                    transition={{ repeat: Infinity, duration: 1, delay }}
                    className="w-2 h-2 bg-violet-500 rounded-full"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="text-center text-sm text-red-500 bg-red-50 rounded-xl p-3">
              {error}
            </div>
          )}
        </div>

        {/* Input */}
        <div className="p-6 bg-white/20 border-t border-white/20 shrink-0">
          {!context && (
            <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2 mb-3 text-center">
              ⚠️ No study material uploaded. Chat will use general knowledge only.
            </p>
          )}
          <div className="relative">
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question..."
              disabled={isTyping}
              className="w-full bg-white/80 border border-violet-100 rounded-2xl px-6 py-4 pr-16 focus:outline-none focus:ring-2 focus:ring-violet-600/20 text-slate-800 placeholder:text-slate-400 disabled:opacity-60"
            />
            <button
              onClick={handleSend}
              disabled={isTyping || !input.trim()}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-violet-600 text-white rounded-xl flex items-center justify-center hover:bg-violet-700 transition-colors disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
              aria-label="Send message"
            >
              <Icon name="send" />
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
