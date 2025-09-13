import React, { createContext, PropsWithChildren, useEffect, useState } from 'react';
import * as authService from '../services/auth.service';
import { getAccessToken, getRefreshToken } from '../utils/storage';
import { jwtDecode } from 'jwt-decode';

type JWTPayload = {
  exp?: number;
  [key: string]: unknown;
};

export type AuthContextType = {
  isAuthenticated: boolean;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // bootstrap: if access token exists and is valid -> authenticated
    // if access token expired but refresh token exists -> try refresh
    (async () => {
      const access = getAccessToken();
      const refresh = getRefreshToken();
      if (!access) {
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }

      try {
        const payload = jwtDecode<JWTPayload>(access);
        const exp = payload?.exp ? payload.exp * 1000 : null;
        const now = Date.now();
        if (exp && exp > now) {
          setIsAuthenticated(true);
          setLoading(false);
          return;
        }

        // access expired
        if (refresh) {
          try {
            await authService.refresh();
            setIsAuthenticated(true);
            setLoading(false);
            return;
          } catch {
            // refresh failed -> logged out
            setIsAuthenticated(false);
            setLoading(false);
            return;
          }
        }

        setIsAuthenticated(false);
      } catch {
        // token malformed -> logout state
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = async (username: string, password: string) => {
    await authService.login(username, password);
    setIsAuthenticated(true);
  };

  const logout = () => {
    authService.logout();
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
