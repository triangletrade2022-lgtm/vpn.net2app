import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, ClientRegistration } from '../types';

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  activeTenantId: string | null;
  setActiveTenantId: (id: string | null) => void;
  login: (username: string, password: string) => Promise<'admin' | 'client' | false>;
  googleLogin: (credential: string) => Promise<'admin' | 'client' | false>;
  register: (data: ClientRegistration) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isLoading: boolean;
  isSuperAdmin: boolean;
  isClient: boolean;
  registeredClients: User[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = 'vpnnet_registered_clients';
const SESSION_KEY = 'vpnnet_session';

interface StoredClient extends User { _password: string }

function loadClients(): StoredClient[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch { return []; }
}
function saveClients(clients: StoredClient[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(clients));
}
function genId() { return 'usr_' + Math.random().toString(36).substr(2, 9); }

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [activeTenantId, setActiveTenantId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [clients, setClients] = useState<StoredClient[]>(loadClients);

  useEffect(() => { saveClients(clients); }, [clients]);

  // Restore session
  useEffect(() => {
    try {
      const s = localStorage.getItem(SESSION_KEY);
      if (s) {
        const d = JSON.parse(s);
        if (d.user && d.token) {
          setUser(d.user);
          setToken(d.token);
          if (d.tid) setActiveTenantId(d.tid);
        }
      }
    } catch {}
    setIsLoading(false);
  }, []);

  const saveSession = (u: User, t: string, tid?: string | null) =>
    localStorage.setItem(SESSION_KEY, JSON.stringify({ user: u, token: t, tid }));
  const clearSession = () => {
    ['vpnnet_session', 'iptsp_token', 'iptsp_user', 'iptsp_active_tenant'].forEach(k => localStorage.removeItem(k));
  };

  // Decode Google JWT client-side to get user info
  const decodeGoogleJWT = (token: string): { email: string; name: string; sub: string; picture?: string } | null => {
    try {
      const payload = token.split('.')[1];
      const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
      return { email: decoded.email, name: decoded.name, sub: decoded.sub, picture: decoded.picture };
    } catch { return null; }
  };

  const googleLogin = async (credential: string): Promise<'admin' | 'client' | false> => {
    return new Promise(resolve => {
      setTimeout(() => {
        const info = decodeGoogleJWT(credential);
        if (!info) { resolve(false); return; }

        // Check if Google user exists in registered clients
        const existing = clients.find(c => c.googleId === info.sub || c.email.toLowerCase() === info.email.toLowerCase());
        if (existing) {
          const u: User = {
            id: existing.id, username: existing.username, email: existing.email,
            role: 'client', balance: existing.balance, googleId: existing.googleId,
            avatar: info.picture, createdAt: existing.createdAt,
          };
          const t = btoa(JSON.stringify(u));
          setUser(u); setToken(t); saveSession(u, t);
          resolve('client');
        } else {
          // Auto-register if Google user not found
          const newClient: StoredClient = {
            id: genId(), username: info.email, email: info.email,
            role: 'client', _password: '', googleId: info.sub,
            balance: 10, createdAt: new Date().toISOString(),
          };
          setClients(prev => [...prev, newClient]);
          const u: User = {
            id: newClient.id, username: newClient.username, email: newClient.email,
            role: 'client', balance: 10, googleId: newClient.googleId,
            avatar: info.picture, createdAt: newClient.createdAt,
          };
          const t = btoa(JSON.stringify(u));
          setUser(u); setToken(t); saveSession(u, t);
          resolve('client');
        }
      }, 500);
    });
  };

  const login = async (username: string, password: string): Promise<'admin' | 'client' | false> => {
    return new Promise(resolve => {
      setTimeout(() => {
        // Pre-defined admin
        const uname = username.toLowerCase();
        if ((uname === 'superadmin' || uname === 'admin') && password === 'admin123') {
          const u: User = { id: 'super-1', username: 'superadmin', email: 'admin@iptsp.local', role: 'super_admin', createdAt: '2024-01-01T00:00:00Z' };
          const t = btoa(JSON.stringify(u));
          setUser(u); setToken(t); saveSession(u, t);
          resolve('admin');
          return;
        }

        // Registered clients
        const client = clients.find(c => c.email.toLowerCase() === username.toLowerCase() || c.username.toLowerCase() === username.toLowerCase());
        if (client && client._password === password) {
          const u: User = { id: client.id, username: client.username, email: client.email, role: 'client', balance: client.balance, createdAt: client.createdAt };
          const t = btoa(JSON.stringify(u));
          setUser(u); setToken(t); saveSession(u, t);
          resolve('client');
          return;
        }

        resolve(false);
      }, 300);
    });
  };

  const register = async (data: ClientRegistration): Promise<{ success: boolean; error?: string }> => {
    return new Promise(resolve => {
      setTimeout(() => {
        if (clients.find(c => c.email.toLowerCase() === data.email.toLowerCase())) {
          resolve({ success: false, error: 'An account with this email already exists' });
          return;
        }
        const newClient: StoredClient = {
          id: genId(), username: data.email, email: data.email,
          role: 'client', _password: data.password,
          balance: 10, createdAt: new Date().toISOString(),
        };
        setClients(prev => [...prev, newClient]);
        resolve({ success: true });
      }, 500);
    });
  };

  const logout = () => { clearSession(); setUser(null); setToken(null); setActiveTenantId(null); };

  return (
    <AuthContext.Provider value={{
      isAuthenticated: !!user, user, token, activeTenantId, setActiveTenantId,
      login, googleLogin, register, logout, isLoading,
      isSuperAdmin: user?.role === 'super_admin',
      isClient: user?.role === 'client',
      registeredClients: clients,
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
