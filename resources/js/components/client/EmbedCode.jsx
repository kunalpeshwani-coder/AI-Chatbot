import React, { useState } from 'react';
import { updateMyChatbot } from '../../api';

export default function EmbedCode({ chatbot, onUpdate }) {
    const [copied, setCopied] = useState(false);
    const [instructions, setInstructions] = useState('');
    const [saving, setSaving]   = useState(false);
    const [saved, setSaved]     = useState(false);
    const [error, setError]     = useState(null);

    const snippet = `<script src="${window.location.origin}/widget.js" data-chatbot="${chatbot.public_key}" async></script>`;

    const handleCopy = async () => {
        await navigator.clipboard.writeText(snippet);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleSave = async () => {
        setSaving(true);
        setError(null);
        try {
            const updated = await updateMyChatbot(chatbot.id, { instructions });
            onUpdate?.(updated);
            setInstructions('');
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } catch (err) {
            setError(err.response?.data?.message ?? err.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="h-full overflow-y-auto max-w-2xl pb-8">
            <p className="text-navy-300 text-sm mb-5">
                Paste this snippet just before the closing <code className="text-navy-200">&lt;/body&gt;</code> tag on your website.
                It adds a floating chat bubble that visitors can open to talk to your chatbot.
            </p>

            <div className="relative bg-navy-900 border border-white/10 rounded-xl p-4 font-mono text-sm text-emerald-300 overflow-x-auto mb-3">
                <code className="whitespace-pre-wrap break-all">{snippet}</code>
                <button
                    onClick={handleCopy}
                    className="absolute top-3 right-3 text-xs px-2.5 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-navy-200 transition flex items-center gap-1.5"
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

            {/* Custom instructions for the chatbot's behavior/tone */}
            <div className="border-t border-white/10 pt-6">
                <h3 className="text-sm font-semibold text-white mb-1.5">Custom Instructions</h3>
                <p className="text-navy-300 text-sm mb-4">
                    Tell your chatbot how to behave — its tone, things to avoid, how to handle specific
                    topics, etc. These instructions are followed in addition to your knowledge base.
                </p>

                <textarea
                    value={instructions}
                    onChange={e => setInstructions(e.target.value)}
                    rows={5}
                    placeholder='e.g. "Always be friendly and concise. If asked about pricing, direct the user to our pricing page. Never make up information you are not sure about."'
                    className="w-full bg-navy-900 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-navy-300 outline-none focus:border-gold-500 resize-none mb-3"
                />

                {error && (
                    <div className="mb-3 px-3 py-2 bg-red-900/40 border border-red-700 rounded-lg text-red-300 text-sm">
                        {error}
                    </div>
                )}

                <button
                    onClick={handleSave}
                    disabled={saving || !instructions.trim()}
                    className="px-4 py-2 bg-gold-600 hover:bg-gold-500 disabled:opacity-50 rounded-lg text-sm font-medium transition flex items-center gap-2"
                >
                    {saving ? 'Saving…' : saved ? (
                        <>
                            <svg className="w-4 h-4 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Saved
                        </>
                    ) : 'Save Settings'}
                </button>
            </div>
        </div>
    );
}
