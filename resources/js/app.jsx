import React from 'react';
import { createRoot } from 'react-dom/client';
import ChatWidget from './components/ChatWidget';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { error: null };
    }
    static getDerivedStateFromError(error) {
        return { error };
    }
    render() {
        if (this.state.error) {
            return (
                <div style={{ padding: '2rem', color: 'white', fontFamily: 'monospace' }}>
                    <h2 style={{ color: '#f87171', marginBottom: '1rem' }}>React Error</h2>
                    <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.85rem', color: '#fca5a5' }}>
                        {this.state.error.message}
                    </pre>
                    <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.75rem', color: '#6b7280', marginTop: '1rem' }}>
                        {this.state.error.stack}
                    </pre>
                </div>
            );
        }
        return this.props.children;
    }
}

const root = createRoot(document.getElementById('app'));
root.render(
    <ErrorBoundary>
        <ChatWidget />
    </ErrorBoundary>
);
