import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3001/api',
});

export const getTransactions = () => api.get('/transactions');
export const analyzeTransaction = (id: string) => api.post(`/transactions/${id}/analyze`);
export const getAccountDetails = (id: string) => api.get(`/accounts/${id}`);