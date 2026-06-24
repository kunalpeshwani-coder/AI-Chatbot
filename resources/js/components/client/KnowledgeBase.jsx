import React, { useState, useEffect, useRef } from 'react';
import { getChatbotDocuments, uploadChatbotDocument, deleteChatbotDocument, addChatbotUrl, updateMyChatbot } from '../../api';
import DatabaseConnect from './DatabaseConnect';

export default function KnowledgeBase({ chatbot, onUpdate }) {
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading]     = useState(true);
    const [uploading, setUploading] = useState(false);
    const [dragOver, setDragOver]   = useState(false);
    const [urlInput, setUrlInput]   = useState('');
    const [addingUrl, setAddingUrl] = useState(false);
    const [urlError, setUrlError]   = useState(null);
    const [allowGeneralKnowledge, setAllowGeneralKnowledge] = useState(chatbot.allow_general_knowledge ?? true);
    const [savingScope, setSavingScope] = useState(false);
    const inputRef = useRef();

    useEffect(() => {
        if (!chatbot?.id) {
            console.error('KnowledgeBase mounted without a valid chatbot.id:', JSON.stringify(chatbot));
            setLoading(false);
            return;
        }
        getChatbotDocuments(chatbot.id).then(setDocuments).finally(() => setLoading(false));
    }, [chatbot?.id]);

    const refreshDocuments = () => {
        if (chatbot?.id) getChatbotDocuments(chatbot.id).then(setDocuments);
    };

    const handleFile = async (file) => {
        if (!file || !chatbot?.id) return;
        setUploading(true);
        try {
            const doc = await uploadChatbotDocument(chatbot.id, file);
            setDocuments(prev => [doc, ...prev]);
        } finally {
            setUploading(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
    };

    const handleAddUrl = async (e) => {
        e.preventDefault();
        const url = urlInput.trim();
        if (!url || !chatbot?.id) return;

        setAddingUrl(true);
        setUrlError(null);
        try {
            const doc = await addChatbotUrl(chatbot.id, url);
            setDocuments(prev => [doc, ...prev]);
            setUrlInput('');
        } catch (err) {
            setUrlError(err.response?.data?.message ?? err.message);
        } finally {
            setAddingUrl(false);
        }
    };

    const handleDelete = async (doc) => {
        if (!confirm(`Delete "${doc.original_name}"?`)) return;
        await deleteChatbotDocument(chatbot.id, doc.id);
        setDocuments(prev => prev.filter(d => d.id !== doc.id));
    };

    const handleToggleScope = async () => {
        const next = !allowGeneralKnowledge;
        setAllowGeneralKnowledge(next);
        setSavingScope(true);
        try {
            const updated = await updateMyChatbot(chatbot.id, { allow_general_knowledge: next });
            onUpdate?.(updated);
        } catch (err) {
            setAllowGeneralKnowledge(!next);
            console.error(err);
        } finally {
            setSavingScope(false);
        }
    };

    const formatSize = (bytes) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const STATUS_STYLES = {
        processed: 'text-emerald-400',
        pending:   'text-yellow-400',
        failed:    'text-red-400',
    };

    return (
        <div className="h-full flex flex-col max-w-2xl overflow-y-auto pr-4">
            <p className="text-navy-300 text-sm mb-5">
                Upload documents, add a website URL, or both — your chatbot answers questions grounded in this content.
            </p>

            {/* Drop zone */}
            <div
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition mb-3 ${
                    dragOver ? 'border-gold-500 bg-gold-600/10' : 'border-white/10 hover:border-white/30'
                }`}
            >
                <input ref={inputRef} type="file" className="hidden"
                    accept=".txt,.pdf,.docx,.md,.xlsx,.xls"
                    onChange={e => handleFile(e.target.files[0])} />
                {uploading ? (
                    <p className="text-sm text-gold-300">Uploading and extracting text…</p>
                ) : (
                    <>
                        <p className="text-sm text-navy-200">Drop a file here or <span className="text-gold-400">click to browse</span></p>
                        <p className="text-xs text-navy-300 mt-1">Supports: PDF, TXT, DOCX, MD, XLSX, XLS · Max 20MB</p>
                    </>
                )}
            </div>

            {/* Website URL input */}
            <form onSubmit={handleAddUrl} className="flex gap-2 mb-5">
                <input
                    type="url"
                    value={urlInput}
                    onChange={e => setUrlInput(e.target.value)}
                    placeholder="https://example.com/your-page"
                    disabled={addingUrl}
                    className="flex-1 bg-navy-900 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-navy-300 outline-none focus:border-gold-500 disabled:opacity-60"
                />
                <button
                    type="submit"
                    disabled={addingUrl || !urlInput.trim()}
                    className="px-4 py-2.5 bg-gold-600 hover:bg-gold-500 disabled:opacity-50 rounded-xl text-sm font-medium transition flex-shrink-0"
                >
                    {addingUrl ? 'Adding…' : 'Add URL'}
                </button>
            </form>

            {urlError && (
                <div className="mb-4 px-3 py-2 bg-red-900/40 border border-red-700 rounded-lg text-red-300 text-sm">
                    {urlError}
                </div>
            )}

            {/* Documents list */}
            <div className="space-y-2">
                {loading ? (
                    <p className="text-sm text-navy-300 text-center py-8">Loading…</p>
                ) : documents.length === 0 ? (
                    <p className="text-sm text-navy-300 text-center py-8">No documents uploaded yet.</p>
                ) : (
                    documents.map(doc => (
                        <div key={doc.id} className="flex items-center gap-3 bg-navy-900/60 border border-white/10 rounded-lg px-4 py-3">
                            <FileIcon type={doc.file_type} />
                            <div className="flex-1 min-w-0">
                                {doc.source_url ? (
                                    <a href={doc.source_url} target="_blank" rel="noopener noreferrer"
                                        className="text-sm text-gold-400 hover:text-gold-300 hover:underline truncate block">
                                        {doc.original_name}
                                    </a>
                                ) : (
                                    <p className="text-sm text-white truncate">{doc.original_name}</p>
                                )}
                                <p className="text-xs text-navy-300">
                                    {doc.source_url ? 'Website' : formatSize(doc.size_bytes)} ·{' '}
                                    <span className={STATUS_STYLES[doc.status] ?? 'text-navy-300'}>{doc.status}</span>
                                </p>
                            </div>
                            <button onClick={() => handleDelete(doc)}
                                className="p-1.5 rounded hover:bg-white/10 text-navy-300 hover:text-red-400 transition flex-shrink-0">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </button>
                        </div>
                    ))
                )}
            </div>

            <DatabaseConnect chatbot={chatbot} onUpdate={refreshDocuments} />

            {/* Answer scope toggle */}
            <div className="border-t border-white/10 pt-5 mt-5 flex-shrink-0">
                <button
                    type="button"
                    onClick={handleToggleScope}
                    disabled={savingScope}
                    className="w-full flex items-center gap-3 px-4 py-3 bg-navy-900 border border-white/10 rounded-xl hover:border-white/20 transition text-left disabled:opacity-60"
                >
                    <span
                        className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors ${
                            allowGeneralKnowledge ? 'bg-gold-600' : 'bg-navy-700'
                        }`}
                    >
                        <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                allowGeneralKnowledge ? 'translate-x-6' : 'translate-x-1'
                            }`}
                        />
                    </span>
                    <div className="flex-1">
                        <p className="text-sm font-medium text-white">
                            {allowGeneralKnowledge ? 'Use outside knowledge when needed' : 'Knowledge base only'}
                        </p>
                        <p className="text-xs text-navy-300 mt-1 italic">
                            {allowGeneralKnowledge
                                ? '"Prefer the documents above when they cover the question. If a question goes beyond what the documents cover, answer it using your own general knowledge instead of refusing — just don\'t contradict the documents."'
                                : '"Only answer using the documents above. If the answer isn\'t in the documents, say you don\'t have that information — do not use outside knowledge or make anything up."'}
                        </p>
                    </div>
                </button>
            </div>
        </div>
    );
}

function FileIcon({ type }) {
    const icons = { pdf: '📄', txt: '📝', md: '📝', docx: '📃', xlsx: '📊', xls: '📊', url: '🔗', database: '🗄️' };
    return <span className="text-xl flex-shrink-0">{icons[type] ?? '📎'}</span>;
}
