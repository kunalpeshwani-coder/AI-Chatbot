import React, { useState } from 'react';

export default function EmbedCode({ chatbot }) {
    const [copied, setCopied] = useState(false);

    const snippet = `<script src="${window.location.origin}/widget.js" data-chatbot="${chatbot.public_key}" async></script>`;

    const handleCopy = async () => {
        await navigator.clipboard.writeText(snippet);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="h-full overflow-y-auto max-w-2xl pb-8 pr-4">
            <p className="text-navy-300 text-sm mb-5">
                Paste this snippet just before the closing <code className="text-navy-200">&lt;/body&gt;</code> tag on your website.
                It adds a floating chat bubble that visitors can open to talk to your chatbot.
            </p>

            <div className="relative bg-navy-950 border border-white/10 rounded-xl p-4 pr-24 font-mono text-sm text-emerald-300 overflow-x-auto mb-3">
                <code className="whitespace-pre-wrap break-all">{snippet}</code>
                <button
                    onClick={handleCopy}
                    className="absolute top-3 right-3 flex-shrink-0 text-xs px-2.5 py-1.5 bg-navy-800 hover:bg-navy-700 border border-white/10 rounded-lg text-navy-200 transition flex items-center gap-1.5"
                >
                    {copied ? (
                        <>
                            <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Copied
                        </>
                    ) : (
                        <>
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            Copy
                        </>
                    )}
                </button>
            </div>

            <div className="flex items-center gap-2 text-xs text-navy-300 mb-8">
                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Each chatbot has a unique key, so this snippet only works for this chatbot.
            </div>
        </div>
    );
}
