import React, { useState, useRef, useEffect } from 'react';
import { testChatbotMessage } from '../../api';

export default function TestChat({ chatbot }) {
    const [messages, setMessages] = useState([]);
    const [input, setInput]       = useState('');
    const [sending, setSending]   = useState(false);
    const bottomRef = useRef(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, sending]);

    const handleSend = async () => {
        const content = input.trim();
        if (!content || sending) return;

        const history = [...messages, { role: 'user', content }];
        setMessages(history);
        setInput('');
        setSending(true);

        try {
            const data = await testChatbotMessage(chatbot.id, history);
            setMessages(prev => [...prev, { role: 'assistant', content: data.content }]);
        } catch (err) {
            console.error(err);
        } finally {
            setSending(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="h-full flex flex-col max-w-2xl">
            <p className="text-navy-300 text-sm mb-4">
                Try out your chatbot here. This preview isn't saved — it's just for checking how it responds.
            </p>

            <div className="flex-1 flex flex-col bg-navy-900/60 border border-white/10 rounded-2xl overflow-hidden min-h-0">
                <div className="flex-1 overflow-y-auto px-5 py-5 pr-7 space-y-4">
                    {messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center">
                            <p className="text-navy-300 text-sm">Send a message to test your chatbot.</p>
                        </div>
                    ) : (
                        messages.map((msg, i) => <Message key={i} message={msg} />)
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

                <div className="px-4 pb-4 pt-2 flex-shrink-0">
                    <div className="flex items-end gap-2 bg-navy-800/80 border border-white/10 rounded-2xl px-4 py-3 focus-within:border-gold-500 transition">
                        <textarea
                            rows={1}
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            disabled={sending}
                            placeholder="Message your chatbot…"
                            className="no-scrollbar flex-1 bg-transparent text-sm text-white placeholder-navy-300 resize-none outline-none max-h-32 overflow-y-auto"
                        />
                        <button
                            onClick={handleSend}
                            disabled={sending || !input.trim()}
                            className="flex-shrink-0 w-9 h-9 rounded-full bg-gold-600 hover:bg-gold-500 disabled:opacity-40 flex items-center justify-center transition"
                        >
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                        </button>
                    </div>
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
