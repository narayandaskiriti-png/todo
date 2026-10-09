const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/todos';

async function request(path = '', options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
  });

  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const body = await response.json();
      message = body.detail || body.message || body.title || message;
    } catch {
      try { message = (await response.text()) || message; } catch {}
    }
    throw new Error(message);
  }
  if (response.status === 204) return null;
  return response.json();
}

export const todoApi = {
  getAll: () => request(),
  getOne: (id) => request(`/${id}`),
  create: (todo) => request('', { method: 'POST', body: JSON.stringify(todo) }),
  update: (id, todo) => request(`/${id}`, { method: 'PUT', body: JSON.stringify(todo) }),
  toggle: (id) => request(`/${id}/toggle`, { method: 'PATCH' }),
  remove: (id) => request(`/${id}`, { method: 'DELETE' }),
};
