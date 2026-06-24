import React, { useState } from 'react';
import KnowledgeBase from './KnowledgeBase';
import ChatbotSettings from './ChatbotSettings';
import TestChat from './TestChat';
import EmbedCode from './EmbedCode';

const TABS = [
    { key: 'knowledge', label: 'Knowledge Base' },
    { key: 'settings',  label: 'Custom Instructions' },
    { key: 'test',      label: 'Test It' },
    { key: 'embed',     label: 'Embed Code' },
];

export default function ChatbotOverview({ chatbot, onUpdate }) {
    const [tab, setTab] = useState('knowledge');

    return (
        <div className="flex-1 flex flex-col overflow-hidden min-h-0">
            {/* Header */}
            <div className="flex items-center justify-between mb-6 flex-shrink-0 bg-navy-700 border border-white/10 rounded-2xl px-6 py-5 shadow-md shadow-black/20">
                <div>
                    <div className="flex items-center gap-2.5 mb-1">
                        <h1 className="text-xl font-semibold text-white">{chatbot.name}</h1>
                        <span className="text-[11px] font-semibold uppercase tracking-wide px-2 py-0.5 bg-emerald-500/15 text-emerald-300 rounded-md border border-emerald-500/30">
                            {chatbot.status}
                        </span>
                    </div>
                    {chatbot.description && (
                        <p className="text-navy-300 text-sm max-w-xl">{chatbot.description}</p>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-white/10 mb-6 flex-shrink-0">
                {TABS.map(t => (
                    <button
                        key={t.key}
                        onClick={() => setTab(t.key)}
                        className={`px-4 py-2.5 text-sm font-medium transition relative ${
                            tab === t.key ? 'text-white' : 'text-navy-300 hover:text-navy-200'
                        }`}
                    >
                        {t.label}
                        {tab === t.key && (
                            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold-500 rounded-full" />
                        )}
                    </button>
                ))}
            </div>

            <div className="flex-1 overflow-hidden min-h-0">
                {tab === 'knowledge' && <KnowledgeBase chatbot={chatbot} onUpdate={onUpdate} />}
                {tab === 'settings' && <ChatbotSettings chatbot={chatbot} onUpdate={onUpdate} />}
                {tab === 'test' && <TestChat chatbot={chatbot} />}
                {tab === 'embed' && <EmbedCode chatbot={chatbot} onUpdate={onUpdate} />}
            </div>
        </div>
    );
}
