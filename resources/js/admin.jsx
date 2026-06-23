import React from 'react';
import { createRoot } from 'react-dom/client';
import AdminDashboard from './components/AdminDashboard';

const root = createRoot(document.getElementById('admin-app'));
root.render(<AdminDashboard />);
