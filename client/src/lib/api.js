import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
});

// Auth
export const login = (data) => api.post('/auth/login', data);
export const register = (data) => api.post('/auth/register', data);
export const logout = () => api.post('/auth/logout');

// Transactions
export const getTransactions = (params) => api.get('/transactions', { params });
export const createTransaction = (data) => api.post('/transactions', data);
export const updateTransaction = (id, data) => api.put(`/transactions/${id}`, data);
export const deleteTransaction = (id) => api.delete(`/transactions/${id}`);

// Subscriptions
export const getSubscriptions = () => api.get('/subscriptions');
export const getSubscriptionAlerts = () => api.get('/subscriptions/alerts');
export const getSubscriptionMonthlyCost = (month, year) => api.get('/subscriptions/monthly-cost', { params: { month, year } });
export const createSubscription = (data) => api.post('/subscriptions', data);
export const updateSubscription = (id, data) => api.put(`/subscriptions/${id}`, data);
export const cancelSubscription = (id) => api.put(`/subscriptions/${id}/cancel`);
export const deleteSubscription = (id) => api.delete(`/subscriptions/${id}`);

// AI Summary
export const generateSummary = (data) => api.post('/summary', data);

export default api;
