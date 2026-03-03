const API_BASE = import.meta.env.VITE_API_URL || '/api';

async function request(endpoint) {
  const res = await fetch(`${API_BASE}${endpoint}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

async function post(endpoint, data) {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return res.json();
}

async function put(endpoint, data) {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return res.json();
}

async function del(endpoint) {
  const res = await fetch(`${API_BASE}${endpoint}`, { method: 'DELETE' });
  return res.json();
}

export const api = {
  getCompany: () => request('/company'),
  getServices: () => request('/services'),
  getPlans: (category, type) => {
    const params = new URLSearchParams();
    if (category) params.set('category', category);
    if (type) params.set('type', type);
    return request(`/plans?${params.toString()}`);
  },
  sendContact: (data) => post('/contact', data),
  updatePlan: (id, data) => put(`/plans/${id}`, data),
  deletePlan: (id) => del(`/plans/${id}`),
  addPlan: (data) => post('/plans/new', data)
};
