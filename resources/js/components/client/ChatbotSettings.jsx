import React, { useState } from 'react';
import { updateMyChatbot } from '../../api';

const SCOPE_TEXT = {
    true:  "Prefer the documents above when they cover the question. If a question goes beyond what the documents cover, answer it using your own general knowledge instead of refusing — just don't contradict the documents.",
    false: "Only answer using the documents above. If the answer isn't in the documents, say you don't have that information — do not use outside knowledge or make anything up.",
};

export default function ChatbotSettings({ chatbot, onUpdate }) {
    const [allowGeneral, setAllowGeneral] = useState(chatbot.allow_general_knowledge ?? true);
    const [instructions, setInstructions] = useState(chatbot.instructions ?? SCOPE_TEXT[chatbot.allow_general_knowledge ?? true]);
    const [saving, setSaving]   = useState(false);
    const [saved, setSaved]     = useState(false);
    const [savedText, setSavedText] = useState(chatbot.instructions ?? SCOPE_TEXT[chatbot.allow_general_knowledge ?? true]);
    const [savedScope, setSavedScope] = useState(chatbot.allow_general_knowledge ?? true);

    const dirty = instructions !== savedText || allowGeneral !== savedScope;

    // When the toggle flips, replace the instruction text with the matching default
    // so the user immediately sees what will be sent to the AI.
    const handleToggle = () => {
        const next = !allowGeneral;
        setAllowGeneral(next);
        setInstructions(SCOPE_TEXT[next]);
        setSaved(false);
    };

    const handleSave = async () => {
        setSaving(true);
        setSaved(false);
        try {
            const updated = await updateMyChatbot(chatbot.id, {
                instructions,
                allow_general_knowledge: allowGeneral,
            });
            onUpdate?.(updated);
            setSavedText(instructions);
            setSavedScope(allowGeneral);
            setSaved(true);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="flex-1 overflow-y-auto pr-4">
            <div className="max-w-2xl">
                <h2 className="text-sm font-semibold text-white mb-1">Custom Instructions</h2>
                <p className="text-xs text-navy-300 mb-4">
                    Tell your chatbot how to behave — tone, rules, things to always mention or avoid.
                    These instructions are added to every conversation alongside your knowledge base.
                </p>
                <p className="text-xs text-amber-300/90 mb-4 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
                    A built-in safety rule (never request payment details, passwords, or IDs) always
                    applies and can't be turned off here.
                </p>

                {/* Knowledge scope toggle */}
                <button
                    type="button"
                    onClick={handleToggle}
                    className="w-full flex items-center gap-3 px-4 py-3 bg-navy-900 border border-white/10 rounded-xl hover:border-white/20 transition text-left mb-4"
                >
                    <span
                        className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors ${
                            allowGeneral ? 'bg-gold-600' : 'bg-navy-700'
                        }`}
                    >
                        <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                allowGeneral ? 'translate-x-6' : 'translate-x-1'
                            }`}
                        />
                    </span>
                    <div className="flex-1">
                        <p className="text-sm font-medium text-white">
                            {allowGeneral ? 'Use outside knowledge when needed' : 'Knowledge base only'}
                        </p>
                        <p className="text-xs text-navy-300 mt-0.5">
                            {allowGeneral
                                ? 'Chatbot can go beyond documents to answer general questions'
                                : 'Chatbot only answers from uploaded documents'}
                        </p>
                    </div>
                </button>

                <textarea
                    value={instructions}
                    onChange={e => { setInstructions(e.target.value); setSaved(false); }}
                    maxLength={2000}
                    rows={10}
                    placeholder="e.g. Always greet the customer by name if known. Speak in a friendly, casual tone. Never discuss pricing — direct those questions to sales@company.com."
                    className="w-full bg-navy-800/60 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-navy-400 outline-none focus:border-gold-500/50 resize-y"
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
