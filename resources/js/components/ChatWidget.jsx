import React, { useState, useRef, useEffect } from 'react';
import App from './App';

export default function ChatWidget() {
    const [open, setOpen] = useState(false);
    const widgetRef = useRef(null);

    // Close the widget when clicking anywhere outside it
    useEffect(() => {
        if (!open) return;

        const handleClickOutside = (e) => {
            if (widgetRef.current && !widgetRef.current.contains(e.target)) {
                setOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [open]);

    return (
        <div ref={widgetRef} className="fixed bottom-5 right-5 z-50 flex flex-col items-end font-sans">
            {open && (
                <div className="mb-3 w-[380px] h-[600px] max-h-[80vh] bg-navy-900 text-white rounded-2xl shadow-2xl border border-white/10 flex flex-col overflow-hidden">
                    {/* Widget header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 flex-shrink-0 bg-navy-900">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-gold-400 to-gold-700 flex items-center justify-center flex-shrink-0 shadow-md shadow-black/50 ring-1 ring-white/10">
                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                          d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-3 3-3-3z"/>
                                </svg>
                            </div>
                            <span className="font-semibold text-sm">AI Chatbot</span>
                        </div>
                        <button
                            onClick={() => setOpen(false)}
                            className="text-navy-300 hover:text-white transition p-1 rounded hover:bg-white/10"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Widget body — existing app content */}
                    <div className="flex-1 flex min-h-0 overflow-hidden">
                        <App />
                    </div>
                </div>
            )}

            {/* Floating launcher bubble */}
            <button
                onClick={() => setOpen(prev => !prev)}
                className="w-14 h-14 rounded-full bg-gold-600 hover:bg-gold-500 shadow-lg flex items-center justify-center transition transform hover:scale-105"
                aria-label={open ? 'Close chat' : 'Open chat'}
            >
                {open ? (
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                ) : (
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-3 3-3-3z"/>
                    </svg>
                )}
            </button>
        </div>
    );
}
