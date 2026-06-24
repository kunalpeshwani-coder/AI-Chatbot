import React, { useState, useEffect } from 'react';
import { adminGetClient } from '../../api';

export default function ClientProfile({ clientId, onBack }) {
    const [client, setClient]   = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        adminGetClient(clientId).then(setClient).finally(() => setLoading(false));
    }, [clientId]);

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center rounded-2xl border border-white/10 bg-navy-900/60">
                <p className="text-navy-300 text-sm">Loading…</p>
            </div>
        );
    }

    if (!client) {
        return (
            <div className="flex-1 flex items-center justify-center rounded-2xl border border-white/10 bg-navy-900/60">
                <p className="text-navy-300 text-sm">Client not found.</p>
            </div>
        );
    }

    const initials = client.name.charAt(0).toUpperCase();
    const joined   = new Date(client.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
    const chatbots = client.chatbots ?? [];

    return (
        <div className="flex-1 flex flex-col overflow-hidden min-h-0">
            <button
                onClick={onBack}
                className="flex items-center gap-1.5 text-sm text-navy-300 hover:text-white transition mb-4 flex-shrink-0"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Clients
            </button>

            <div className="flex-1 overflow-y-auto rounded-2xl border border-white/10 bg-navy-900/60 p-6">
                {/* Profile header */}
                <div className="flex items-start gap-4 mb-6 pb-6 border-b border-white/10">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-gold-400 to-gold-700 flex items-center justify-center text-xl font-semibold flex-shrink-0 shadow-md shadow-black/40 ring-1 ring-white/10">
                        {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h2 className="text-lg font-semibold text-white">{client.name}</h2>
                        <p className="text-sm text-navy-300">{client.email}</p>
                        {client.company_name && (
                            <p className="text-sm text-navy-300 mt-0.5">{client.company_name}</p>
                        )}
                    </div>
                    <span className="text-xs font-medium bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 rounded-lg px-2.5 py-1 flex-shrink-0">
                        {client.package}
                    </span>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                    <StatCard label="Chatbots" value={chatbots.length} />
                    <StatCard label="Conversations" value={client.conversations_count ?? 0} />
                    <StatCard label="Joined" value={joined} small />
                </div>

                {/* Chatbots list */}
                <h3 className="text-sm font-semibold text-white mb-3">Chatbots ({chatbots.length})</h3>

                {chatbots.length === 0 ? (
                    <div className="text-center py-10">
                        <div className="text-4xl mb-3">🤖</div>
                        <p className="text-navy-300 text-sm">This client hasn't created any chatbots yet.</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {chatbots.map(bot => <ChatbotRow key={bot.id} bot={bot} />)}
                    </div>
                )}
            </div>
        </div>
    );
}

function StatCard({ label, value, small }) {
    return (
        <div className="bg-navy-800/60 border border-white/10 rounded-xl px-4 py-3">
            <p className={`font-semibold text-white ${small ? 'text-sm' : 'text-2xl'}`}>{value}</p>
            <p className="text-xs text-navy-300 mt-0.5">{label}</p>
        </div>
    );
}

function ChatbotRow({ bot }) {
    const created = new Date(bot.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });

    const STATUS_STYLES = {
        active:   'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
        inactive: 'bg-navy-700/60 text-navy-300 border-white/10',
    };

    return (
        <div className="flex items-center gap-3 bg-navy-800/40 border border-white/10 rounded-xl px-4 py-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-gold-400 to-gold-700 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M3 7a2 2 0 012-2h4.586a1 1 0 01.707.293l1.414 1.414a1 1 0 00.707.293H19a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
                </svg>
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{bot.name}</p>
                <p className="text-xs text-navy-300">
                    {bot.documents_count ?? 0} doc{bot.documents_count !== 1 ? 's' : ''} · Created {created}
                </p>
            </div>
            <span className={`text-xs font-medium rounded-lg px-2.5 py-1 border flex-shrink-0 ${STATUS_STYLES[bot.status] ?? STATUS_STYLES.inactive}`}>
                {bot.status}
            </span>
        </div>
    );
}
