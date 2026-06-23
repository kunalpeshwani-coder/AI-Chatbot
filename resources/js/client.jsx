import React from 'react';
import { createRoot } from 'react-dom/client';
import ClientDashboard from './components/ClientDashboard';

const root = createRoot(document.getElementById('client-app'));
root.render(<ClientDashboard />);
