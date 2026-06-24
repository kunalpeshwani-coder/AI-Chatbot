import axios from 'axios';

const api = axios.create({
    baseURL: '/api',
    headers: {
        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content,
        'Accept': 'application/json',
    },
    withCredentials: true,
});

// Domains (all users)
export const getDomains = () =>
    api.get('/domains').then(r => r.data);

// Conversations
export const getConversations = (domainId = null) =>
    api.get('/conversations', { params: domainId ? { domain_id: domainId } : {} }).then(r => r.data);

export const createConversation = (domainId = null) =>
    api.post('/conversations', { domain_id: domainId }).then(r => r.data);

export const deleteConversation = (id) =>
    api.delete(`/conversations/${id}`).then(r => r.data);

export const getMessages = (convId) =>
    api.get(`/conversations/${convId}/messages`).then(r => r.data);

export const sendMessage = (convId, content) =>
    api.post(`/conversations/${convId}/messages`, { content }).then(r => r.data);

// Admin — Clients
export const adminGetClients = () =>
    api.get('/admin/clients').then(r => r.data);

export const adminGetClient = (clientId) =>
    api.get(`/admin/clients/${clientId}`).then(r => r.data);

export const adminUpdateClientPackage = (clientId, pkg) =>
    api.put(`/admin/clients/${clientId}/package`, { package: pkg }).then(r => r.data);

// Client — own chatbots (a client can create multiple)
export const getMyChatbots = () =>
    api.get('/my-chatbots').then(r => r.data);

export const createMyChatbot = (data) =>
    api.post('/my-chatbots', data).then(r => r.data);

export const updateMyChatbot = (id, data) =>
    api.put(`/my-chatbots/${id}`, data).then(r => r.data);

export const deleteMyChatbot = (id) =>
    api.delete(`/my-chatbots/${id}`).then(r => r.data);

export const testChatbotMessage = (chatbotId, messages) =>
    api.post(`/my-chatbots/${chatbotId}/test-message`, { messages }).then(r => r.data);

export const getChatbotDocuments = (chatbotId) =>
    api.get(`/my-chatbots/${chatbotId}/documents`).then(r => r.data);

export const uploadChatbotDocument = (chatbotId, file) => {
    const form = new FormData();
    form.append('file', file);
    return api.post(`/my-chatbots/${chatbotId}/documents`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data);
};

export const addChatbotUrl = (chatbotId, url) =>
    api.post(`/my-chatbots/${chatbotId}/documents/url`, { url }).then(r => r.data);

export const deleteChatbotDocument = (chatbotId, docId) =>
    api.delete(`/my-chatbots/${chatbotId}/documents/${docId}`).then(r => r.data);

// Client — connect a database as a knowledge source
export const getDatabaseConnections = (chatbotId) =>
    api.get(`/my-chatbots/${chatbotId}/database-connections`).then(r => r.data);

export const testDatabaseConnection = (chatbotId, credentials) =>
    api.post(`/my-chatbots/${chatbotId}/database-connections/test`, credentials).then(r => r.data);

export const createDatabaseConnection = (chatbotId, data) =>
    api.post(`/my-chatbots/${chatbotId}/database-connections`, data).then(r => r.data);

export const syncDatabaseConnection = (chatbotId, connectionId) =>
    api.post(`/my-chatbots/${chatbotId}/database-connections/${connectionId}/sync`).then(r => r.data);

export const deleteDatabaseConnection = (chatbotId, connectionId) =>
    api.delete(`/my-chatbots/${chatbotId}/database-connections/${connectionId}`).then(r => r.data);

export const getAvailableTables = (chatbotId, connectionId) =>
    api.get(`/my-chatbots/${chatbotId}/database-connections/${connectionId}/tables`).then(r => r.data);

export const addDatabaseTables = (chatbotId, connectionId, tables) =>
    api.post(`/my-chatbots/${chatbotId}/database-connections/${connectionId}/tables`, { tables }).then(r => r.data);
