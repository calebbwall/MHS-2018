import { createContext, useContext, useEffect, useState } from 'react';
import { apiFetch } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [token, setToken]     = useState(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  // On mount, rehydrate session from stored token
  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    apiFetch('/api/auth/me', { token })
      .then(data => {
        setUser(data);
      })
      .catch(() => {
        // Token invalid — clear it
        localStorage.removeItem('token');
        setToken(null);
      })
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function login(newToken, newUser) {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(newUser);
  }

  function logout() {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  }

  // Refresh user data (e.g. after editing profile)
  async function refreshUser() {
    if (!token) return;
    try {
      const data = await apiFetch('/api/auth/me', { token });
      setUser(data);
    } catch (err) {
      console.error('Failed to refresh user', err);
    }
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
