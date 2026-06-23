import React from 'react';
import DomainIcon from './DomainIcon';

export default function DomainPicker({ domains, loading, onSelect }) {
    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <svg className="animate-spin w-8 h-8 text-gold-400" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col items-center px-6 py-10 overflow-y-auto">
            <h2 className="text-2xl font-bold text-white mb-2">Choose a Domain</h2>
            <p className="text-navy-300 text-sm mb-8 text-center max-w-sm">
                Select the topic area you'd like to chat about. Each domain has specialized knowledge loaded by your administrator.
            </p>

            {domains.length === 0 ? (
                <div className="text-center text-navy-300">
                    <div className="text-4xl mb-3">📭</div>
                    <p className="text-sm">No domains available yet.</p>
                    <p className="text-xs mt-1">Ask an administrator to create domains.</p>
                </div>
            ) : (
                <div className="flex flex-col gap-3 w-full max-w-md">
                    {domains.map(domain => (
                        <DomainCard key={domain.id} domain={domain} onSelect={onSelect} />
                    ))}
                </div>
            )}
        </div>
    );
}

function DomainCard({ domain, onSelect }) {
    return (
        <button
            onClick={() => onSelect(domain)}
            className="group flex items-center gap-4 text-left bg-navy-800/80 border border-white/10 rounded-2xl px-5 py-4 hover:border-gold-500 hover:bg-navy-800 hover:shadow-lg hover:shadow-gold-500/10 hover:-translate-y-0.5 transition-all duration-200"
        >
            <DomainIcon className="group-hover:scale-105 transition-transform duration-200" />

            <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-white text-base mb-0.5 truncate">{domain.name}</h3>
                {domain.description ? (
                    <p className="text-navy-300 text-xs line-clamp-1">{domain.description}</p>
                ) : (
                    <p className="text-navy-300 text-xs">
                        {domain.documents_count ?? 0} document{domain.documents_count !== 1 ? 's' : ''}
                    </p>
                )}
            </div>

            <svg
                className="w-5 h-5 text-navy-300 group-hover:text-gold-400 flex-shrink-0 transform group-hover:translate-x-0.5 transition-all duration-200"
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
        </button>
    );
}
