import React, { useState, useEffect } from 'react';
import { adminGetClients, adminUpdateClientPackage } from '../../api';
import ClientProfile from './ClientProfile';

const PACKAGES = [
    { key: 'free', label: 'Free', available: true },
    { key: 'pro', label: 'Pro', available: false },
    { key: 'enterprise', label: 'Enterprise', available: false },
];

export default function ClientsManager() {
    const [clients, setClients]           = useState([]);
    const [loading, setLoading]           = useState(true);
    const [selectedClientId, setSelected] = useState(null);

    useEffect(() => {
        adminGetClients().then(setClients).finally(() => setLoading(false));
    }, []);

    const handlePackageChange = async (client, pkg) => {
        if (pkg === client.package) return;
        const updated = await adminUpdateClientPackage(client.id, pkg);
        setClients(prev => prev.map(c => c.id === client.id ? updated : c));
    };

    if (selectedClientId) {
        return <ClientProfile clientId={selectedClientId} onBack={() => setSelected(null)} />;
    }

    return (
        <div className="flex-1 flex flex-col overflow-hidden min-h-0 rounded-2xl border border-white/10 bg-navy-950">
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between flex-shrink-0">
                <span className="text-sm font-semibold text-navy-200">All Clients</span>
                <span className="text-xs text-navy-300">{clients.length} registered</span>
            </div>

            {loading ? (
                <div className="flex-1 flex items-center justify-center">
                    <p className="text-navy-300 text-sm">Loading…</p>
                </div>
            ) : clients.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
                    <div className="text-5xl mb-4">👥</div>
                    <p className="text-navy-300 text-sm">No clients yet.<br />Registered users will appear here.</p>
                </div>
            ) : (
                <div className="flex-1 overflow-y-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-left text-xs text-navy-300 uppercase tracking-wide border-b border-white/10">
                                <th className="px-6 py-3 font-medium">Client</th>
                                <th className="px-6 py-3 font-medium">Joined</th>
                                <th className="px-6 py-3 font-medium">Chatbots</th>
                                <th className="px-6 py-3 font-medium">Conversations</th>
                                <th className="px-6 py-3 font-medium">Package</th>
                            </tr>
                        </thead>
                        <tbody>
                            {clients.map(client => (
                                <ClientRow
                                    key={client.id}
                                    client={client}
                                    onSelect={() => setSelected(client.id)}
                                    onPackageChange={handlePackageChange}
                                />
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

function ClientRow({ client, onSelect, onPackageChange }) {
    const initials = client.name.charAt(0).toUpperCase();
    const joined   = new Date(client.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });

    return (
        <tr onClick={onSelect} className="border-b border-white/5 hover:bg-white/[0.02] transition cursor-pointer">
            <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gold-400 to-gold-700 flex items-center justify-center text-sm font-semibold flex-shrink-0 shadow-md shadow-black/40 ring-1 ring-white/10">
                        {initials}
                    </div>
                    <div className="min-w-0">
                        <p className="text-white font-medium truncate">{client.name}</p>
                        <p className="text-xs text-navy-300 truncate">{client.email}</p>
                    </div>
                </div>
            </td>
            <td className="px-6 py-4 text-navy-300">{joined}</td>
            <td className="px-6 py-4 text-navy-300">{client.chatbots_count ?? 0}</td>
            <td className="px-6 py-4 text-navy-300">{client.conversations_count ?? 0}</td>
            <td className="px-6 py-4" onClick={e => e.stopPropagation()}>
                <div className="relative inline-block">
                    <select
                        value={client.package}
                        onChange={e => onPackageChange(client, e.target.value)}
                        className="appearance-none text-xs font-medium bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 rounded-lg pl-3 pr-7 py-1.5 outline-none cursor-pointer hover:bg-emerald-500/20 transition"
                    >
                        {PACKAGES.map(p => (
                            <option
                                key={p.key}
                                value={p.key}
                                disabled={!p.available}
                                className="bg-navy-800 text-white"
                            >
                                {p.label}{!p.available ? ' (soon)' : ''}
                            </option>
                        ))}
                    </select>
                    <svg className="w-3 h-3 absolute right-2.5 top-1/2 -translate-y-1/2 text-emerald-300/70 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </td>
        </tr>
    );
}
