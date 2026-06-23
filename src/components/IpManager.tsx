import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { ServerIp } from '../types';
import { Plus, Edit2, Trash2, X, Server } from 'lucide-react';

export default function IpManager() {
  const { isSuperAdmin } = useAuth();
  const { serverIps, addServerIp, updateServerIp, deleteServerIp, tenants } = useData();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<ServerIp | null>(null);

  const tenantCount = (ip: string) => tenants.filter(t => t.assignedIp === ip).length;

  const [form, setForm] = useState({
    ip: '', label: '', type: 'secondary' as ServerIp['type'],
    assignedTenantId: null as string | null,
    portSip: 5080, portWg: 51820,
    status: 'idle' as ServerIp['status'], maxTenants: 10, currentTenants: 0,
  });

  const handleSubmit = () => {
    const data = { ...form, currentTenants: tenantCount(form.ip) };
    if (editing) updateServerIp(editing.id, data);
    else addServerIp(data);
    setShowModal(false); setEditing(null);
  };

  const openModal = (ip?: ServerIp) => {
    if (ip) { setEditing(ip); setForm({ ip: ip.ip, label: ip.label, type: ip.type, assignedTenantId: ip.assignedTenantId, portSip: ip.portSip, portWg: ip.portWg, status: ip.status, maxTenants: ip.maxTenants, currentTenants: ip.currentTenants }); }
    else { setEditing(null); setForm({ ip: '', label: '', type: 'secondary', assignedTenantId: null, portSip: 5080, portWg: 51820, status: 'idle', maxTenants: 10, currentTenants: 0 }); }
    setShowModal(true);
  };

  if (!isSuperAdmin) return <div className="text-white text-center py-20">Access Denied — Super Admin Only</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">🌐 Server IP Pool</h1>
          <p className="text-blue-200">Manage public IPs — all tenants connect through these IPs</p>
        </div>
        <button onClick={() => openModal()} className="flex items-center gap-2 px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-xl shadow-lg shadow-teal-500/30"><Plus className="w-5 h-5" /> Add IP</button>
      </div>

      {/* Info Banner */}
      <div className="bg-teal-600/20 border border-teal-500/30 rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <Server className="w-8 h-8 text-teal-400 flex-shrink-0" />
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">IP Pool Architecture</h3>
            <p className="text-teal-200 text-sm">
              One primary IP serves multiple tenants. Add secondary IPs to scale. Each IP can host 
              multiple tenants with assigned SIP/WireGuard ports. Super admin controls which tenant 
              gets which IP via the <strong>Assigned IP</strong> field in Tenant management.
            </p>
          </div>
        </div>
      </div>

      {/* IP Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {serverIps.map(ip => {
          const count = tenantCount(ip.ip);
          return (
            <div key={ip.id} className={`bg-white/10 backdrop-blur-lg rounded-2xl border p-6 transition-all ${ip.type === 'primary' ? 'border-teal-500/40' : 'border-white/20'}`}>
              <div className="flex justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-lg ${ip.type === 'primary' ? 'bg-teal-600' : 'bg-gray-600'}`}><Server className="w-5 h-5 text-white" /></div>
                  <span className={`px-2 py-0.5 text-xs rounded-full ${ip.type === 'primary' ? 'bg-teal-500/20 text-teal-300' : 'bg-gray-500/20 text-gray-300'}`}>{ip.type}</span>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs border ${ip.status === 'active' ? 'bg-green-500/20 text-green-400 border-green-500/30' : ip.status === 'idle' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}`}>{ip.status}</span>
              </div>
              <div className="mb-3">
                <h3 className="text-xl font-bold text-white font-mono">{ip.ip}</h3>
                {ip.label && <p className="text-blue-200 text-xs">{ip.label}</p>}
              </div>
              <div className="grid grid-cols-2 gap-2 mb-3 text-center text-sm">
                <div className="p-2 bg-white/5 rounded"><p className="text-lg font-bold text-white">{count}</p><p className="text-blue-200 text-xs">Tenants</p></div>
                <div className="p-2 bg-white/5 rounded"><p className="text-lg font-bold text-white">{ip.maxTenants}</p><p className="text-blue-200 text-xs">Max</p></div>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
                <div className="p-2 bg-white/5 rounded text-center"><span className="text-blue-200 text-xs">SIP Port</span><p className="text-white font-mono">{ip.portSip}</p></div>
                <div className="p-2 bg-white/5 rounded text-center"><span className="text-blue-200 text-xs">WG Port</span><p className="text-white font-mono">{ip.portWg}</p></div>
              </div>

              {/* Tenants on this IP */}
              {count > 0 && (
                <div className="mb-3 p-2 bg-white/5 rounded text-xs">
                  <p className="text-blue-200 mb-1">Tenants on this IP:</p>
                  {tenants.filter(t => t.assignedIp === ip.ip).map(t => (
                    <span key={t.id} className="inline-block px-2 py-0.5 bg-teal-600/20 text-teal-300 rounded-full mr-1 mb-1">{t.name}</span>
                  ))}
                </div>
              )}

              <div className="flex gap-2 pt-3 border-t border-white/10">
                <button onClick={() => openModal(ip)} className="flex-1 px-3 py-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 rounded-lg text-blue-300 text-xs"><Edit2 className="w-3 h-3 inline mr-1" />Edit</button>
                {ip.type !== 'primary' && (
                  <button onClick={() => { if (confirm(`Delete IP ${ip.ip}?`)) deleteServerIp(ip.id); }} className="flex-1 px-3 py-2 bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 rounded-lg text-red-300 text-xs"><Trash2 className="w-3 h-3 inline mr-1" />Delete</button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center p-2 z-50 overflow-y-auto">
          <div className="bg-slate-900 rounded-2xl border border-teal-500/30 w-full max-w-lg my-4">
            <div className="flex items-center justify-between p-6 border-b border-white/10"><h2 className="text-xl font-bold text-white">{editing ? 'Edit IP' : 'Add Server IP'}</h2><button onClick={() => { setShowModal(false); setEditing(null); }} className="p-2 hover:bg-white/10 rounded"><X className="w-5 h-5 text-teal-300" /></button></div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-sm text-teal-200 mb-1 block">IP Address</label><input type="text" value={form.ip} onChange={e => setForm({ ...form, ip: e.target.value })} className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white font-mono" placeholder="103.51.128.9" required /></div>
                <div><label className="text-sm text-teal-200 mb-1 block">Label</label><input type="text" value={form.label} onChange={e => setForm({ ...form, label: e.target.value })} className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white" placeholder="Primary BD VPS" /></div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div><label className="text-sm text-teal-200 mb-1 block">Type</label><select value={form.type} onChange={e => setForm({ ...form, type: e.target.value as ServerIp['type'] })} className="w-full px-3 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white text-sm"><option value="primary">Primary</option><option value="secondary">Secondary</option></select></div>
                <div><label className="text-sm text-teal-200 mb-1 block">Status</label><select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as ServerIp['status'] })} className="w-full px-3 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white text-sm"><option value="active">Active</option><option value="idle">Idle</option><option value="disabled">Disabled</option></select></div>
                <div><label className="text-sm text-teal-200 mb-1 block">Max Tenants</label><input type="number" value={form.maxTenants} onChange={e => setForm({ ...form, maxTenants: parseInt(e.target.value) || 10 })} className="w-full px-3 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white text-sm" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-sm text-teal-200 mb-1 block">SIP Port</label><input type="number" value={form.portSip} onChange={e => setForm({ ...form, portSip: parseInt(e.target.value) || 5080 })} className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white" /></div>
                <div><label className="text-sm text-teal-200 mb-1 block">WG Port</label><input type="number" value={form.portWg} onChange={e => setForm({ ...form, portWg: parseInt(e.target.value) || 51820 })} className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white" /></div>
              </div>
              <div className="flex gap-3 pt-4"><button onClick={() => { setShowModal(false); setEditing(null); }} className="flex-1 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl">Cancel</button><button onClick={handleSubmit} className="flex-1 px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-xl">{editing ? 'Update' : 'Create'}</button></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
