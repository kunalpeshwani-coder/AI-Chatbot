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
        <div className="flex-1 flex flex-col items-center justify-center px-4">

            {/* Logo */}
            <div className="flex flex-col items-center gap-2 mb-8">
                <img src="/journai-logo-horizontal.png" alt="JournAI" className="h-9 w-auto" />
                <span className="text-xs uppercase tracking-widest text-navy-300">AI Chatbot Platform</span>
            </div>

            {/* Cream card */}
            <div className="w-full max-w-md px-8 py-8 rounded-2xl shadow-xl shadow-black/30 text-navy-900"
                 style={{ background: 'linear-gradient(135deg, #f3e9d2 0%, #ecdfc0 45%, #e3d2a8 100%)' }}>

                <div className="mb-6 text-center">
                    <h1 className="text-xl font-semibold text-navy-900">Create your chatbot</h1>
                    <p className="text-sm text-navy-500 mt-1">
                        Give it a name and description to get started.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">

                    <div>
                        <label className="block text-sm font-medium text-navy-700 mb-1">
                            Chatbot Name <span className="text-gold-600">*</span>
                        </label>
                        <input
                            value={name}
                            onChange={e => setName(e.target.value)}
                            required
                            placeholder="e.g. Acme Support Assistant"
                            className="w-full bg-white border border-navy-200 text-navy-900 placeholder-navy-400 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 transition"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-navy-700 mb-1">
                            Description <span className="text-navy-400 font-normal text-xs">(optional)</span>
                        </label>
                        <textarea
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            rows={3}
                            placeholder="What should this chatbot help with?"
                            className="w-full bg-white border border-navy-200 text-navy-900 placeholder-navy-400 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 transition resize-none"
                        />
                    </div>

                    {error && (
                        <div className="px-3 py-2 bg-red-100 border border-red-300 rounded-lg text-red-700 text-sm">
                            {error}
                        </div>
                    )}

                    <div className="flex flex-col gap-3 mt-2">
                        <button
                            type="submit"
                            disabled={saving}
                            className="w-full inline-flex items-center justify-center px-5 py-2.5 bg-gold-600 border border-transparent rounded-xl font-semibold text-sm text-white hover:bg-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500 focus:ring-offset-2 transition ease-in-out duration-150 disabled:opacity-50"
                        >
                            {saving ? 'Creating…' : 'Create Chatbot'}
                        </button>

                        {onCancel && (
                            <button
                                type="button"
                                onClick={onCancel}
                                className="w-full inline-flex items-center justify-center gap-1.5 px-5 py-2.5 bg-white rounded-xl font-semibold text-sm text-navy-700 hover:bg-navy-700/5 focus:outline-none focus:ring-2 focus:ring-gold-500 focus:ring-offset-2 transition ease-in-out duration-150"
                            >
                                Cancel
                            </button>
                        )}
                    </div>

                </form>
            </div>

            <p className="text-xs text-navy-400 mt-8">&copy; {new Date().getFullYear()} JournAI — All rights reserved.</p>
        </div>
    );
}
