import React, { useState, useRef, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import axios from 'axios';

const publicKey   = document.querySelector('meta[name="chatbot-public-key"]')?.content;
const chatbotName = document.querySelector('meta[name="chatbot-name"]')?.content ?? 'Chatbot';

const client = axios.create({
    headers: {
        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content,
        'Accept': 'application/json',
    },
    withCredentials: true,
});

function PublicWidget() {
    const [messages, setMessages] = useState([]);
    const [input, setInput]       = useState('');
    const [sending, setSending]   = useState(false);
    const bottomRef = useRef(null);
    const textareaRef = useRef(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, sending]);

    const handleSend = async () => {
        const content = input.trim();
        if (!content || sending) return;

        setSending(true);
        setInput('');

        const tempId  = Date.now();
        const tempMsg = { id: tempId, role: 'user', content };
        setMessages(prev => [...prev, tempMsg]);

        try {
            const { data } = await client.post(`/widget/${publicKey}/messages`, { content });
            setMessages(prev => [...prev.filter(m => m.id !== tempId), data.user, data.assistant]);
        } catch (err) {
            setMessages(prev => prev.filter(m => m.id !== tempId));
            console.error(err);
        } finally {
            setSending(false);
            textareaRef.current?.focus();
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="h-full w-full flex flex-col bg-navy-900 text-white font-sans">
            {/* Header */}
            <div className="flex items-center gap-2.5 px-4 py-3 border-b border-white/10 flex-shrink-0">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-gold-400 to-gold-700 flex items-center justify-center flex-shrink-0 shadow-md shadow-black/50 ring-1 ring-white/10">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-3 3-3-3z"/>
                    </svg>
                </div>
                <span className="font-semibold text-sm truncate">{chatbotName}</span>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <p className="text-navy-300 text-sm">Send a message to start the conversation.</p>
                    </div>
                ) : (
                    messages.map(msg => <Message key={msg.id} message={msg} />)
                )}

                {sending && (
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-navy-700 flex items-center justify-center flex-shrink-0 text-xs font-semibold">AI</div>
                        <div className="bg-navy-800 border border-white/10 rounded-2xl rounded-tl-sm px-4 py-3">
                            <TypingDots />
                        </div>
                    </div>
                )}

                <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="px-4 pb-4 pt-2 flex-shrink-0">
                <div className="flex items-end gap-2 bg-navy-800/80 border border-white/10 rounded-2xl px-4 py-3 focus-within:border-gold-500 transition">
                    <textarea
                        ref={textareaRef}
                        rows={1}
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        disabled={sending}
                        placeholder="Message…"
                        className="no-scrollbar flex-1 bg-transparent text-sm text-white placeholder-navy-300 resize-none outline-none max-h-40 overflow-y-auto"
                    />
                    <button
                        onClick={handleSend}
                        disabled={sending || !input.trim()}
                        className="flex-shrink-0 w-9 h-9 rounded-full bg-gold-600 hover:bg-gold-500 disabled:opacity-40 flex items-center justify-center transition"
                    >
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
}

function Message({ message }) {
    const isUser = message.role === 'user';
    return (
        <div className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-semibold ${isUser ? 'bg-gold-600' : 'bg-navy-700'}`}>
                {isUser ? 'Y' : 'AI'}
            </div>
            <div className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words ${
                isUser ? 'bg-gold-600 text-white rounded-tr-sm' : 'bg-navy-800 border border-white/10 text-white rounded-tl-sm'
            }`}>
                {message.content}
            </div>
        </div>
    );
}

function TypingDots() {
    return (
        <div className="flex items-center gap-1 py-1">
            {[0, 1, 2].map(i => (
                <span key={i} className="w-2 h-2 bg-navy-300 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
            ))}
        </div>
    );
}

createRoot(document.getElementById('widget-app')).render(<PublicWidget />);
