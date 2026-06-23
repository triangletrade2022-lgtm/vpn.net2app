import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { CarrierRate } from '../types';
import { Plus, Edit2, Trash2, Search, X } from 'lucide-react';

export default function BillingRates() {
  const { user, isSuperAdmin, activeTenantId } = useAuth();
  const { carrierRates, addCarrierRate, updateCarrierRate, deleteCarrierRate, carriers } = useData();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<CarrierRate | null>(null);
  const [search, setSearch] = useState('');

  const tid = isSuperAdmin ? (activeTenantId || undefined) : (user?.tenantId || '');
  const myRates = carrierRates.filter(r => !tid || r.tenantId === tid);
  const filtered = myRates.filter(r => r.prefix.includes(search));

  const [form, setForm] = useState({ tenantId: tid || '', carrierId: '', prefix: '', ratePerMinute: 0.02, billingIncrement: 60, connectionFee: 0, effective: new Date().toISOString().slice(0,10), expires: '' });

  const handleSubmit = () => {
    if (editing) updateCarrierRate(editing.id, form);
    else addCarrierRate(form);
    setShowModal(false); setEditing(null);
  };

  const openModal = (r?: CarrierRate) => {
    if (r) { setEditing(r); setForm({ tenantId: r.tenantId, carrierId: r.carrierId, prefix: r.prefix, ratePerMinute: r.ratePerMinute, billingIncrement: r.billingIncrement, connectionFee: r.connectionFee, effective: r.effective, expires: r.expires || '' }); }
    else { setEditing(null); setForm({ tenantId: tid || '', carrierId: '', prefix: '', ratePerMinute: 0.02, billingIncrement: 60, connectionFee: 0, effective: new Date().toISOString().slice(0,10), expires: '' }); }
    setShowModal(true);
  };

  const carrierName = (id: string) => carriers.find(c => c.id === id)?.name || id;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div><h1 className="text-3xl font-bold text-white mb-2">💰 Billing Rates</h1><p className="text-blue-200">Prefix-based rates for each carrier</p></div>
        <button onClick={() => openModal()} className="flex items-center gap-2 px-6 py-3 bg-yellow-600 hover:bg-yellow-700 text-white font-medium rounded-xl shadow-lg shadow-yellow-500/30"><Plus className="w-5 h-5" /> Add Rate</button>
      </div>
      <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-yellow-300" /><input type="text" placeholder="Search by prefix..." value={search} onChange={e=>setSearch(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-yellow-300/50 focus:outline-none focus:ring-2 focus:ring-yellow-500" /></div>
      
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-white/5"><tr>
            <th className="px-4 py-3 text-left text-xs text-blue-200">Carrier</th><th className="px-4 py-3 text-left text-xs text-blue-200">Prefix</th><th className="px-4 py-3 text-left text-xs text-blue-200">Rate/Min</th><th className="px-4 py-3 text-left text-xs text-blue-200">Increment</th><th className="px-4 py-3 text-left text-xs text-blue-200">Conn Fee</th><th className="px-4 py-3 text-left text-xs text-blue-200">Effective</th><th className="px-4 py-3 text-right text-xs text-blue-200">Actions</th>
          </tr></thead>
          <tbody className="divide-y divide-white/10">
            {filtered.map(r => (
              <tr key={r.id} className="hover:bg-white/5">
                <td className="px-4 py-3 text-white text-xs">{carrierName(r.carrierId)}</td>
                <td className="px-4 py-3 text-white font-mono font-bold">{r.prefix}</td>
                <td className="px-4 py-3 text-green-400 font-mono">${r.ratePerMinute.toFixed(4)}</td>
                <td className="px-4 py-3 text-white text-xs">{r.billingIncrement}s</td>
                <td className="px-4 py-3 text-white text-xs">${r.connectionFee.toFixed(4)}</td>
                <td className="px-4 py-3 text-blue-200 text-xs">{r.effective}</td>
                <td className="px-4 py-3"><div className="flex justify-end gap-2">
                  <button onClick={()=>openModal(r)} className="p-1.5 hover:bg-blue-500/20 rounded text-blue-300"><Edit2 className="w-3.5 h-3.5" /></button>
                  <button onClick={()=>{if(confirm('Delete?'))deleteCarrierRate(r.id)}} className="p-1.5 hover:bg-red-500/20 rounded text-red-300"><Trash2 className="w-3.5 h-3.5" /></button>
                </div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 rounded-2xl border border-yellow-500/30 w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b border-white/10"><h2 className="text-xl font-bold text-white">{editing?'Edit Rate':'Add Rate'}</h2><button onClick={()=>{setShowModal(false);setEditing(null);}} className="p-2 hover:bg-white/10 rounded"><X className="w-5 h-5 text-yellow-300" /></button></div>
            <div className="p-6 space-y-4">
              {isSuperAdmin && <div><label className="text-sm text-yellow-200 mb-1 block">Tenant</label><select value={form.tenantId} onChange={e=>setForm({...form,tenantId:e.target.value})} className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white"><option value="">Select...</option><option value="t1">IPTSP Bangladesh</option><option value="t2">IPTSP India</option><option value="t3">IPTSP World</option></select></div>}
              <div><label className="text-sm text-yellow-200 mb-1 block">Carrier</label><select value={form.carrierId} onChange={e=>setForm({...form,carrierId:e.target.value})} className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white">{carriers.filter(c=>!tid||c.tenantId===tid).map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-sm text-yellow-200 mb-1 block">Prefix</label><input type="text" value={form.prefix} onChange={e=>setForm({...form,prefix:e.target.value})} className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white" placeholder="88017" required /></div>
                <div><label className="text-sm text-yellow-200 mb-1 block">Rate/Min ($)</label><input type="number" step="0.0001" value={form.ratePerMinute} onChange={e=>setForm({...form,ratePerMinute:parseFloat(e.target.value)||0})} className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white" /></div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div><label className="text-sm text-yellow-200 mb-1 block">Increment (s)</label><input type="number" value={form.billingIncrement} onChange={e=>setForm({...form,billingIncrement:parseInt(e.target.value)||60})} className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white" /></div>
                <div><label className="text-sm text-yellow-200 mb-1 block">Conn Fee ($)</label><input type="number" step="0.0001" value={form.connectionFee} onChange={e=>setForm({...form,connectionFee:parseFloat(e.target.value)||0})} className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white" /></div>
                <div><label className="text-sm text-yellow-200 mb-1 block">Effective</label><input type="date" value={form.effective} onChange={e=>setForm({...form,effective:e.target.value})} className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white" /></div>
              </div>
              <div className="flex gap-3 pt-4"><button onClick={()=>{setShowModal(false);setEditing(null);}} className="flex-1 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl">Cancel</button><button onClick={handleSubmit} className="flex-1 px-6 py-3 bg-yellow-600 hover:bg-yellow-700 text-white font-medium rounded-xl">{editing?'Update':'Create'}</button></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
