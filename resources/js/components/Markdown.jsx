import React, { useMemo } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

marked.setOptions({ breaks: true, gfm: true });

export default function Markdown({ content, className = '' }) {
    const html = useMemo(() => {
        const raw = marked.parse(content ?? '');
        return DOMPurify.sanitize(raw);
    }, [content]);

    return (
        <div
            className={`markdown-body text-sm leading-relaxed break-words ${className}`}
            dangerouslySetInnerHTML={{ __html: html }}
        />
    );
}
