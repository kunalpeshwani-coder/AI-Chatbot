import React, { useState } from 'react';
import ClientsManager from './admin/ClientsManager';

export default function AdminDashboard() {
    const [collapsed, setCollapsed] = useState(false);
    const userName = document.querySelector('meta[name="user-name"]')?.content ?? 'Admin';

    return (
        <div className="h-screen flex bg-navy-800 text-white">
            {/* Side nav — click to collapse/expand */}
            <aside
                onClick={() => setCollapsed(v => !v)}
                title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                className={`flex-shrink-0 bg-navy-950 border-r border-white/10 flex flex-col transition-all duration-200 cursor-pointer hover:bg-navy-900 ${
                    collapsed ? 'w-16' : 'w-60'
                }`}
            >
                <div className={`flex items-center gap-2.5 px-5 py-5 ${collapsed ? 'justify-center px-0' : ''}`}>
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-gold-400 to-gold-700 flex items-center justify-center flex-shrink-0 shadow-md shadow-black/50 ring-1 ring-white/10">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                  d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-3 3-3-3z"/>
                        </svg>
                    </div>
                    {!collapsed && <span className="font-semibold text-sm">AI Chatbot</span>}
                </div>

                <div className="flex-1" />

                <div className={`p-3 border-t border-white/10 ${collapsed ? 'px-2' : ''}`}>
                    <div className={`flex items-center gap-2.5 px-2 py-2 mb-1 ${collapsed ? 'justify-center px-0' : ''}`}>
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gold-400 to-gold-700 flex items-center justify-center text-xs font-semibold flex-shrink-0 ring-1 ring-white/10">
                            {userName.charAt(0).toUpperCase()}
                        </div>
                        {!collapsed && <span className="text-sm text-navy-200 truncate">{userName}</span>}
                    </div>
                    <form method="POST" action="/logout" onClick={e => e.stopPropagation()}>
                        <input type="hidden" name="_token" value={document.querySelector('meta[name="csrf-token"]')?.content} />
                        <button type="submit" title="Sign out"
                            className={`w-full text-left text-xs text-navy-300 hover:text-red-300 transition flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-red-500/10 ${
                                collapsed ? 'justify-center px-0' : ''
                            }`}>
                            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1" />
                            </svg>
                            {!collapsed && 'Sign out'}
                        </button>
                    </form>
                </div>
            </aside>

            {/* Main content */}
            <main className="flex-1 flex flex-col overflow-hidden min-h-0 bg-navy-800 p-6">
                <div className="flex-shrink-0 bg-navy-700 border border-white/10 rounded-2xl px-6 py-5 mb-5 shadow-md shadow-black/20">
                    <h1 className="text-xl font-semibold text-white">Clients</h1>
                </div>
                <ClientsManager />
            </main>
        </div>
    );
}
