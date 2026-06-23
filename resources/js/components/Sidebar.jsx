import React from 'react';
import DomainIcon from './DomainIcon';

export default function Sidebar({
    conversations, activeConvId, activeDomain, userName,
    onNew, onSelect, onDelete, onChangeDomain,
}) {
    return (
        <aside className="w-60 flex-shrink-0 h-full bg-navy-950 border-r border-white/10 flex flex-col min-h-0">
            {/* User info — gradient header */}
            <div className="p-4 bg-gradient-to-br from-gold-600/20 via-navy-950 to-navy-950 border-b border-white/10">
                <div className="flex items-center gap-2.5 mb-4">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gold-400 to-gold-700 flex items-center justify-center text-sm font-semibold flex-shrink-0 shadow-md shadow-black/50 ring-1 ring-white/10">
                        {userName.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-medium text-white truncate">{userName}</span>
                </div>

                {/* Active domain badge */}
                {activeDomain && (
                    <button
                        onClick={onChangeDomain}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition mb-2.5 text-left"
                        title="Change domain"
                    >
                        <DomainIcon size="sm" />
                        <span className="text-xs text-navy-200 truncate flex-1">{activeDomain.name}</span>
                        <svg className="w-3 h-3 text-navy-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                        </svg>
                    </button>
                )}

                <button
                    onClick={onNew}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-gold-600 hover:bg-gold-500 text-sm font-medium transition shadow-md shadow-black/40 hover:shadow-gold-700/40 hover:-translate-y-0.5"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    New Chat
                </button>
            </div>

            {/* Conversation list */}
            <nav className="flex-1 overflow-y-auto p-2 space-y-1">
                {conversations.length === 0 ? (
                    <div className="text-center mt-8 px-4">
                        <div className="text-3xl mb-2 opacity-50">💭</div>
                        <p className="text-xs text-navy-300">
                            No conversations yet.<br />Click "New Chat" to start.
                        </p>
                    </div>
                ) : (
                    conversations.map(conv => (
                        <ConversationItem
                            key={conv.id}
                            conv={conv}
                            active={conv.id === activeConvId}
                            onSelect={onSelect}
                            onDelete={onDelete}
                        />
                    ))
                )}
            </nav>

            {/* Footer */}
            <div className="p-3 border-t border-white/10 space-y-1">
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
    );
}

function ConversationItem({ conv, active, onSelect, onDelete }) {
    return (
        <div
            className={`group flex items-center gap-2.5 px-3 py-2.5 rounded-xl cursor-pointer transition-all ${
                active
                    ? 'bg-gold-600/20 text-white ring-1 ring-gold-500/40'
                    : 'text-navy-300 hover:bg-white/5 hover:text-navy-200'
            }`}
            onClick={() => onSelect(conv.id)}
        >
            <svg className={`w-4 h-4 flex-shrink-0 ${active ? 'text-gold-400' : 'text-navy-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-3 3-3-3z" />
            </svg>
            <div className="flex-1 min-w-0">
                <p className="text-sm truncate">{conv.title}</p>
            </div>
            <button
                className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-white/10 text-navy-300 hover:text-red-400 transition flex-shrink-0"
                onClick={e => { e.stopPropagation(); onDelete(conv.id); }}
                title="Delete"
            >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
    );
}
