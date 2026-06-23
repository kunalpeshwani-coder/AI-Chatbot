import React from 'react';

const SIZES = {
    sm: { box: 'w-8 h-8 rounded-lg', icon: 'w-4 h-4' },
    md: { box: 'w-12 h-12 rounded-xl', icon: 'w-6 h-6' },
};

export default function DomainIcon({ size = 'md', className = '' }) {
    const s = SIZES[size] ?? SIZES.md;

    return (
        <div className={`${s.box} bg-gradient-to-br from-gold-400 to-gold-700 flex items-center justify-center flex-shrink-0 shadow-md shadow-black/40 ring-1 ring-white/10 ${className}`}>
            <svg className={`${s.icon} text-white`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M3 7a2 2 0 012-2h4.586a1 1 0 01.707.293l1.414 1.414a1 1 0 00.707.293H19a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
            </svg>
        </div>
    );
}
