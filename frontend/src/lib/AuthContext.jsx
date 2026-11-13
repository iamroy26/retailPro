import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { retailApi } from '@/api/retailApi';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);

  const checkUserAuth = useCallback(async () => {
    setIsLoadingAuth(true);
    try {
      setUser(await retailApi.auth.me());
    } catch {
      setUser(null);
    } finally {
      setIsLoadingAuth(false);
      setAuthChecked(true);
    }
  }, []);

  useEffect(() => { checkUserAuth(); }, [checkUserAuth]);

  const login = useCallback(async (email, password) => {
    setUser(await retailApi.auth.loginViaEmailPassword(email, password));
    setAuthChecked(true);
  }, []);

  const register = useCallback(async (details) => {
    setUser(await retailApi.auth.register(details));
    setAuthChecked(true);
  }, []);

  const logout = useCallback(async () => {
    await retailApi.auth.logout();
    setUser(null);
    setAuthChecked(true);
  }, []);

  const value = { user, isAuthenticated: Boolean(user), isLoadingAuth, authChecked, authError: null, checkUserAuth, login, register, logout };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
