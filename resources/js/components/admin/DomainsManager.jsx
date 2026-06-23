import React, { useState, useEffect, useRef } from 'react';
import {
    adminGetDomains, adminCreateDomain, adminUpdateDomain, adminDeleteDomain,
    adminGetDocuments, adminUploadDocument, adminDeleteDocument,
} from '../../api';
import DomainIcon from '../DomainIcon';

export default function DomainsManager() {
    const [domains, setDomains]           = useState([]);
    const [activeDomain, setActiveDomain] = useState(null);
    const [documents, setDocuments]       = useState([]);
    const [loading, setLoading]           = useState(true);
    const [showForm, setShowForm]         = useState(false);
    const [editTarget, setEditTarget]     = useState(null);

    useEffect(() => {
        adminGetDomains().then(setDomains).finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        if (!activeDomain) { setDocuments([]); return; }
        adminGetDocuments(activeDomain.id).then(setDocuments);
    }, [activeDomain]);

    const handleSaveDomain = async (data) => {
        if (editTarget) {
            const updated = await adminUpdateDomain(editTarget.id, data);
            setDomains(prev => prev.map(d => d.id === updated.id ? updated : d));
            if (activeDomain?.id === updated.id) setActiveDomain(updated);
        } else {
            const created = await adminCreateDomain(data);
            setDomains(prev => [...prev, created]);
        }
        setShowForm(false);
        setEditTarget(null);
    };

    const handleDeleteDomain = async (domain) => {
        if (!confirm(`Delete domain "${domain.name}"? This removes all its documents.`)) return;
        await adminDeleteDomain(domain.id);
        setDomains(prev => prev.filter(d => d.id !== domain.id));
        if (activeDomain?.id === domain.id) setActiveDomain(null);
    };

    const handleUpload = async (file) => {
        if (!activeDomain) return;
        const doc = await adminUploadDocument(activeDomain.id, file);
        setDocuments(prev => [doc, ...prev]);
        setDomains(prev => prev.map(d =>
            d.id === activeDomain.id ? { ...d, documents_count: (d.documents_count ?? 0) + 1 } : d
        ));
    };

    const handleDeleteDoc = async (doc) => {
        if (!confirm(`Delete "${doc.original_name}"?`)) return;
        await adminDeleteDocument(activeDomain.id, doc.id);
        setDocuments(prev => prev.filter(d => d.id !== doc.id));
        setDomains(prev => prev.map(d =>
            d.id === activeDomain.id ? { ...d, documents_count: Math.max(0, (d.documents_count ?? 1) - 1) } : d
        ));
    };

    return (
        <div className="flex-1 flex overflow-hidden min-h-0 rounded-2xl border border-white/10 bg-navy-900/60">
            {/* Domain list */}
            <div className="w-80 flex-shrink-0 border-r border-white/10 flex flex-col overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
                    <span className="text-sm font-semibold text-navy-200">Domains</span>
                    <button
                        onClick={() => { setEditTarget(null); setShowForm(true); setActiveDomain(null); }}
                        className="text-xs px-3 py-1.5 bg-gold-600 hover:bg-gold-500 rounded-lg transition font-medium"
                    >
                        + New Domain
                    </button>
                </div>

                {loading ? (
                    <div className="flex-1 flex items-center justify-center">
                        <p className="text-navy-300 text-sm">Loading…</p>
                    </div>
                ) : domains.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
                        <div className="text-4xl mb-3">🗂️</div>
                        <p className="text-navy-300 text-sm">No domains yet.</p>
                        <p className="text-navy-300 text-xs mt-1">Click "+ New Domain" to create one.</p>
                    </div>
                ) : (
                    <div className="flex-1 overflow-y-auto p-2 space-y-1">
                        {domains.map(domain => (
                            <DomainRow
                                key={domain.id}
                                domain={domain}
                                active={activeDomain?.id === domain.id}
                                onSelect={() => { setActiveDomain(domain); setShowForm(false); }}
                                onEdit={() => { setEditTarget(domain); setShowForm(true); setActiveDomain(null); }}
                                onDelete={() => handleDeleteDomain(domain)}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Detail panel */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {showForm ? (
                    <DomainForm
                        initial={editTarget}
                        onSave={handleSaveDomain}
                        onCancel={() => { setShowForm(false); setEditTarget(null); }}
                    />
                ) : activeDomain ? (
                    <DocumentsPanel
                        domain={activeDomain}
                        documents={documents}
                        onUpload={handleUpload}
                        onDelete={handleDeleteDoc}
                    />
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
                        <div className="text-5xl mb-4">🗂️</div>
                        <p className="text-navy-300 text-sm">Select a domain to manage its documents,<br />or create a new domain.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

function DomainRow({ domain, active, onSelect, onEdit, onDelete }) {
    return (
        <div
            className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition ${
                active ? 'bg-gold-600/20 text-white ring-1 ring-gold-500/40' : 'text-navy-200 hover:bg-white/5 hover:text-white'
            }`}
            onClick={onSelect}
        >
            <DomainIcon size="sm" />
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{domain.name}</p>
                <p className="text-xs text-navy-300">{domain.documents_count ?? 0} docs · {domain.is_active ? 'Active' : 'Hidden'}</p>
            </div>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition flex-shrink-0">
                <button onClick={e => { e.stopPropagation(); onEdit(); }}
                    className="p-1.5 rounded hover:bg-white/10 text-navy-300 hover:text-white">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                </button>
                <button onClick={e => { e.stopPropagation(); onDelete(); }}
                    className="p-1.5 rounded hover:bg-white/10 text-navy-300 hover:text-red-400">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </div>
    );
}

function DomainForm({ initial, onSave, onCancel }) {
    const [name, setName]               = useState(initial?.name ?? '');
    const [description, setDescription] = useState(initial?.description ?? '');
    const [isActive, setIsActive]       = useState(initial?.is_active ?? true);
    const [saving, setSaving]           = useState(false);
    const [error, setError]             = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        try {
            await onSave({ name, description, is_active: isActive });
        } catch (err) {
            const msgs = err.response?.data?.errors
                ? Object.values(err.response.data.errors).flat().join(' ')
                : (err.response?.data?.message ?? err.message);
            setError(msgs);
        } finally {
            setSaving(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 max-w-lg">
            <h2 className="text-lg font-semibold text-white mb-6">
                {initial ? 'Edit Domain' : 'New Domain'}
            </h2>

            <div className="space-y-5">
                <div>
                    <label className="block text-xs text-navy-300 mb-1.5">Name *</label>
                    <input
                        value={name} onChange={e => setName(e.target.value)} required
                        placeholder="e.g. Finance, Healthcare"
                        className="w-full bg-navy-800 border border-white/10 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-navy-300 outline-none focus:border-gold-500"
                    />
                </div>

                <div>
                    <label className="block text-xs text-navy-300 mb-1.5">Description</label>
                    <textarea
                        value={description} onChange={e => setDescription(e.target.value)}
                        rows={4} placeholder="What is this domain about?"
                        className="w-full bg-navy-800 border border-white/10 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-navy-300 outline-none focus:border-gold-500 resize-none"
                    />
                </div>

                <div className="flex items-center gap-2">
                    <input type="checkbox" id="is_active" checked={isActive}
                        onChange={e => setIsActive(e.target.checked)}
                        className="rounded" />
                    <label htmlFor="is_active" className="text-sm text-navy-200">Visible to users</label>
                </div>
            </div>

            {error && (
                <div className="mt-5 px-3 py-2 bg-red-900/40 border border-red-700 rounded-lg text-red-300 text-sm">
                    {error}
                </div>
            )}

            <div className="flex gap-3 mt-7">
                <button type="submit" disabled={saving}
                    className="px-5 py-2.5 bg-gold-600 hover:bg-gold-500 disabled:opacity-50 rounded-lg text-sm font-medium transition">
                    {saving ? 'Saving…' : (initial ? 'Save Changes' : 'Create Domain')}
                </button>
                <button type="button" onClick={onCancel}
                    className="px-5 py-2.5 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-navy-200 transition">
                    Cancel
                </button>
            </div>
        </form>
    );
}

function DocumentsPanel({ domain, documents, onUpload, onDelete }) {
    const [uploading, setUploading] = useState(false);
    const [dragOver, setDragOver]   = useState(false);
    const inputRef = useRef();

    const handleFile = async (file) => {
        if (!file) return;
        setUploading(true);
        try {
            await onUpload(file);
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
        <div className="flex-1 flex flex-col overflow-hidden p-8">
            <div className="flex items-center gap-3 mb-5">
                <DomainIcon size="sm" />
                <h2 className="text-base font-semibold text-white">{domain.name} — Documents</h2>
            </div>

            {/* Drop zone */}
            <div
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition mb-5 ${
                    dragOver ? 'border-gold-500 bg-gold-600/10' : 'border-white/10 hover:border-white/30'
                }`}
            >
                <input ref={inputRef} type="file" className="hidden"
                    accept=".txt,.pdf,.docx,.md"
                    onChange={e => handleFile(e.target.files[0])} />
                {uploading ? (
                    <p className="text-sm text-gold-300">Uploading and extracting text…</p>
                ) : (
                    <>
                        <p className="text-sm text-navy-200">Drop a file here or <span className="text-gold-400">click to browse</span></p>
                        <p className="text-xs text-navy-300 mt-1">Supports: PDF, TXT, DOCX, MD · Max 20MB</p>
                    </>
                )}
            </div>

            {/* Documents list */}
            <div className="flex-1 overflow-y-auto space-y-2">
                {documents.length === 0 ? (
                    <p className="text-sm text-navy-300 text-center py-8">No documents uploaded yet.</p>
                ) : (
                    documents.map(doc => (
                        <div key={doc.id} className="flex items-center gap-3 bg-navy-800 border border-white/10 rounded-lg px-4 py-3">
                            <FileIcon type={doc.file_type} />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm text-white truncate">{doc.original_name}</p>
                                <p className="text-xs text-navy-300">
                                    {formatSize(doc.size_bytes)} ·{' '}
                                    <span className={STATUS_STYLES[doc.status] ?? 'text-navy-300'}>
                                        {doc.status}
                                    </span>
                                </p>
                            </div>
                            <button onClick={() => onDelete(doc)}
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
        </div>
    );
}

function FileIcon({ type }) {
    const icons = { pdf: '📄', txt: '📝', md: '📝', docx: '📃' };
    return <span className="text-xl flex-shrink-0">{icons[type] ?? '📎'}</span>;
}
