import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { Carrier } from '../types';
import { Plus, Edit2, Trash2, Search, X, Server, Wifi, WifiOff, RefreshCw, DollarSign, Activity, Radio, Music } from 'lucide-react';

export default function CarrierManager() {
  const { user, isSuperAdmin, activeTenantId } = useAuth();
  const { carriers, addCarrier, updateCarrier, deleteCarrier, tenants } = useData();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Carrier | null>(null);
  const [search, setSearch] = useState('');
  const [checking, setChecking] = useState<Set<string>>(new Set());

  const tid = isSuperAdmin ? (activeTenantId || undefined) : (user?.tenantId || '');
  const myCarriers = carriers.filter(c => !tid || c.tenantId === tid);
  const filtered = myCarriers.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.sipServer.includes(search) || c.username.includes(search));

  const [form, setForm] = useState({
    tenantId: (tid || ''), name: '', sipServer: '', sipPort: 5080, username: '', password: '',
    prefix: '', suffix: '', e164Format: false, prefixTranslation: '',
    g729: true, g711ulaw: true, g711alaw: true, gsm: true,
    dtmfMode: 'rfc2833', transport: 'udp' as Carrier['transport'], nat: true,
    insecure: 'port,invite', context: 'iptsp-inbound',
    billingCycle: 'per_minute' as Carrier['billingCycle'], ratePerMinute: 0.02, connectionFee: 0,
    billingIncrement: 60, status: 'active' as Carrier['status'],
  });

  const buildCodecs = () => {
    const a: string[] = [];
    if (form.g729) a.push('g729');
    if (form.g711ulaw) a.push('ulaw');
    if (form.g711alaw) a.push('alaw');
    if (form.gsm) a.push('gsm');
    return a.join(',') || 'ulaw,alaw';
  };

  const parseCodecs = (raw: string) => ({
    g729: raw.includes('g729'),
    g711ulaw: raw.includes('ulaw'),
    g711alaw: raw.includes('alaw'),
    gsm: raw.includes('gsm'),
  });

  const handleSubmit = () => {
    const codecs = buildCodecs();
    const data = { ...form, codecs, tenantId: form.tenantId || tid || 'default', totalMinutes: 0, totalCalls: 0, todayMinutes: 0, todayCalls: 0 };
    if (editing) updateCarrier(editing.id, data);
    else addCarrier(data);
    setShowModal(false); setEditing(null);
  };

  const openModal = (c?: Carrier) => {
    if (c) {
      setEditing(c);
      const cd = parseCodecs(c.codecs || '');
      setForm({ tenantId: c.tenantId, name: c.name, sipServer: c.sipServer, sipPort: c.sipPort, username: c.username, password: c.password, prefix: c.prefix, suffix: c.suffix, e164Format: c.e164Format, prefixTranslation: c.prefixTranslation, ...cd, dtmfMode: c.dtmfMode, transport: c.transport, nat: c.nat, insecure: c.insecure, context: c.context, billingCycle: c.billingCycle, ratePerMinute: c.ratePerMinute, connectionFee: c.connectionFee, billingIncrement: c.billingIncrement, status: c.status });
    } else {
      setEditing(null);
      setForm({ tenantId: tid || '', name: '', sipServer: '', sipPort: 5080, username: '', password: '', prefix: '', suffix: '', e164Format: false, prefixTranslation: '', g729: true, g711ulaw: true, g711alaw: true, gsm: true, dtmfMode: 'rfc2833', transport: 'udp', nat: true, insecure: 'port,invite', context: 'iptsp-inbound', billingCycle: 'per_minute', ratePerMinute: 0.02, connectionFee: 0, billingIncrement: 60, status: 'active' });
    }
    setShowModal(true);
  };

  const checkConn = async (c: Carrier) => {
    setChecking(p => new Set(p).add(c.id));
    updateCarrier(c.id, { connectivityStatus: 'checking' });
    await new Promise(r => setTimeout(r, 600 + Math.random() * 800));
    const ok = c.sipServer && c.sipServer.length > 5;
    updateCarrier(c.id, { connectivityStatus: ok ? 'verified' : 'failed', lastVerified: new Date().toISOString(), status: ok ? c.status : 'inactive' });
    setChecking(p => { const n = new Set(p); n.delete(c.id); return n; });
  };

  const cIcon = (s?: string) => s==='verified'?<Wifi className="w-4 h-4 text-green-400"/>:s==='failed'?<WifiOff className="w-4 h-4 text-red-400"/>:s==='checking'?<RefreshCw className="w-4 h-4 text-yellow-400 animate-spin"/>:<Activity className="w-4 h-4 text-gray-400"/>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div><h1 className="text-3xl font-bold text-white mb-2">📡 Carrier Management</h1><p className="text-blue-200">G.729 · G.711 · GSM | Inbound & Outbound | E.164 Routing</p></div>
        <button onClick={() => openModal()} className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl shadow-lg shadow-emerald-500/30"><Plus className="w-5 h-5" /> Add Carrier</button>
      </div>

      <div className="bg-emerald-600/20 border border-emerald-500/30 rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <Radio className="w-6 h-6 text-emerald-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-white font-semibold mb-1">🎵 Supported Codecs</h3>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mt-2">
              <span className="px-3 py-1.5 bg-green-600/30 text-green-300 rounded-full text-xs text-center font-mono">G.729</span>
              <span className="px-3 py-1.5 bg-blue-600/30 text-blue-300 rounded-full text-xs text-center font-mono">G.711 μ-law</span>
              <span className="px-3 py-1.5 bg-blue-600/30 text-blue-300 rounded-full text-xs text-center font-mono">G.711 A-law</span>
              <span className="px-3 py-1.5 bg-purple-600/30 text-purple-300 rounded-full text-xs text-center font-mono">GSM</span>
            </div>
            <p className="text-emerald-200 text-xs mt-2">Each carrier can be individually configured for any combination of these codecs on both incoming and outgoing calls.</p>
          </div>
        </div>
      </div>

      <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-300" /><input type="text" placeholder="Search carriers..." value={search} onChange={e=>setSearch(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-emerald-300/50 focus:outline-none focus:ring-2 focus:ring-emerald-500" /></div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filtered.length === 0 ? (
          <div className="col-span-full text-center py-16 text-emerald-300"><Server className="w-16 h-16 mx-auto mb-4 opacity-30" /><p className="text-lg">No carriers yet</p></div>
        ) : filtered.map(c => (
          <div key={c.id} className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6">
            <div className="flex justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-emerald-600"><Server className="w-6 h-6 text-white" /></div>
                <div><h3 className="text-lg font-semibold text-white">{c.name}</h3><p className="text-xs text-emerald-200">{c.sipServer}:{c.sipPort}</p></div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={()=>checkConn(c)} disabled={checking.has(c.id)}>{cIcon(c.connectivityStatus)}</button>
                <span className={`px-2 py-1 rounded-full text-xs border ${c.status==='active'?'bg-green-500/20 text-green-400 border-green-500/30':'bg-red-500/20 text-red-400 border-red-500/30'}`}>{c.status}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
              <div className="p-2 bg-white/5 rounded"><span className="text-blue-200 text-xs">User</span><p className="text-white font-mono text-xs">{c.username}</p></div>
              <div className="p-2 bg-white/5 rounded"><span className="text-blue-200 text-xs">Rate</span><p className="text-green-400 font-bold">${c.ratePerMinute}/min</p></div>
            </div>
            <div className="flex flex-wrap gap-1 mb-3">
              {c.codecs?.split(',').map(cd => {
                const t = cd.trim();
                let cls = 'bg-gray-500/20 text-gray-300';
                if (t === 'g729') cls = 'bg-green-600/20 text-green-300';
                else if (t === 'ulaw' || t === 'alaw') cls = 'bg-blue-600/20 text-blue-300';
                else if (t === 'gsm') cls = 'bg-purple-600/20 text-purple-300';
                return <span key={t} className={`px-2 py-0.5 rounded-full text-xs font-mono ${cls}`}>{t}</span>;
              })}
            </div>
            <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
              <div className="p-2 bg-white/5 rounded"><span className="text-blue-200">Total</span><p className="text-white font-bold">{c.totalMinutes.toLocaleString()} min</p></div>
              <div className="p-2 bg-white/5 rounded"><span className="text-blue-200">Today</span><p className="text-white font-bold">{c.todayMinutes} min / {c.todayCalls} calls</p></div>
            </div>
            {c.prefixTranslation && <div className="p-2 bg-yellow-600/10 rounded text-yellow-200 text-xs mb-3">🔀 {c.prefixTranslation} {c.e164Format ? '| E.164' : ''}</div>}
            <div className="flex gap-2 pt-3 border-t border-white/10">
              <button onClick={()=>openModal(c)} className="flex-1 px-3 py-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 rounded-lg text-blue-300 text-xs"><Edit2 className="w-3 h-3 inline mr-1" />Edit</button>
              <button onClick={()=>{if(confirm('Delete '+c.name+'?'))deleteCarrier(c.id)}} className="flex-1 px-3 py-2 bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 rounded-lg text-red-300 text-xs"><Trash2 className="w-3 h-3 inline mr-1" />Delete</button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center p-2 z-50 overflow-y-auto">
          <div className="bg-slate-900 rounded-2xl border border-emerald-500/30 w-full max-w-2xl my-4 max-h-[95vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-white/10 sticky top-0 bg-slate-900 z-10">
              <h2 className="text-xl font-bold text-white">{editing ? 'Edit Carrier' : 'Add Carrier'}</h2>
              <button onClick={()=>{setShowModal(false);setEditing(null);}} className="p-2 hover:bg-white/10 rounded-lg"><X className="w-5 h-5 text-emerald-300" /></button>
            </div>
            <div className="p-6 space-y-4">
              {isSuperAdmin && <div><label className="block text-sm font-medium text-emerald-200 mb-1">Tenant</label><select value={form.tenantId} onChange={e=>setForm({...form, tenantId: e.target.value})} className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white"><option value="">Select...</option>{tenants.map(t=><option key={t.id} value={t.id}>{t.name} ({t.company})</option>)}</select></div>}
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-emerald-200 mb-1">Carrier Name</label><input type="text" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white" placeholder="BD IPTSP Main" required /></div>
                <div><label className="block text-sm font-medium text-emerald-200 mb-1">SIP Server</label><input type="text" value={form.sipServer} onChange={e=>setForm({...form,sipServer:e.target.value})} className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white" placeholder="180.210.187.253" required /></div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div><label className="block text-sm font-medium text-emerald-200 mb-1">Port</label><input type="number" value={form.sipPort} onChange={e=>setForm({...form,sipPort:parseInt(e.target.value)||5080})} className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white" /></div>
                <div><label className="block text-sm font-medium text-emerald-200 mb-1">Username</label><input type="text" value={form.username} onChange={e=>setForm({...form,username:e.target.value})} className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white" /></div>
                <div><label className="block text-sm font-medium text-emerald-200 mb-1">Password</label><input type="text" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-emerald-200 mb-1">Prefix</label><input type="text" value={form.prefix} onChange={e=>setForm({...form,prefix:e.target.value})} className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white" placeholder="096, +880" /></div>
                <div><label className="block text-sm font-medium text-emerald-200 mb-1">Suffix</label><input type="text" value={form.suffix} onChange={e=>setForm({...form,suffix:e.target.value})} className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white" placeholder="Append after number" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-emerald-200 mb-1">Prefix Translation</label><input type="text" value={form.prefixTranslation} onChange={e=>setForm({...form,prefixTranslation:e.target.value})} className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white" placeholder="0→0091, +88→" /></div>
                <div><label className="block text-sm font-medium text-emerald-200 mb-1">Context</label><input type="text" value={form.context} onChange={e=>setForm({...form,context:e.target.value})} className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white" /></div>
              </div>

              {/* ──── CODEC SELECTION ──── */}
              <div className="border-t border-white/10 pt-4">
                <h3 className="text-white font-semibold mb-3 flex items-center gap-2"><Music className="w-4 h-4 text-cyan-400" /> Codec Selection (Inbound & Outbound)</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <label className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer border transition-all ${form.g729 ? 'bg-green-600/20 border-green-500/40' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}>
                    <input type="checkbox" checked={form.g729} onChange={e=>setForm({...form,g729:e.target.checked})} className="w-4 h-4 rounded accent-green-500" />
                    <div><span className="text-white font-semibold text-sm">G.729</span><p className="text-green-200 text-xs">8 kbps · Narrowband</p></div>
                  </label>
                  <label className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer border transition-all ${form.g711ulaw ? 'bg-blue-600/20 border-blue-500/40' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}>
                    <input type="checkbox" checked={form.g711ulaw} onChange={e=>setForm({...form,g711ulaw:e.target.checked})} className="w-4 h-4 rounded accent-blue-500" />
                    <div><span className="text-white font-semibold text-sm">G.711 μ-law</span><p className="text-blue-200 text-xs">64 kbps · PSTN Quality</p></div>
                  </label>
                  <label className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer border transition-all ${form.g711alaw ? 'bg-blue-600/20 border-blue-500/40' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}>
                    <input type="checkbox" checked={form.g711alaw} onChange={e=>setForm({...form,g711alaw:e.target.checked})} className="w-4 h-4 rounded accent-blue-500" />
                    <div><span className="text-white font-semibold text-sm">G.711 A-law</span><p className="text-blue-200 text-xs">64 kbps · European Standard</p></div>
                  </label>
                  <label className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer border transition-all ${form.gsm ? 'bg-purple-600/20 border-purple-500/40' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}>
                    <input type="checkbox" checked={form.gsm} onChange={e=>setForm({...form,gsm:e.target.checked})} className="w-4 h-4 rounded accent-purple-500" />
                    <div><span className="text-white font-semibold text-sm">GSM</span><p className="text-purple-200 text-xs">13 kbps · Mobile Standard</p></div>
                  </label>
                </div>
                <div className="mt-2 p-2 bg-white/5 rounded-lg text-center">
                  <span className="text-cyan-200 text-xs">Active codecs: </span>
                  <span className="text-white font-mono text-xs font-bold">{buildCodecs() || 'None selected'}</span>
                  <span className="text-cyan-200 text-xs ml-2">→ Applied to both incoming & outgoing calls</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div><label className="block text-sm font-medium text-emerald-200 mb-1">Transport</label><select value={form.transport} onChange={e=>setForm({...form,transport:e.target.value as Carrier['transport']})} className="w-full px-3 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white text-sm"><option value="udp">UDP</option><option value="tcp">TCP</option><option value="tls">TLS</option></select></div>
                <div><label className="block text-sm font-medium text-emerald-200 mb-1">DTMF</label><input type="text" value={form.dtmfMode} onChange={e=>setForm({...form,dtmfMode:e.target.value})} className="w-full px-3 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white text-sm" /></div>
                <div><label className="block text-sm font-medium text-emerald-200 mb-1">Status</label><select value={form.status} onChange={e=>setForm({...form,status:e.target.value as Carrier['status']})} className="w-full px-3 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white text-sm"><option value="active">Active</option><option value="inactive">Inactive</option></select></div>
              </div>
              <div className="flex items-center gap-4 flex-wrap">
                <label className="flex items-center gap-2 text-emerald-200 text-sm"><input type="checkbox" checked={form.nat} onChange={e=>setForm({...form,nat:e.target.checked})} className="rounded" /> NAT</label>
                <label className="flex items-center gap-2 text-emerald-200 text-sm"><input type="checkbox" checked={form.e164Format} onChange={e=>setForm({...form,e164Format:e.target.checked})} className="rounded" /> E.164 Format</label>
              </div>
              <div className="border-t border-white/10 pt-4">
                <h3 className="text-white font-semibold mb-3 flex items-center gap-2"><DollarSign className="w-4 h-4" /> Billing Configuration</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div><label className="block text-sm font-medium text-yellow-200 mb-1">Rate/Min ($)</label><input type="number" step="0.0001" value={form.ratePerMinute} onChange={e=>setForm({...form,ratePerMinute:parseFloat(e.target.value)||0})} className="w-full px-4 py-2.5 bg-white/10 border border-yellow-500/30 rounded-xl text-white" /></div>
                  <div><label className="block text-sm font-medium text-yellow-200 mb-1">Conn Fee ($)</label><input type="number" step="0.0001" value={form.connectionFee} onChange={e=>setForm({...form,connectionFee:parseFloat(e.target.value)||0})} className="w-full px-4 py-2.5 bg-white/10 border border-yellow-500/30 rounded-xl text-white" /></div>
                  <div><label className="block text-sm font-medium text-yellow-200 mb-1">Increment (s)</label><input type="number" value={form.billingIncrement} onChange={e=>setForm({...form,billingIncrement:parseInt(e.target.value)||60})} className="w-full px-4 py-2.5 bg-white/10 border border-yellow-500/30 rounded-xl text-white" /></div>
                </div>
                <div className="mt-3"><label className="block text-sm font-medium text-yellow-200 mb-1">Billing Cycle</label><select value={form.billingCycle} onChange={e=>setForm({...form,billingCycle:e.target.value as Carrier['billingCycle']})} className="w-full px-4 py-2.5 bg-white/10 border border-yellow-500/30 rounded-xl text-white"><option value="per_minute">Per Minute</option><option value="per_6sec">Per 6 Seconds</option><option value="per_second">Per Second</option></select></div>
              </div>
              <div className="flex gap-3 pt-4">
                <button onClick={()=>{setShowModal(false);setEditing(null);}} className="flex-1 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl">Cancel</button>
                <button onClick={handleSubmit} className="flex-1 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl shadow-lg shadow-emerald-500/30">{editing?'Update':'Create'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
