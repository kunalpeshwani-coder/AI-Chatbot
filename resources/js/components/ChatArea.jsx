import React, { useEffect, useRef } from 'react';
import MessageInput from './MessageInput';
import Markdown from './Markdown';

const PROVIDER_COLORS = {
    openai: 'bg-emerald-900/50 text-emerald-300 border-emerald-700',
    claude: 'bg-orange-900/50 text-orange-300 border-orange-700',
    gemini: 'bg-blue-900/50 text-blue-300 border-blue-700',
};

const PROVIDER_LABELS = {
    openai: 'OpenAI',
    claude: 'Claude',
    gemini: 'Gemini',
};

export default function ChatArea({ conversation, messages, loading, sending, aiProvider, onSend, onMenuClick }) {
    const bottomRef = useRef(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, sending]);

    if (!conversation) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
                <Spinner />
            </div>
        );
    }

    const providerColor = PROVIDER_COLORS[aiProvider] ?? 'bg-navy-800 text-navy-200 border-navy-300';
    const providerLabel = PROVIDER_LABELS[aiProvider] ?? aiProvider;

    return (
        <div className="flex-1 flex flex-col min-w-0 min-h-0">
            {/* Chat header */}
            <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-white/10 flex-shrink-0">
                <button
                    onClick={onMenuClick}
                    className="p-1 -ml-1 rounded text-navy-300 hover:text-white hover:bg-white/10 transition flex-shrink-0"
                    title="Conversations & account"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>
                <h2 className="font-medium text-white truncate flex-1 text-sm">{conversation.title}</h2>
                <span className={`text-xs px-2 py-0.5 rounded-full border flex-shrink-0 ${providerColor}`}>
                    {providerLabel}
                </span>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
                {loading ? (
                    <div className="flex justify-center pt-10">
                        <Spinner />
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <p className="text-navy-300 text-sm">Send a message to start the conversation.</p>
                    </div>
                ) : (
                    messages.map(msg => <Message key={msg.id} message={msg} providerLabel={providerLabel} />)
                )}

                {/* Sending indicator */}
                {sending && (
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-navy-700 flex items-center justify-center flex-shrink-0">
                            <svg className="w-4 h-4 text-navy-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                      d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15M14.25 3.104c.251.023.501.05.75.082M19.8 15l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.5l.43.215a2.25 2.25 0 010 3.544l-.429.214a9.075 9.075 0 01-8.802 0L6 18.47a2.25 2.25 0 010-3.544l.43-.215" />
                            </svg>
                        </div>
                        <div className="bg-navy-800 border border-white/10 rounded-2xl rounded-tl-sm px-4 py-3">
                            <TypingDots />
                        </div>
                    </div>
                )}

                <div ref={bottomRef} />
            </div>

            {/* Input */}
            <MessageInput onSend={onSend} disabled={sending} />
        </div>
    );
}

function Message({ message, providerLabel }) {
    const isUser = message.role === 'user';

    return (
        <div className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
            {/* Avatar */}
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-semibold ${
                isUser ? 'bg-gold-600' : 'bg-navy-700'
            }`}>
                {isUser ? 'Y' : 'AI'}
            </div>

            {/* Bubble */}
            <div className={`max-w-[70%] px-4 py-3 rounded-2xl ${
                isUser
                    ? 'bg-gold-600 text-white rounded-tr-sm'
                    : 'bg-navy-800 border border-white/10 text-white rounded-tl-sm'
            }`}>
                {isUser ? (
                    <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{message.content}</p>
                ) : (
                    <Markdown content={message.content} />
                )}
            </div>
        </div>
    );
}

function Spinner() {
    return (
        <svg className="animate-spin w-6 h-6 text-gold-400" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
    );
}

function TypingDots() {
    return (
        <div className="flex items-center gap-1 py-1">
            {[0, 1, 2].map(i => (
                <span
                    key={i}
                    className="w-2 h-2 bg-navy-300 rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                />
            ))}
        </div>
    );
}
