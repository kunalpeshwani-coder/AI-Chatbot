import React, { useState } from 'react';

export default function CreateChatbotForm({ onCreate, onCancel }) {
    const [name, setName]               = useState('');
    const [description, setDescription] = useState('');
    const [saving, setSaving]           = useState(false);
    const [error, setError]             = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        try {
            await onCreate({ name, description });
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
        <div className="flex-1 flex items-center justify-center">
            <form onSubmit={handleSubmit} className="w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-gold-400 to-gold-700 flex items-center justify-center shadow-lg shadow-black/40 mb-4">
                        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                  d="M3 7a2 2 0 012-2h4.586a1 1 0 01.707.293l1.414 1.414a1 1 0 00.707.293H19a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
                        </svg>
                    </div>
                    <h1 className="text-xl font-semibold text-white mb-2">Create your chatbot</h1>
                    <p className="text-navy-300 text-sm">
                        Give it a name, then add your knowledge base documents next — you'll get an embed code for your website once it's ready.
                    </p>
                </div>

                <div className="space-y-4 bg-navy-900/60 border border-white/10 rounded-2xl p-6">
                    <div>
                        <label className="block text-xs text-navy-300 mb-1.5">Chatbot Name *</label>
                        <input
                            value={name} onChange={e => setName(e.target.value)} required
                            placeholder="e.g. Acme Support Assistant"
                            className="w-full bg-navy-800 border border-white/10 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-navy-300 outline-none focus:border-gold-500"
                        />
                    </div>

                    <div>
                        <label className="block text-xs text-navy-300 mb-1.5">Description</label>
                        <textarea
                            value={description} onChange={e => setDescription(e.target.value)}
                            rows={3} placeholder="What should this chatbot help with?"
                            className="w-full bg-navy-800 border border-white/10 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-navy-300 outline-none focus:border-gold-500 resize-none"
                        />
                    </div>

                    {error && (
                        <div className="px-3 py-2 bg-red-900/40 border border-red-700 rounded-lg text-red-300 text-sm">
                            {error}
                        </div>
                    )}

                    <button type="submit" disabled={saving}
                        className="w-full py-3 bg-gold-600 hover:bg-gold-500 disabled:opacity-50 rounded-xl text-sm font-semibold transition shadow-md shadow-black/40">
                        {saving ? 'Creating…' : 'Create Chatbot'}
                    </button>

                    {onCancel && (
                        <button type="button" onClick={onCancel}
                            className="w-full py-2 text-sm text-navy-300 hover:text-navy-200 transition">
                            Cancel
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
}
