import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { Search, PhoneIncoming, PhoneOutgoing } from 'lucide-react';

export default function CallRecords() {
  const { user, isSuperAdmin, activeTenantId } = useAuth();
  const { callRecords } = useData();
  const [search, setSearch] = useState('');
  const [dirFilter, setDirFilter] = useState<'all'|'inbound'|'outbound'>('all');

  const tid = isSuperAdmin ? (activeTenantId || undefined) : (user?.tenantId || '');
  let records = callRecords.filter(r => !tid || r.tenantId === tid);
  if (dirFilter !== 'all') records = records.filter(r => r.direction === dirFilter);
  if (search) records = records.filter(r => r.caller.includes(search) || r.callee.includes(search) || r.carrierName.toLowerCase().includes(search.toLowerCase()));

  const totalCost = records.reduce((s, r) => s + r.totalCost, 0);
  const totalMin = Math.round(records.reduce((s, r) => s + r.billableDuration, 0) / 60);
  const todayCost = records.filter(r => new Date(r.startTime).toDateString() === new Date().toDateString()).reduce((s, r) => s + r.totalCost, 0);

  const statusColor = (s: string) => s === 'answered' ? 'text-green-400' : s === 'failed' ? 'text-red-400' : s === 'busy' ? 'text-yellow-400' : 'text-gray-400';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">📊 Call Records</h1>
        <p className="text-blue-200">All inbound/outbound calls with duration and billing</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-4"><p className="text-blue-200 text-xs">Total Calls</p><p className="text-2xl font-bold text-white">{records.length}</p></div>
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-4"><p className="text-blue-200 text-xs">Total Minutes</p><p className="text-2xl font-bold text-white">{totalMin.toLocaleString()}</p></div>
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-4"><p className="text-blue-200 text-xs">Total Cost</p><p className="text-2xl font-bold text-green-400">${totalCost.toFixed(4)}</p></div>
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-4"><p className="text-blue-200 text-xs">Today Cost</p><p className="text-2xl font-bold text-yellow-400">${todayCost.toFixed(4)}</p></div>
      </div>
      <div className="flex gap-4">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-300" /><input type="text" placeholder="Search by number or carrier..." value={search} onChange={e=>setSearch(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-blue-300/50 focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
        <select value={dirFilter} onChange={e=>setDirFilter(e.target.value as 'all'|'inbound'|'outbound')} className="px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white"><option value="all">All Directions</option><option value="inbound">Inbound</option><option value="outbound">Outbound</option></select>
      </div>
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-white/5"><tr>
            <th className="px-4 py-3 text-left text-xs text-blue-200">Time</th><th className="px-4 py-3 text-left text-xs text-blue-200">Direction</th><th className="px-4 py-3 text-left text-xs text-blue-200">Caller</th><th className="px-4 py-3 text-left text-xs text-blue-200">Callee</th><th className="px-4 py-3 text-left text-xs text-blue-200">Carrier</th><th className="px-4 py-3 text-left text-xs text-blue-200">Duration</th><th className="px-4 py-3 text-left text-xs text-blue-200">Rate</th><th className="px-4 py-3 text-right text-xs text-blue-200">Cost</th><th className="px-4 py-3 text-left text-xs text-blue-200">Status</th>
          </tr></thead>
          <tbody className="divide-y divide-white/10">
            {records.length === 0 ? <tr><td colSpan={9} className="px-6 py-12 text-center text-blue-300">No call records found</td></tr> :
            records.slice(0, 100).map(r => (
              <tr key={r.id} className="hover:bg-white/5">
                <td className="px-4 py-3 text-blue-200 text-xs">{new Date(r.startTime).toLocaleString()}</td>
                <td className="px-4 py-3">{r.direction === 'inbound' ? <PhoneIncoming className="w-4 h-4 text-blue-400" /> : <PhoneOutgoing className="w-4 h-4 text-green-400" />}</td>
                <td className="px-4 py-3 text-white font-mono text-xs">{r.caller}</td>
                <td className="px-4 py-3 text-white font-mono text-xs">{r.callee}</td>
                <td className="px-4 py-3 text-blue-200 text-xs">{r.carrierName}</td>
                <td className="px-4 py-3 text-white text-xs">{Math.floor(r.billableDuration/60)}m {r.billableDuration%60}s</td>
                <td className="px-4 py-3 text-white text-xs">${r.ratePerMinute}/min</td>
                <td className="px-4 py-3 text-right text-green-400 font-mono text-xs">${r.totalCost.toFixed(4)}</td>
                <td className="px-4 py-3"><span className={statusColor(r.status)}>{r.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
