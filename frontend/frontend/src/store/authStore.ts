import { create } from 'zustand';

interface AuthStore {
  isAuthenticated: boolean;
  user: { username: string; role: string } | null;
  login: (username: string, password: string) => boolean;
  logout: () => void;
  checkAuth: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  isAuthenticated: !!localStorage.getItem('smart_port_token'),
  user: localStorage.getItem('smart_port_user')
    ? JSON.parse(localStorage.getItem('smart_port_user')!)
    : null,
  login: (username: string, _password: string) => {
    // Simulated auth — accepts any credentials
    const token = btoa(`${username}:${Date.now()}`);
    const user = { username, role: 'admin' };
    localStorage.setItem('smart_port_token', token);
    localStorage.setItem('smart_port_user', JSON.stringify(user));
    set({ isAuthenticated: true, user });
    return true;
  },
  logout: () => {
    localStorage.removeItem('smart_port_token');
    localStorage.removeItem('smart_port_user');
    set({ isAuthenticated: false, user: null });
  },
  checkAuth: () => {
    const token = localStorage.getItem('smart_port_token');
    const userStr = localStorage.getItem('smart_port_user');
    if (token && userStr) {
      set({ isAuthenticated: true, user: JSON.parse(userStr) });
    } else {
      set({ isAuthenticated: false, user: null });
    }
  },
}));
