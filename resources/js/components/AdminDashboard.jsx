import React, { useState } from 'react';
import DomainsManager from './admin/DomainsManager';
import ClientsManager from './admin/ClientsManager';

const NAV = [
    {
        key: 'domains',
        label: 'Domains',
        icon: (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M3 7a2 2 0 012-2h4.586a1 1 0 01.707.293l1.414 1.414a1 1 0 00.707.293H19a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
        ),
    },
    {
        key: 'clients',
        label: 'Clients',
        icon: (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-4a4 4 0 10-4-4 4 4 0 004 4zm6 4a4 4 0 10-4-4" />
        ),
    },
];

export default function AdminDashboard() {
    const [tab, setTab] = useState('domains');
    const userName = document.querySelector('meta[name="user-name"]')?.content ?? 'Admin';

    return (
        <div className="h-screen flex bg-navy-950 text-white">
            {/* Side nav */}
            <aside className="w-60 flex-shrink-0 bg-navy-900/60 border-r border-white/10 flex flex-col">
                <div className="flex items-center gap-2.5 px-5 py-5">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-gold-400 to-gold-700 flex items-center justify-center flex-shrink-0 shadow-md shadow-black/50 ring-1 ring-white/10">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                  d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-3 3-3-3z"/>
                        </svg>
                    </div>
                    <span className="font-semibold text-sm">AI Chatbot</span>
                </div>

                <nav className="flex-1 px-3 space-y-1 mt-2">
                    {NAV.map(item => (
                        <button
                            key={item.key}
                            onClick={() => setTab(item.key)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                                tab === item.key
                                    ? 'bg-gold-600/20 text-white ring-1 ring-gold-500/40'
                                    : 'text-navy-300 hover:bg-white/5 hover:text-navy-200'
                            }`}
                        >
                            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                {item.icon}
                            </svg>
                            {item.label}
                        </button>
                    ))}
                </nav>

                <div className="p-3 border-t border-white/10">
                    <div className="flex items-center gap-2.5 px-2 py-2 mb-1">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gold-400 to-gold-700 flex items-center justify-center text-xs font-semibold flex-shrink-0 ring-1 ring-white/10">
                            {userName.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm text-navy-200 truncate">{userName}</span>
                    </div>
                    <form method="POST" action="/logout">
                        <input type="hidden" name="_token" value={document.querySelector('meta[name="csrf-token"]')?.content} />
                        <button type="submit"
                            className="w-full text-left text-xs text-navy-300 hover:text-red-300 transition flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-red-500/10">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1" />
                            </svg>
                            Sign out
                        </button>
                    </form>
                </div>
            </aside>

            {/* Main content */}
            <main className="flex-1 flex flex-col overflow-hidden min-h-0 p-6">
                <h1 className="text-xl font-semibold text-white mb-5 flex-shrink-0">
                    {tab === 'domains' ? 'Domains' : 'Clients'}
                </h1>
                {tab === 'domains' ? <DomainsManager /> : <ClientsManager />}
            </main>
        </div>
    );
}
