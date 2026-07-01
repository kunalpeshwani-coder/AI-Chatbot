import React, { useState, useEffect } from 'react';
import { getMyChatbots, createMyChatbot, deleteMyChatbot } from '../api';
import CreateChatbotForm from './client/CreateChatbotForm';
import ChatbotOverview from './client/ChatbotOverview';

const SIDEBAR_WIDTH = 256;

export default function ClientDashboard() {
    const [chatbots, setChatbots]             = useState([]);
    const [activeId, setActiveId]             = useState(null);
    const [loading, setLoading]               = useState(true);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [sidebarHidden, setSidebarHidden]   = useState(false);
    const userName = document.querySelector('meta[name="user-name"]')?.content ?? 'there';

    useEffect(() => {
        getMyChatbots()
            .then(list => {
                setChatbots(list);
                if (list.length > 0) setActiveId(list[0].id);
            })
            .finally(() => setLoading(false));
    }, []);

    // Keep Render server awake — ping every 10 minutes
    useEffect(() => {
        const id = setInterval(() => fetch('/ping').catch(() => {}), 10 * 60 * 1000);
        return () => clearInterval(id);
    }, []);

    const handleCreate = async (data) => {
        const created = await createMyChatbot(data);
        setChatbots(prev => [created, ...prev]);
        setActiveId(created.id);
        setShowCreateForm(false);
    };

    const handleDelete = async (chatbot) => {
        if (!confirm(`Delete "${chatbot.name}"? This removes all its documents too.`)) return;
        await deleteMyChatbot(chatbot.id);
        setChatbots(prev => prev.filter(c => c.id !== chatbot.id));
        if (activeId === chatbot.id) setActiveId(null);
    };

    const activeChatbot = chatbots.find(c => c.id === activeId) ?? null;
    const showForm = showCreateForm || (!loading && chatbots.length === 0);

    return (
        <div className="h-screen flex bg-navy-800 text-white">

            {/* Icon-only rail — shown when sidebar is collapsed */}
            {sidebarHidden && (
                <aside className="flex-shrink-0 w-14 bg-navy-950 border-r border-white/10 flex flex-col items-center py-3 gap-1">
                    <button
                        onClick={() => setSidebarHidden(false)}
                        title="Open sidebar"
                        className="w-9 h-9 flex items-center justify-center rounded-lg text-navy-400 hover:text-white hover:bg-white/10 transition mb-1"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>

                    <button
                        onClick={() => { setSidebarHidden(false); setShowCreateForm(true); setActiveId(null); }}
                        title="New chatbot"
                        className="w-9 h-9 flex items-center justify-center rounded-xl bg-gold-600 hover:bg-gold-500 transition text-white font-bold text-base"
                    >
                        +
                    </button>

                    <div className="w-6 border-t border-white/10 my-1" />

                    <nav className="flex-1 flex flex-col items-center gap-1 overflow-y-auto w-full px-2">
                        {chatbots.map(bot => (
                            <button
                                key={bot.id}
                                onClick={() => { setSidebarHidden(false); setActiveId(bot.id); setShowCreateForm(false); }}
                                title={bot.name}
                                className={`w-9 h-9 flex items-center justify-center rounded-xl transition flex-shrink-0 ${
                                    bot.id === activeId && !showCreateForm
                                        ? 'bg-gold-600/20 ring-1 ring-gold-500/40 text-gold-400'
                                        : 'text-navy-400 hover:bg-white/5 hover:text-navy-200'
                                }`}
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                          d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-3 3-3-3z" />
                                </svg>
                            </button>
                        ))}
                    </nav>

                    <div className="flex flex-col items-center gap-1 mt-auto">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gold-400 to-gold-700 flex items-center justify-center text-xs font-semibold ring-1 ring-white/10" title={userName}>
                            {userName.charAt(0).toUpperCase()}
                        </div>
                        <form method="POST" action="/logout">
                            <input type="hidden" name="_token" value={document.querySelector('meta[name="csrf-token"]')?.content} />
                            <button type="submit" title="Sign out"
                                className="w-9 h-9 flex items-center justify-center rounded-xl text-navy-400 hover:text-red-300 hover:bg-red-500/10 transition">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1" />
                                </svg>
                            </button>
                        </form>
                    </div>
                </aside>
            )}

            {/* Full sidebar — fixed width, click background to close */}
            {!sidebarHidden && (
                <aside
                    style={{ width: SIDEBAR_WIDTH }}
                    className="relative flex-shrink-0 bg-navy-950 border-r border-white/10 flex flex-col overflow-hidden"
                >
                    {/* Backdrop — clicking empty areas closes the sidebar */}
                    <div className="absolute inset-0 z-0 cursor-pointer" onClick={() => setSidebarHidden(true)} />

                    {/* Header */}
                    <div className="relative z-10 flex items-center gap-2.5 px-4 py-5">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-gold-400 to-gold-700 flex items-center justify-center flex-shrink-0 shadow-md shadow-black/50 ring-1 ring-white/10">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                      d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-3 3-3-3z"/>
                            </svg>
                        </div>
                        <span className="font-semibold text-sm whitespace-nowrap flex-1">AI Chatbot</span>
                        <button
                            onClick={() => setSidebarHidden(true)}
                            title="Close sidebar"
                            className="w-7 h-7 flex items-center justify-center rounded-lg text-navy-400 hover:text-white hover:bg-white/10 transition flex-shrink-0"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                    </div>

                    {/* My Chatbots label + New button */}
                    <div className="relative z-10 flex items-center justify-between px-4 mt-2 mb-1">
                        <span className="text-xs font-medium text-navy-300 uppercase tracking-wide">My Chatbots</span>
                        <button
                            onClick={() => { setShowCreateForm(true); setActiveId(null); }}
                            className="text-sm px-4 py-2.5 bg-gold-600 hover:bg-gold-500 rounded-xl transition font-medium"
                        >
                            + New
                        </button>
                    </div>

                    {/* Nav list */}
                    <nav className="relative z-10 flex-1 overflow-y-auto px-3 space-y-1">
                        {chatbots.map(bot => (
                            <ChatbotNavItem
                                key={bot.id}
                                chatbot={bot}
                                active={bot.id === activeId && !showCreateForm}
                                onSelect={() => { setActiveId(bot.id); setShowCreateForm(false); }}
                                onDelete={() => handleDelete(bot)}
                            />
                        ))}
                        {!loading && chatbots.length === 0 && !showCreateForm && (
                            <p className="text-xs text-navy-300 text-center mt-6 px-2">
                                No chatbots yet.<br />Click "+ New" to create one.
                            </p>
                        )}
                    </nav>

                    {/* Footer */}
                    <div className="relative z-10 p-3 border-t border-white/10">
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
            )}

            {/* Main content */}
            <main className="flex-1 flex flex-col overflow-hidden min-h-0 bg-navy-800 p-6">
                {loading ? (
                    <div className="flex-1 flex items-center justify-center">
                        <p className="text-navy-300 text-sm">Loading…</p>
                    </div>
                ) : showForm ? (
                    <CreateChatbotForm
                        onCreate={handleCreate}
                        onCancel={chatbots.length > 0 ? () => {
                            setShowCreateForm(false);
                            setActiveId(chatbots[0].id);
                        } : undefined}
                    />
                ) : activeChatbot ? (
                    <ChatbotOverview
                        chatbot={activeChatbot}
                        onUpdate={(updated) => setChatbots(prev => prev.map(c => c.id === updated.id ? updated : c))}
                    />
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
                        <div className="text-5xl mb-4">🤖</div>
                        <p className="text-navy-300 text-sm">Select a chatbot from the sidebar,<br />or create a new one.</p>
                    </div>
                )}
            </main>
        </div>
    );
}

function ChatbotNavItem({ chatbot, active, onSelect, onDelete }) {
    return (
        <div
            className={`group flex items-center gap-2.5 px-3 py-2.5 rounded-xl cursor-pointer transition ${
                active ? 'bg-gold-600/20 text-white ring-1 ring-gold-500/40' : 'text-navy-300 hover:bg-white/5 hover:text-navy-200'
            }`}
            onClick={e => { e.stopPropagation(); onSelect(); }}
        >
            <svg className={`w-4 h-4 flex-shrink-0 ${active ? 'text-gold-400' : 'text-navy-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M3 7a2 2 0 012-2h4.586a1 1 0 01.707.293l1.414 1.414a1 1 0 00.707.293H19a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
            </svg>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{chatbot.name}</p>
                <p className="text-xs text-navy-300">{chatbot.documents_count ?? 0} docs</p>
            </div>
            <button
                onClick={e => { e.stopPropagation(); onDelete(); }}
                className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-white/10 text-navy-300 hover:text-red-400 transition flex-shrink-0"
                title="Delete"
            >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
    );
}
