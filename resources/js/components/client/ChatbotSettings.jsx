import React, { useState, useEffect } from 'react';
import { updateMyChatbot } from '../../api';

const SCOPE_TEXT = {
    true:  "Prefer the documents above when they cover the question. If a question goes beyond what the documents cover, answer it using your own general knowledge instead of refusing — just don't contradict the documents.",
    false: "Only answer using the documents above. If the answer isn't in the documents, say you don't have that information — do not use outside knowledge or make anything up.",
};

export default function ChatbotSettings({ chatbot, onUpdate }) {
    const [instructions, setInstructions] = useState(chatbot.instructions ?? SCOPE_TEXT[chatbot.allow_general_knowledge ?? true]);
    const [saving, setSaving]     = useState(false);
    const [saved, setSaved]       = useState(false);
    const [savedText, setSavedText] = useState(chatbot.instructions ?? SCOPE_TEXT[chatbot.allow_general_knowledge ?? true]);

    // When the Knowledge Base toggle changes, auto-update the instruction text
    // to the matching default so both tabs stay in sync.
    useEffect(() => {
        const defaultForScope = SCOPE_TEXT[chatbot.allow_general_knowledge ?? true];
        // Only auto-update if the current text is one of the two defaults (user hasn't written
        // something custom that doesn't match either default).
        if (instructions === SCOPE_TEXT[true] || instructions === SCOPE_TEXT[false]) {
            setInstructions(defaultForScope);
            setSavedText(defaultForScope);
            setSaved(false);
        }
    }, [chatbot.allow_general_knowledge]);

    const dirty = instructions !== savedText;

    const handleSave = async () => {
        setSaving(true);
        setSaved(false);
        try {
            const updated = await updateMyChatbot(chatbot.id, { instructions });
            onUpdate?.(updated);
            setSavedText(instructions);
            setSaved(true);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="flex-1 overflow-y-auto pr-4">
            <div>
                <h2 className="text-sm font-semibold text-white mb-1">Custom Instructions</h2>
                <p className="text-xs text-navy-300 mb-4">
                    Tell your chatbot how to behave — tone, rules, things to always mention or avoid.
                    These instructions are added to every conversation alongside your knowledge base.
                    The text below reflects your current Knowledge Base scope setting — you can edit it freely.
                </p>
                <p className="text-xs text-amber-300/90 mb-4 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
                    A built-in safety rule (never request payment details, passwords, or IDs) always
                    applies and can't be turned off here.
                </p>

                <textarea
                    value={instructions}
                    onChange={e => { setInstructions(e.target.value); setSaved(false); }}
                    maxLength={2000}
                    rows={10}
                    placeholder="e.g. Always greet the customer by name if known. Speak in a friendly, casual tone. Never discuss pricing — direct those questions to sales@company.com."
                    className="w-full bg-navy-800 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-navy-400 outline-none focus:border-gold-500/50 resize-y"
                />

                <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-navy-400">{instructions.length}/2000</span>
                    <div className="flex items-center gap-3">
                        {saved && !dirty && (
                            <span className="text-xs text-emerald-300">Saved</span>
                        )}
                        <button
                            onClick={handleSave}
                            disabled={!dirty || saving}
                            className="text-sm font-medium px-4 py-2 rounded-lg bg-gold-600 text-white hover:bg-gold-500 transition disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            {saving ? 'Saving…' : 'Save Instructions'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
