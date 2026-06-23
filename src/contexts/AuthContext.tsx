import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  activeTenantId: string | null;
  setActiveTenantId: (id: string | null) => void;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  isSuperAdmin: boolean;
  isTenantAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Pre-defined users
const USERS: Record<string, { password: string; user: User }> = {
  superadmin: {
    password: 'admin123',
    user: { id: 'super-1', username: 'superadmin', role: 'super_admin', createdAt: '2024-01-01T00:00:00Z' },
  },
  tenant1: {
    password: 'tenant123',
    user: { id: 'tenant-1', username: 'tenant1', role: 'tenant_admin', tenantId: 't1', createdAt: '2024-01-01T00:00:00Z' },
  },
  tenant2: {
    password: 'tenant123',
    user: { id: 'tenant-2', username: 'tenant2', role: 'tenant_admin', tenantId: 't2', createdAt: '2024-01-02T00:00:00Z' },
  },
  tenant3: {
    password: 'tenant123',
    user: { id: 'tenant-3', username: 'tenant3', role: 'tenant_admin', tenantId: 't3', createdAt: '2024-01-03T00:00:00Z' },
  },
  admin: {
    password: 'admin123',
    user: { id: 'super-1', username: 'superadmin', role: 'super_admin', createdAt: '2024-01-01T00:00:00Z' },
  },
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [activeTenantId, setActiveTenantId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const t = localStorage.getItem('iptsp_token');
    const u = localStorage.getItem('iptsp_user');
    const tid = localStorage.getItem('iptsp_active_tenant');
    if (t && u) {
      try { setUser(JSON.parse(u)); setToken(t); if (tid) setActiveTenantId(tid); } catch {}
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    return new Promise(resolve => {
      setTimeout(() => {
        const entry = USERS[username.toLowerCase()];
        if (entry && entry.password === password) {
          const u = entry.user;
          setUser(u); setToken(btoa(JSON.stringify(u)));
          localStorage.setItem('iptsp_token', btoa(JSON.stringify(u)));
          localStorage.setItem('iptsp_user', JSON.stringify(u));
          if (u.role === 'super_admin') {
            setActiveTenantId(null);
            localStorage.removeItem('iptsp_active_tenant');
          } else if (u.tenantId) {
            setActiveTenantId(u.tenantId);
            localStorage.setItem('iptsp_active_tenant', u.tenantId);
          }
          resolve(true);
        } else resolve(false);
      }, 500);
    });
  };

  const logout = () => {
    localStorage.removeItem('iptsp_token');
    localStorage.removeItem('iptsp_user');
    localStorage.removeItem('iptsp_active_tenant');
    setUser(null); setToken(null); setActiveTenantId(null);
  };

  return (
    <AuthContext.Provider value={{
      isAuthenticated: !!user, user, token, activeTenantId, setActiveTenantId,
      login, logout, isLoading,
      isSuperAdmin: user?.role === 'super_admin',
      isTenantAdmin: user?.role === 'tenant_admin',
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const c = useContext(AuthContext);
  if (!c) throw new Error('useAuth within AuthProvider');
  return c;
}
