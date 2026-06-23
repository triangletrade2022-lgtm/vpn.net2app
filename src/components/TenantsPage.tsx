import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { Tenant } from '../types';
import { Plus, Edit2, Trash2, Search, X, Building2, Wifi, WifiOff } from 'lucide-react';

export default function TenantsPage() {
  const { isSuperAdmin } = useAuth();
  const { tenants, addTenant, updateTenant, deleteTenant, carriers, sipNumbers, extensions } = useData();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Tenant | null>(null);
  const [search, setSearch] = useState('');

  const filtered = tenants.filter(t => t.name.toLowerCase().includes(search.toLowerCase()) || t.company.toLowerCase().includes(search.toLowerCase()));

  const [form, setForm] = useState({ name: '', company: '', email: '', phone: '', country: 'bangladesh' as Tenant['country'], status: 'active' as Tenant['status'], maxSipNumbers: 100, maxCarriers: 5, maxExtensions: 50, channelLimit: 30, portAllocation: 100, rentalAmount: 150, assignedIp: '103.51.128.9', balance: 500, currency: 'BDT', vpnAccess: false, vpnIp: '' });

  const handleSubmit = () => {
    if (editing) updateTenant(editing.id, form);
    else addTenant(form);
    setShowModal(false); setEditing(null);
  };

  const openModal = (t?: Tenant) => {
    if (t) { setEditing(t); setForm({ name:t.name, company:t.company, email:t.email, phone:t.phone, country:t.country, status:t.status, maxSipNumbers:t.maxSipNumbers, maxCarriers:t.maxCarriers, maxExtensions:t.maxExtensions, channelLimit:t.channelLimit, portAllocation:t.portAllocation, rentalAmount:t.rentalAmount, assignedIp:t.assignedIp||'', balance:t.balance, currency:t.currency, vpnAccess:t.vpnAccess, vpnIp:t.vpnIp||'' }); }
    else { setEditing(null); setForm({ name:'', company:'', email:'', phone:'', country:'bangladesh', status:'active', maxSipNumbers:100, maxCarriers:5, maxExtensions:50, channelLimit:30, portAllocation:100, rentalAmount:150, assignedIp:'103.51.128.9', balance:500, currency:'BDT', vpnAccess:false, vpnIp:'' }); }
    setShowModal(true);
  };

  const tenantStats = (tid: string) => ({
    carriers: carriers.filter(c => c.tenantId === tid).length,
    sip: sipNumbers.filter(s => s.tenantId === tid).length,
    ext: extensions.filter(e => e.tenantId === tid).length,
  });

  if (!isSuperAdmin) return <div className="text-white text-center py-20">Access Denied - Super Admin Only</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div><h1 className="text-3xl font-bold text-white mb-2">🏢 Tenant Management</h1><p className="text-blue-200">Manage all IPTSP tenants and their resources</p></div>
        <button onClick={() => openModal()} className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl shadow-lg shadow-indigo-500/30"><Plus className="w-5 h-5" /> Add Tenant</button>
      </div>
      <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-300" /><input type="text" placeholder="Search tenants..." value={search} onChange={e=>setSearch(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-indigo-300/50 focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map(t => {
          const s = tenantStats(t.id);
          return (
            <div key={t.id} className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6 hover:bg-white/15 transition-all">
              <div className="flex justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-xl ${t.status==='active'?'bg-green-600':t.status==='suspended'?'bg-red-600':'bg-gray-600'}`}><Building2 className="w-6 h-6 text-white" /></div>
                  <div><h3 className="text-lg font-semibold text-white">{t.name}</h3><p className="text-xs text-blue-200">{t.company}</p></div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs border ${t.status==='active'?'bg-green-500/20 text-green-400 border-green-500/30':t.status==='suspended'?'bg-red-500/20 text-red-400 border-red-500/30':'bg-gray-500/20 text-gray-400'}`}>{t.status}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 mb-3 text-center">
                <div className="p-2 bg-white/5 rounded"><p className="text-lg font-bold text-white">{s.carriers}</p><p className="text-blue-200 text-xs">Carriers</p></div>
                <div className="p-2 bg-white/5 rounded"><p className="text-lg font-bold text-white">{s.sip}</p><p className="text-blue-200 text-xs">SIP</p></div>
                <div className="p-2 bg-white/5 rounded"><p className="text-lg font-bold text-white">{s.ext}</p><p className="text-blue-200 text-xs">Extensions</p></div>
              </div>
              <div className="grid grid-cols-3 gap-2 mb-3 text-center">
                <div className="p-2 bg-white/5 rounded"><p className="text-sm font-bold text-cyan-400">{t.channelLimit}</p><p className="text-blue-200 text-xs">Channels</p></div>
                <div className="p-2 bg-white/5 rounded"><p className="text-sm font-bold text-yellow-400">{t.portAllocation}</p><p className="text-blue-200 text-xs">Ports</p></div>
                <div className="p-2 bg-white/5 rounded"><p className="text-sm font-bold text-pink-400">{t.currency} {t.rentalAmount}</p><p className="text-blue-200 text-xs">Rent/mo</p></div>
              </div>
              <div className="space-y-1 mb-3 text-sm">
                <div className="flex justify-between text-blue-200"><span>🌐 Assigned IP</span><span className="text-white font-mono">{t.assignedIp || 'Not set'}</span></div>
                <div className="flex justify-between text-blue-200"><span>Balance</span><span className="text-green-400 font-bold">{t.currency} {t.balance}</span></div>
                <div className="flex justify-between text-blue-200"><span>VPN</span><span>{t.vpnAccess ? <Wifi className="w-4 h-4 text-green-400" /> : <WifiOff className="w-4 h-4 text-gray-400" />}</span></div>
              </div>
              <div className="flex gap-2 pt-3 border-t border-white/10">
                <button onClick={()=>openModal(t)} className="flex-1 px-3 py-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 rounded-lg text-blue-300 text-xs"><Edit2 className="w-3 h-3 inline" /> Edit</button>
                <button onClick={()=>{if(confirm(`Delete ${t.name}?`))deleteTenant(t.id)}} className="flex-1 px-3 py-2 bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 rounded-lg text-red-300 text-xs"><Trash2 className="w-3 h-3 inline" /> Delete</button>
              </div>
            </div>
          );
        })}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center p-2 z-50 overflow-y-auto">
          <div className="bg-slate-900 rounded-2xl border border-indigo-500/30 w-full max-w-xl my-4 max-h-[95vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-white/10"><h2 className="text-xl font-bold text-white">{editing?'Edit Tenant':'Add Tenant'}</h2><button onClick={()=>{setShowModal(false);setEditing(null);}} className="p-2 hover:bg-white/10 rounded"><X className="w-5 h-5 text-indigo-300" /></button></div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-sm text-indigo-200 mb-1 block">Name</label><input type="text" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white" required /></div>
                <div><label className="text-sm text-indigo-200 mb-1 block">Company</label><input type="text" value={form.company} onChange={e=>setForm({...form,company:e.target.value})} className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white" required /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-sm text-indigo-200 mb-1 block">Email</label><input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white" /></div>
                <div><label className="text-sm text-indigo-200 mb-1 block">🌐 Assigned IP</label><input type="text" value={form.assignedIp} onChange={e=>setForm({...form,assignedIp:e.target.value})} className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white font-mono" placeholder="103.51.128.9" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-sm text-indigo-200 mb-1 block">Phone</label><input type="text" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white" /></div>
                <div></div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div><label className="text-sm text-indigo-200 mb-1 block">Country</label><select value={form.country} onChange={e=>setForm({...form,country:e.target.value as Tenant['country']})} className="w-full px-3 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white text-sm"><option value="bangladesh">Bangladesh</option><option value="india">India</option><option value="pakistan">Pakistan</option><option value="world">World</option></select></div>
                <div><label className="text-sm text-indigo-200 mb-1 block">Status</label><select value={form.status} onChange={e=>setForm({...form,status:e.target.value as Tenant['status']})} className="w-full px-3 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white text-sm"><option value="active">Active</option><option value="inactive">Inactive</option><option value="suspended">Suspended</option></select></div>
                <div><label className="text-sm text-indigo-200 mb-1 block">Currency</label><select value={form.currency} onChange={e=>setForm({...form,currency:e.target.value})} className="w-full px-3 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white text-sm"><option value="BDT">BDT</option><option value="INR">INR</option><option value="USD">USD</option></select></div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div><label className="text-sm text-indigo-200 mb-1 block">Max SIP</label><input type="number" value={form.maxSipNumbers} onChange={e=>setForm({...form,maxSipNumbers:parseInt(e.target.value)})} className="w-full px-3 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white" /></div>
                <div><label className="text-sm text-indigo-200 mb-1 block">Max Carriers</label><input type="number" value={form.maxCarriers} onChange={e=>setForm({...form,maxCarriers:parseInt(e.target.value)})} className="w-full px-3 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white" /></div>
                <div><label className="text-sm text-indigo-200 mb-1 block">Max Ext</label><input type="number" value={form.maxExtensions} onChange={e=>setForm({...form,maxExtensions:parseInt(e.target.value)})} className="w-full px-3 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white" /></div>
              </div>
              {/* ──── CHANNELS / PORTS / RENTAL ──── */}
              <div className="border-t border-white/10 pt-4">
                <h3 className="text-white font-semibold mb-3 text-sm">⚙️ Resource Limits &amp; Rental</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div><label className="text-sm text-cyan-200 mb-1 block">🔊 Channel Limit</label><input type="number" value={form.channelLimit} onChange={e=>setForm({...form,channelLimit:parseInt(e.target.value)||0})} className="w-full px-3 py-2.5 bg-white/10 border border-cyan-500/30 rounded-xl text-white" /><p className="text-cyan-200/60 text-xs mt-1">Max concurrent calls</p></div>
                  <div><label className="text-sm text-yellow-200 mb-1 block">🔌 Port Allocation</label><input type="number" value={form.portAllocation} onChange={e=>setForm({...form,portAllocation:parseInt(e.target.value)||0})} className="w-full px-3 py-2.5 bg-white/10 border border-yellow-500/30 rounded-xl text-white" /><p className="text-yellow-200/60 text-xs mt-1">SIP ports assigned</p></div>
                  <div><label className="text-sm text-pink-200 mb-1 block">💰 Rental / month</label><input type="number" step="0.01" value={form.rentalAmount} onChange={e=>setForm({...form,rentalAmount:parseFloat(e.target.value)||0})} className="w-full px-3 py-2.5 bg-white/10 border border-pink-500/30 rounded-xl text-white" /><p className="text-pink-200/60 text-xs mt-1">Monthly fee ({form.currency})</p></div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-sm text-indigo-200 mb-1 block">Balance</label><input type="number" value={form.balance} onChange={e=>setForm({...form,balance:parseFloat(e.target.value)})} className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white" /></div>
                <div><label className="text-sm text-indigo-200 mb-1 block">VPN IP</label><input type="text" value={form.vpnIp} onChange={e=>setForm({...form,vpnIp:e.target.value})} className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white" /></div>
              </div>
              <label className="flex items-center gap-3 text-indigo-200 text-sm"><input type="checkbox" checked={form.vpnAccess} onChange={e=>setForm({...form,vpnAccess:e.target.checked})} className="rounded" /> VPN Access Enabled</label>
              <div className="flex gap-3 pt-4"><button onClick={()=>{setShowModal(false);setEditing(null);}} className="flex-1 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl">Cancel</button><button onClick={handleSubmit} className="flex-1 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl">{editing?'Update':'Create'}</button></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
