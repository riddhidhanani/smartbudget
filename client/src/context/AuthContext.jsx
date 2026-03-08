import { createContext, useContext, useState, useEffect } from 'react';
import { login as apiLogin, register as apiRegister, logout as apiLogout } from '../lib/api';
import axios from 'axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Try to restore session by hitting a protected endpoint
    axios.get('/api/transactions', { withCredentials: true })
      .then(() => {
        const stored = localStorage.getItem('sb_user');
        if (stored) setUser(JSON.parse(stored));
      })
      .catch(() => {
        localStorage.removeItem('sb_user');
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const res = await apiLogin({ email, password });
    setUser(res.data.user);
    localStorage.setItem('sb_user', JSON.stringify(res.data.user));
    return res.data.user;
  };

  const register = async (email, password, name) => {
    const res = await apiRegister({ email, password, name });
    setUser(res.data.user);
    localStorage.setItem('sb_user', JSON.stringify(res.data.user));
    return res.data.user;
  };

  const logout = async () => {
    await apiLogout();
    setUser(null);
    localStorage.removeItem('sb_user');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
