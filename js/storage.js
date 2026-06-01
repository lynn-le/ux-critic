// js/storage.js
// Manages analysis history in localStorage.

const STORAGE_KEY = 'ux_critic_history';
const MAX_ENTRIES = 50;

const Storage = {
  getAll() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch {
      return [];
    }
  },

  save(entry) {
    // entry: { id, name, size, mode, thumb, data, timestamp }
    const all = this.getAll();
    all.unshift(entry);
    if (all.length > MAX_ENTRIES) all.splice(MAX_ENTRIES);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  },

  delete(id) {
    const filtered = this.getAll().filter(e => e.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  },

  clear() {
    localStorage.removeItem(STORAGE_KEY);
  },

  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }
};
