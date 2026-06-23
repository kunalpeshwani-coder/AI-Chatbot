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

// Admin — Domains
export const adminGetDomains = () =>
    api.get('/admin/domains').then(r => r.data);

export const adminCreateDomain = (data) =>
    api.post('/admin/domains', data).then(r => r.data);

export const adminUpdateDomain = (id, data) =>
    api.put(`/admin/domains/${id}`, data).then(r => r.data);

export const adminDeleteDomain = (id) =>
    api.delete(`/admin/domains/${id}`).then(r => r.data);

// Admin — Documents
export const adminGetDocuments = (domainId) =>
    api.get(`/admin/domains/${domainId}/documents`).then(r => r.data);

export const adminUploadDocument = (domainId, file) => {
    const form = new FormData();
    form.append('file', file);
    return api.post(`/admin/domains/${domainId}/documents`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data);
};

export const adminDeleteDocument = (domainId, docId) =>
    api.delete(`/admin/domains/${domainId}/documents/${docId}`).then(r => r.data);

// Admin — Clients
export const adminGetClients = () =>
    api.get('/admin/clients').then(r => r.data);

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
