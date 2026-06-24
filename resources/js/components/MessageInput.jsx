import React, { useState, useRef } from 'react';

export default function MessageInput({ onSend, disabled }) {
    const [content, setContent] = useState('');
    const textareaRef = useRef(null);

    const handleSubmit = () => {
        const text = content.trim();
        if (!text || disabled) return;
        onSend(text);
        setContent('');
        textareaRef.current?.focus();
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    return (
        <div className="px-4 pb-4 pt-2 flex-shrink-0">
            <div className="flex items-end gap-2 bg-navy-800/80 backdrop-blur border border-white/10 rounded-2xl px-4 py-3 shadow-inner focus-within:border-gold-500 focus-within:shadow-[0_0_0_3px_rgba(99,102,241,0.25)] transition">
                <textarea
                    ref={textareaRef}
                    rows={1}
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={disabled}
                    placeholder="Message AI…"
                    className="no-scrollbar flex-1 bg-transparent text-sm text-white placeholder-navy-300 resize-none outline-none max-h-40 overflow-y-auto leading-relaxed"
                    style={{ minHeight: '1.5rem' }}
                />
                <button
                    onClick={handleSubmit}
                    disabled={disabled || !content.trim()}
                    className="flex-shrink-0 w-9 h-9 rounded-full bg-gold-600 hover:bg-gold-500 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition shadow-md hover:shadow-gold-500/30"
                >
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                    </svg>
                </button>
            </div>
            <p className="text-xs text-navy-300 text-center mt-2">
                AI can make mistakes. Verify important information.
            </p>
        </div>
    );
}
