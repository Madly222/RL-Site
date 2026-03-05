const API_BASE = import.meta.env.VITE_API_URL || '/api';

function getAuthHeaders() {
  const token = sessionStorage.getItem('adminToken');
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = 'Bearer ' + token;
  }
  return headers;
}

// Universal helper for authenticated fetch — use in all components
export function authFetch(url, options = {}) {
  const token = sessionStorage.getItem('adminToken');
  if (token) {
    options.headers = {
      ...(options.headers || {}),
      'Authorization': 'Bearer ' + token
    };
  }
  return fetch(url, options);
}

async function request(endpoint) {
  const res = await fetch(`${API_BASE}${endpoint}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

async function authPost(endpoint, data) {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  });
  if (res.status === 401) throw new Error('Unauthorized');
  return res.json();
}

async function authPut(endpoint, data) {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  });
  if (res.status === 401) throw new Error('Unauthorized');
  return res.json();
}

async function authDel(endpoint) {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  if (res.status === 401) throw new Error('Unauthorized');
  return res.json();
}

async function publicPost(endpoint, data) {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
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
  sendContact: (data) => publicPost('/contact', data),
  updatePlan: (id, data) => authPut(`/plans/${id}`, data),
  deletePlan: (id) => authDel(`/plans/${id}`),
  addPlan: (data) => authPost('/plans/new', data)
};