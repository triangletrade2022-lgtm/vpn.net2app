import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { LayoutDashboard, Phone, Server, Shield, Activity, Settings, Menu, X, LogOut, User, Building2, PhoneCall, DollarSign, Radio, Globe } from 'lucide-react';

const superNav = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/tenants', label: 'Tenants', icon: Building2 },
  { path: '/ips', label: '🌐 IP Pool', icon: Server },
  { path: '/bangladesh', label: '🇧🇩 BD SIP', icon: Phone },
  { path: '/extensions', label: '📞 Extensions', icon: PhoneCall },
  { path: '/carriers', label: 'Carriers', icon: Server },
  { path: '/billing', label: 'Billing & Rates', icon: DollarSign },
  { path: '/calls', label: 'Call Records', icon: Activity },
  { path: '/wireguard', label: 'WireGuard', icon: Shield },
  { path: '/ports', label: 'Port Scanner', icon: Radio },
  { path: '/ovh', label: 'OVH Relay', icon: Globe },
  { path: '/settings', label: 'Settings', icon: Settings },
];

const tenantNav = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/bangladesh', label: '🇧🇩 BD SIP', icon: Phone },
  { path: '/extensions', label: '📞 Extensions', icon: PhoneCall },
  { path: '/carriers', label: 'Carriers', icon: Server },
  { path: '/billing', label: 'Billing & Rates', icon: DollarSign },
  { path: '/calls', label: 'Call Records', icon: Activity },
  { path: '/ports', label: 'Port Scanner', icon: Radio },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { user, logout, isSuperAdmin, activeTenantId, setActiveTenantId } = useAuth();
  const { tenants } = useData();

  const navItems = isSuperAdmin ? superNav : tenantNav;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="lg:hidden flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-lg"><Shield className="w-6 h-6 text-white" /></div>
          <span className="text-white font-bold text-lg">IPTSP Manager</span>
        </div>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-white/10 rounded-lg">
          {sidebarOpen ? <X className="w-6 h-6 text-white" /> : <Menu className="w-6 h-6 text-white" />}
        </button>
      </div>

      {sidebarOpen && <div className="lg:hidden fixed inset-0 bg-black/60 z-40" onClick={() => setSidebarOpen(false)} />}

      <aside className={`fixed top-0 left-0 h-full w-72 bg-slate-900/95 backdrop-blur-xl border-r border-white/10 z-50 transform transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-600 rounded-xl"><Shield className="w-8 h-8 text-white" /></div>
              <div><h1 className="text-xl font-bold text-white">IPTSP Manager</h1><p className="text-xs text-blue-200">{isSuperAdmin ? 'Super Admin' : 'Tenant Portal'}</p></div>
            </div>
          </div>

          {/* Tenant selector for super admin */}
          {isSuperAdmin && (
            <div className="px-4 pt-4">
              <select value={activeTenantId || ''} onChange={e => { const v = e.target.value; setActiveTenantId(v || null); localStorage.setItem('iptsp_active_tenant', v || ''); }}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm">
                <option value="">🔓 All Tenants (Super View)</option>
                {tenants.map(t => <option key={t.id} value={t.id}>🏢 {t.name} ({t.company})</option>)}
              </select>
            </div>
          )}

          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link key={item.path} to={item.path} onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'text-blue-200 hover:bg-white/10 hover:text-white'}`}>
                  <Icon className="w-5 h-5" /><span className="font-medium text-sm">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-white/10 space-y-2">
            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
              <div className="p-2 bg-blue-600/20 rounded-lg"><User className="w-5 h-5 text-blue-400" /></div>
              <div className="flex-1 min-w-0"><p className="text-white font-medium truncate">{user?.username}</p><p className="text-xs text-blue-200 capitalize">{user?.role?.replace('_',' ')}</p></div>
            </div>
            {isSuperAdmin && activeTenantId && (
              <div className="p-2 bg-yellow-600/20 border border-yellow-500/30 rounded-lg text-yellow-200 text-xs text-center">
                Viewing: {tenants.find(t=>t.id===activeTenantId)?.name || activeTenantId}
              </div>
            )}
            <button onClick={logout} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 rounded-xl text-red-300 hover:text-red-200 transition-all">
              <LogOut className="w-5 h-5" /> Sign Out
            </button>
          </div>
        </div>
      </aside>

      <main className="lg:ml-72 min-h-screen">
        <div className="p-4 md:p-8">{children}</div>
      </main>
    </div>
  );
}
