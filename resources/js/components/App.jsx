import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './Sidebar';
import ChatArea from './ChatArea';
import DomainPicker from './DomainPicker';
import {
    getDomains,
    getConversations,
    createConversation,
    deleteConversation,
    getMessages,
    sendMessage,
} from '../api';

export default function App() {
    const [view, setView]                           = useState('pick'); // 'pick' | 'chat'
    const [domains, setDomains]                     = useState([]);
    const [domainsLoading, setDomainsLoading]       = useState(true);
    const [activeDomain, setActiveDomain]           = useState(null);
    const [conversations, setConversations]         = useState([]);
    const [activeConvId, setActiveConvId]           = useState(null);
    const [messages, setMessages]                   = useState([]);
    const [loadingMessages, setLoadingMessages]     = useState(false);
    const [sending, setSending]                     = useState(false);
    const [sidebarOpen, setSidebarOpen]             = useState(false);

    const userName         = document.querySelector('meta[name="user-name"]')?.content ?? 'User';
    const aiProvider       = document.querySelector('meta[name="ai-provider"]')?.content ?? 'openai';
    const preferredDomainId = document.querySelector('meta[name="preferred-domain-id"]')?.content;

    // Load public domains on mount, then jump straight to the user's registered
    // domain (chosen at sign-up) instead of making them pick it again.
    useEffect(() => {
        getDomains()
            .then(list => {
                setDomains(list);
                if (preferredDomainId) {
                    const preferred = list.find(d => String(d.id) === preferredDomainId);
                    if (preferred) {
                        setActiveDomain(preferred);
                        setView('chat');
                    }
                }
            })
            .catch(console.error)
            .finally(() => setDomainsLoading(false));
    }, []);

    // Load conversations when domain is selected, then auto-jump straight into one
    // so the widget opens ready to chat without requiring the (now hidden) sidebar.
    useEffect(() => {
        if (!activeDomain) { setConversations([]); setActiveConvId(null); return; }

        let cancelled = false;

        getConversations(activeDomain.id)
            .then(async (convs) => {
                if (cancelled) return;
                setConversations(convs);

                if (convs.length > 0) {
                    setActiveConvId(convs[0].id);
                } else {
                    const conv = await createConversation(activeDomain.id);
                    if (cancelled) return;
                    setConversations([conv]);
                    setActiveConvId(conv.id);
                }
            })
            .catch(console.error);

        return () => { cancelled = true; };
    }, [activeDomain]);

    // Load messages when conversation changes
    useEffect(() => {
        if (!activeConvId) { setMessages([]); return; }
        setLoadingMessages(true);
        getMessages(activeConvId)
            .then(setMessages)
            .catch(console.error)
            .finally(() => setLoadingMessages(false));
    }, [activeConvId]);

    const handleSelectDomain = useCallback((domain) => {
        setActiveDomain(domain);
        setActiveConvId(null);
        setMessages([]);
        setView('chat');
    }, []);

    const handleChangeDomain = useCallback(() => {
        setActiveDomain(null);
        setActiveConvId(null);
        setMessages([]);
        setConversations([]);
        setView('pick');
    }, []);

    const handleNewConversation = useCallback(async () => {
        const conv = await createConversation(activeDomain?.id ?? null);
        setConversations(prev => [conv, ...prev]);
        setActiveConvId(conv.id);
    }, [activeDomain]);

    const handleSelectConversation = useCallback((id) => {
        setActiveConvId(id);
    }, []);

    const handleDeleteConversation = useCallback(async (id) => {
        await deleteConversation(id);
        setConversations(prev => prev.filter(c => c.id !== id));
        if (activeConvId === id) {
            setActiveConvId(null);
            setMessages([]);
        }
    }, [activeConvId]);

    const handleSend = useCallback(async (content) => {
        if (!activeConvId || sending) return;
        setSending(true);

        const tempId  = Date.now();
        const tempMsg = { id: tempId, role: 'user', content, created_at: new Date().toISOString() };
        setMessages(prev => [...prev, tempMsg]);

        try {
            const data = await sendMessage(activeConvId, content);

            setMessages(prev => [
                ...prev.filter(m => m.id !== tempId),
                data.user,
                data.assistant,
            ]);

            if (data.conversation) {
                setConversations(prev =>
                    prev.map(c => c.id === activeConvId ? { ...c, title: data.conversation.title } : c)
                );
            }
        } catch (err) {
            setMessages(prev => prev.filter(m => m.id !== tempId));
            console.error(err);
        } finally {
            setSending(false);
        }
    }, [activeConvId, sending]);

    const activeConversation = conversations.find(c => c.id === activeConvId) ?? null;

    // Domain picker view
    if (view === 'pick') {
        return (
            <div className="flex flex-1 w-full overflow-hidden min-h-0">
                <DomainPicker domains={domains} loading={domainsLoading} onSelect={handleSelectDomain} />
            </div>
        );
    }

    // Chat view — sidebar (conversation history, account info) is hidden by default
    // to keep the small widget uncluttered; it slides in as an overlay when opened.
    return (
        <div className="flex flex-1 w-full overflow-hidden min-h-0 relative">
            {/* Backdrop + sidebar stay mounted so the slide/fade can animate both ways */}
            <div
                className={`absolute inset-0 bg-black/60 backdrop-blur-[2px] z-10 transition-opacity duration-300 ${
                    sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
                onClick={() => setSidebarOpen(false)}
            />
            <div
                className={`absolute inset-y-0 left-0 z-20 shadow-2xl transition-transform duration-300 ease-out ${
                    sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
            >
                <Sidebar
                    conversations={conversations}
                    activeConvId={activeConvId}
                    activeDomain={activeDomain}
                    userName={userName}
                    onNew={() => { handleNewConversation(); setSidebarOpen(false); }}
                    onSelect={(id) => { handleSelectConversation(id); setSidebarOpen(false); }}
                    onDelete={handleDeleteConversation}
                    onChangeDomain={handleChangeDomain}
                />
            </div>
            <ChatArea
                conversation={activeConversation}
                messages={messages}
                loading={loadingMessages}
                sending={sending}
                aiProvider={aiProvider}
                onSend={handleSend}
                onMenuClick={() => setSidebarOpen(true)}
            />
        </div>
    );
}
