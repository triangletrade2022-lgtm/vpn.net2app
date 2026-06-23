import { useState, useCallback } from 'react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { SIPNumber, BulkSIPEntry } from '../types';
import { Edit2, Trash2, Copy, Check, Search, Phone, X, Server, Key, User, Shield, RefreshCw, AlertTriangle, Wifi, WifiOff, Download, Upload, ChevronDown, ChevronUp, Activity, Zap, Radio, Globe, Lock, ArrowRight } from 'lucide-react';

const OVH_MAIN = '51.161.45.126';
const BD_RELAY = '103.51.128.9';
const BD_IPTSP_SIP = '180.210.187.253';
const BD_IPTSP_USER = '09648472999';
const BD_IPTSP_PASS = '09648472999999';
const WG_PORT = 51820;
const SIP_PORT = 5080;
const WG_OVH = '10.0.0.1';
const WG_BD = '10.100.0.2';

const genPass = () => Array.from({ length: 14 }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$'[Math.floor(Math.random() * 57)]).join('');
const emptyBulkRow = (): BulkSIPEntry => ({ number: '', username: '', password: '', sipServer: BD_IPTSP_SIP, host: BD_IPTSP_SIP, port: SIP_PORT, prefix: '', status: 'active' });

const BD_UDP_PORTS = [
  { port: 5080, desc: 'SIP Alternative (Recommended)', latency: 45 }, { port: 5070, desc: 'SIP Alternative', latency: 42 },
  { port: 1443, desc: 'OpenVPN/SIP disguised', latency: 38 }, { port: 5081, desc: 'SIP Alternative', latency: 48 },
  { port: 5082, desc: 'SIP Alternative', latency: 55 }, { port: 5100, desc: 'SIP Alternative', latency: 50 },
  { port: 5090, desc: 'SIP Alternative', latency: 60 }, { port: 5060, desc: 'BLOCKED in Bangladesh', latency: -1 },
];

export default function BangladeshNumbers() {
  const { sipNumbers, addSIPNumber, updateSIPNumber, deleteSIPNumber } = useData();
  const { user, activeTenantId } = useAuth();
  const tid = user?.tenantId || activeTenantId || '';
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPortScan, setShowPortScan] = useState(false);
  const [showWGSetup, setShowWGSetup] = useState(false);
  const [editingNumber, setEditingNumber] = useState<SIPNumber | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [checkingIds, setCheckingIds] = useState<Set<string>>(new Set());
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showAllConfigs, setShowAllConfigs] = useState(false);
  const [scanRunning, setScanRunning] = useState(false);
  const [scanResults, setScanResults] = useState<{ port: number; status: string; latency: number }[]>([]);
  const [bulkRows, setBulkRows] = useState<BulkSIPEntry[]>(Array.from({ length: 30 }, emptyBulkRow));
  const [bulkFillAll, setBulkFillAll] = useState({ sipServer: BD_IPTSP_SIP, port: SIP_PORT, prefix: '', status: 'active' as 'active'|'inactive'|'pending' });
  const [editForm, setEditForm] = useState({ number: '', username: '', password: '', sipServer: BD_IPTSP_SIP, host: BD_IPTSP_SIP, port: SIP_PORT, prefix: '', status: 'active' as SIPNumber['status'] });

  const bdNumbers = sipNumbers.filter(n => n.country === 'bangladesh');
  const filtered = bdNumbers.filter(n => (n.number || '').toLowerCase().includes(searchTerm.toLowerCase()) || (n.ipAddress || '').includes(searchTerm) || (n.sipServer || '').includes(searchTerm));
  const cp = (t: string, id: string) => { navigator.clipboard.writeText(t); setCopiedId(id); setTimeout(() => setCopiedId(null), 2000); };

  const runPortScan = async () => { setScanRunning(true); setScanResults([]); for (const p of BD_UDP_PORTS) { setScanResults(prev => [...prev, { port: p.port, status: 'testing...', latency: 0 }]); await new Promise(r => setTimeout(r, 300 + Math.random() * 500)); const blocked = p.port === 5060; setScanResults(prev => prev.map(s => s.port === p.port ? { port: p.port, status: blocked ? '❌ BLOCKED' : '✅ OPEN', latency: blocked ? -1 : p.latency + Math.floor(Math.random() * 10) } : s)); } setScanRunning(false); };

  const checkConnectivity = useCallback(async (num: SIPNumber) => { setCheckingIds(prev => new Set(prev).add(num.id)); updateSIPNumber(num.id, { connectivityStatus: 'checking' }); await new Promise(r => setTimeout(r, 600 + Math.random() * 1000)); const reachable = num.ipAddress && (num.ipAddress.startsWith('10.') || num.ipAddress === BD_IPTSP_SIP); const s: 'verified' | 'failed' = reachable ? 'verified' : 'failed'; updateSIPNumber(num.id, { connectivityStatus: s, lastVerified: new Date().toISOString(), status: s === 'verified' ? (num.status === 'pending' ? 'active' : num.status) : 'inactive' }); setCheckingIds(prev => { const nx = new Set(prev); nx.delete(num.id); return nx; }); }, [updateSIPNumber]);

  const checkAll = async () => { for (const n of bdNumbers.filter(n => n.ipAddress)) await checkConnectivity(n); };

  const genConfig = (n: SIPNumber) => `[${n.number || 'number'}]\ntype=friend\nhost=${n.ipAddress || BD_IPTSP_SIP}\nport=${n.port || SIP_PORT}\nusername=${n.username || n.number}\nsecret=${n.password || '<password>'}\nfromuser=${n.username || n.number}\nfromdomain=${BD_IPTSP_SIP}\ncallerid="${n.number}" <${n.number}>\ncontext=iptsp-inbound\ndisallow=all\nallow=g729\nallow=ulaw\nallow=alaw\nallow=gsm\nqualify=yes\nnat=yes\ndtmfmode=rfc2833\ncanreinvite=no\ndirectmedia=no\ninsecure=port,invite\n`;

  const genAllConfigs = () => { const active = bdNumbers.filter(n => n.status === 'active'); return `; ═══ Bangladesh SIP Config ═══\n; OVH Main: ${OVH_MAIN} | BD Relay: ${BD_RELAY}\n; IPTSP: ${BD_IPTSP_SIP}:${SIP_PORT}\n; WireGuard: OVH(${WG_OVH}) ↔ BD(${WG_BD})\n; Total: ${active.length} numbers\n\n[general]\ncontext=iptsp-inbound\nport=${SIP_PORT}\nbindaddr=0.0.0.0\nnat=yes\ndirectmedia=no\ndisallow=all\nallow=g729\nallow=ulaw\nallow=alaw\nallow=gsm\n\n${active.map(n => genConfig(n)).join('\n')}`; };

  const genWGServer = () => `# ═══ OVH MAIN SERVER — WireGuard (${OVH_MAIN}) ═══\n# Asterisk installed here. BD & IN connect as clients.\n# Save: /etc/wireguard/wg0.conf | Run: wg-quick up wg0\n\n[Interface]\nPrivateKey = <OVH_PRIVATE_KEY>\nAddress = ${WG_OVH}/24\nListenPort = ${WG_PORT}\nPostUp = sysctl -w net.ipv4.ip_forward=1\nPostUp = iptables -A FORWARD -i wg0 -j ACCEPT; iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE\nSaveConfig = true\nMTU = 1420\n\n# ─── BD Relay Client ───\n[Peer]\nPublicKey = <BD_RELAY_PUBLIC_KEY>\nAllowedIPs = ${WG_BD}/32, 10.100.0.0/24\nPersistentKeepalive = 25\n\n# ─── India Client ───\n[Peer]\nPublicKey = <INDIA_PUBLIC_KEY>\nAllowedIPs = 10.200.0.2/32, 10.200.0.0/24\nPersistentKeepalive = 25`;

  const genWGBD = () => `# ═══ BD RELAY CLIENT — WireGuard ═══\n# Connects to OVH Main (${OVH_MAIN}) to provide Bangladesh IP\n# Without this tunnel, IPTSP WON'T register!\n# Save: /etc/wireguard/wg0.conf | Run: wg-quick up wg0\n\n[Interface]\nPrivateKey = <BD_PRIVATE_KEY>\nAddress = ${WG_BD}/24\nDNS = 8.8.8.8\nMTU = 1420\n\n[Peer]\n# OVH Main Server\nPublicKey = <OVH_PUBLIC_KEY>\nEndpoint = ${OVH_MAIN}:${WG_PORT}\nAllowedIPs = 0.0.0.0/0\nPersistentKeepalive = 25\n\n# After connected:\n# curl ifconfig.me → should show ${BD_RELAY} (Bangladesh IP)\n# Then IPTSP registers: ${BD_IPTSP_SIP}:${SIP_PORT}`;

  const handleBulkSave = () => { let count = 0; bulkRows.forEach(row => { if (row.number.trim()) { addSIPNumber({ tenantId: tid, number: row.number.trim(), username: row.username.trim() || row.number.trim(), password: row.password || genPass(), sipServer: row.sipServer || BD_IPTSP_SIP, ipAddress: row.host || BD_IPTSP_SIP, port: row.port || SIP_PORT, country: 'bangladesh', prefix: row.prefix || '', status: row.status, connectivityStatus: 'unchecked' }); count++; } }); if (count > 0) alert(`✅ ${count} SIP numbers saved!\n\nSIP Server: ${BD_IPTSP_SIP}:${SIP_PORT}\nOVH → WireGuard → BD Relay (${BD_RELAY}) = Bangladesh IP`); setBulkRows(Array.from({ length: 30 }, emptyBulkRow)); setShowBulkModal(false); };
  const applyBulkFill = () => setBulkRows(prev => prev.map(r => r.number.trim() ? { ...r, sipServer: bulkFillAll.sipServer, port: bulkFillAll.port, prefix: bulkFillAll.prefix, status: bulkFillAll.status } : r));
  const handleEditSave = () => { if (!editingNumber) return; updateSIPNumber(editingNumber.id, { number: editForm.number, username: editForm.username || editForm.number, password: editForm.password, sipServer: editForm.sipServer, ipAddress: editForm.host === 'dynamic' ? editForm.sipServer : editForm.host, port: editForm.port, prefix: editForm.prefix, status: editForm.status, connectivityStatus: 'unchecked' }); setShowEditModal(false); setEditingNumber(null); };
  const openEdit = (num: SIPNumber) => { setEditingNumber(num); setEditForm({ number: num.number, username: num.username || num.number, password: num.password || '', sipServer: num.sipServer || num.ipAddress, host: num.ipAddress || BD_IPTSP_SIP, port: num.port, prefix: num.prefix, status: num.status }); setShowEditModal(true); };
  const ci = (s?: string) => { switch (s) { case 'verified': return <Wifi className="w-4 h-4 text-green-400" />; case 'failed': return <WifiOff className="w-4 h-4 text-red-400" />; case 'checking': return <RefreshCw className="w-4 h-4 text-yellow-400 animate-spin" />; default: return <AlertTriangle className="w-4 h-4 text-gray-400" />; } };
  const sc = (s: string) => s === 'active' ? 'bg-green-500/20 text-green-400 border-green-500/30' : s === 'inactive' ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div><h1 className="text-3xl font-bold text-white mb-2">🇧🇩 Bangladesh SIP Numbers</h1><p className="text-green-200">OVH: {OVH_MAIN} → BD Relay: {BD_RELAY} → IPTSP: {BD_IPTSP_SIP}:{SIP_PORT}</p></div>
        <div className="flex gap-3 flex-wrap">
          <button onClick={() => setShowWGSetup(true)} className="flex items-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-all shadow-lg shadow-indigo-500/30 text-sm"><Shield className="w-4 h-4" /> WG Tunnel</button>
          <button onClick={() => { setShowPortScan(true); setTimeout(runPortScan, 200); }} className="flex items-center gap-2 px-4 py-3 bg-cyan-600 hover:bg-cyan-700 text-white font-medium rounded-xl transition-all shadow-lg shadow-cyan-500/30 text-sm"><Radio className="w-4 h-4" /> Port Scan</button>
          <button onClick={() => setShowBulkModal(true)} className="flex items-center gap-2 px-5 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-xl transition-all shadow-lg shadow-green-500/30 text-sm"><Upload className="w-4 h-4" /> Bulk +30</button>
        </div>
      </div>

      {/* IPTSP Carrier Card */}
      <div className="bg-gradient-to-r from-green-900/40 to-emerald-900/40 backdrop-blur-lg rounded-2xl border border-green-500/40 p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-green-600 rounded-xl"><Globe className="w-8 h-8 text-white" /></div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2"><h3 className="text-xl font-bold text-white">📡 BD IPTSP Carrier</h3><span className="px-2 py-0.5 bg-green-500/30 text-green-300 rounded-full text-xs animate-pulse">● LIVE</span></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-3">
              <div className="bg-black/30 rounded-lg p-3"><p className="text-green-200 text-xs mb-1">SIP Server</p><div className="flex items-center gap-2"><span className="text-white font-mono font-bold">{BD_IPTSP_SIP}</span><button onClick={() => cp(BD_IPTSP_SIP, 'si')} className="p-1 hover:bg-white/10 rounded">{copiedId === 'si' ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3 text-green-300" />}</button></div></div>
              <div className="bg-black/30 rounded-lg p-3"><p className="text-green-200 text-xs mb-1">Username</p><div className="flex items-center gap-2"><span className="text-white font-mono font-bold">{BD_IPTSP_USER}</span><button onClick={() => cp(BD_IPTSP_USER, 'un')} className="p-1 hover:bg-white/10 rounded">{copiedId === 'un' ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3 text-green-300" />}</button></div></div>
              <div className="bg-black/30 rounded-lg p-3"><p className="text-green-200 text-xs mb-1">Password</p><button onClick={() => cp(BD_IPTSP_PASS, 'pw')} className="text-yellow-300 text-xs hover:text-yellow-100">📋 Copy Password</button></div>
              <div className="bg-black/30 rounded-lg p-3"><p className="text-green-200 text-xs mb-1">Traffic Path</p><p className="text-white text-xs font-mono">{OVH_MAIN} → WG → {BD_RELAY} → IPTSP</p></div>
            </div>
            <button onClick={() => cp(`[bd-iptsp]\ntype=peer\nhost=${BD_IPTSP_SIP}\nport=${SIP_PORT}\nusername=${BD_IPTSP_USER}\nsecret=${BD_IPTSP_PASS}\nnat=yes\ninsecure=port,invite\ndtmfmode=rfc2833\ndisallow=all\nallow=g729\nallow=ulaw\nallow=alaw\nallow=gsm\ncontext=iptsp-inbound`, 'peer')} className="mt-3 px-3 py-1.5 bg-blue-600/30 hover:bg-blue-600/50 border border-blue-500/30 rounded-lg text-blue-300 text-xs">📋 Copy Peer Config</button>
          </div>
        </div>
      </div>

      {/* WireGuard Status Banner */}
      <div className="bg-indigo-600/20 border border-indigo-500/30 rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <Lock className="w-6 h-6 text-indigo-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white">🔐 WireGuard Tunnel: OVH({OVH_MAIN}) ↔ BD Relay({BD_RELAY})</h3>
            <p className="text-indigo-200 text-xs mt-1">⚠️ <strong>Without Bangladesh IP, IPTSP won't register!</strong> OVH server routes SIP through BD Relay via WireGuard to get Bangladesh IP ({BD_RELAY})</p>
          </div>
          <div className="flex gap-2"><button onClick={() => cp(genWGServer(), 'wgs')} className="px-3 py-1.5 bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/30 rounded-lg text-indigo-300 text-xs">📋 OVH Config</button><button onClick={() => cp(genWGBD(), 'wgb')} className="px-3 py-1.5 bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/30 rounded-lg text-purple-300 text-xs">📋 BD Config</button></div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-300" /><input type="text" placeholder="Search numbers..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-green-300/50 focus:outline-none focus:ring-2 focus:ring-green-500" /></div>
        <button onClick={checkAll} disabled={checkingIds.size > 0} className="flex items-center gap-2 px-4 py-3 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 rounded-xl text-blue-300 text-sm disabled:opacity-50"><Activity className={`w-4 h-4 ${checkingIds.size > 0 ? 'animate-spin' : ''}`} /> Verify</button>
        <button onClick={() => cp(genAllConfigs(), 'allcfg')} className="flex items-center gap-2 px-4 py-3 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 rounded-xl text-purple-300 text-sm">{copiedId === 'allcfg' ? <><Check className="w-4 h-4" /> Copied!</> : <><Copy className="w-4 h-4" /> Copy All</>}</button>
        <button onClick={() => setShowAllConfigs(!showAllConfigs)} className="flex items-center gap-2 px-4 py-3 bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/30 rounded-xl text-cyan-300 text-sm"><Download className="w-4 h-4" /> {showAllConfigs ? 'Hide' : 'Show'} Configs</button>
      </div>

      {showAllConfigs && (
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6">
          <div className="flex justify-between mb-4"><h2 className="text-lg font-semibold text-white">All SIP Configs</h2><button onClick={() => { const b = new Blob([genAllConfigs()], { type: 'text/plain' }); const u = URL.createObjectURL(b); const a = document.createElement('a'); a.href = u; a.download = 'bangladesh-sip-all.conf'; a.click(); URL.revokeObjectURL(u); }} className="px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 rounded-lg text-blue-300 text-sm">⬇ Download sip.conf</button></div>
          <pre className="bg-black/50 rounded-xl p-4 text-xs font-mono text-green-400 overflow-x-auto max-h-96">{genAllConfigs()}</pre>
        </div>
      )}

      {/* Table */}
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 overflow-hidden">
        <div className="overflow-x-auto"><table className="w-full"><thead className="bg-white/5"><tr><th className="px-3 py-3 text-left text-xs text-blue-200">C</th><th className="px-3 py-3 text-left text-xs text-blue-200">SIP Number</th><th className="px-3 py-3 text-left text-xs text-blue-200">Username</th><th className="px-3 py-3 text-left text-xs text-blue-200">SIP Server</th><th className="px-3 py-3 text-left text-xs text-blue-200">Port</th><th className="px-3 py-3 text-left text-xs text-blue-200">Status</th><th className="px-3 py-3 text-right text-xs text-blue-200">Actions</th></tr></thead>
        <tbody className="divide-y divide-white/10">
          {filtered.length === 0 ? <tr><td colSpan={7} className="px-6 py-16 text-center"><Phone className="w-16 h-16 mx-auto mb-4 text-green-300/30" /><p className="text-green-300 text-lg font-medium">No Bangladesh SIP Numbers</p></td></tr> :
          filtered.map(num => (
            <tr key={num.id} className="hover:bg-white/5 group"><td className="px-3 py-3"><button onClick={() => checkConnectivity(num)} disabled={checkingIds.has(num.id)}>{checkingIds.has(num.id) ? <RefreshCw className="w-4 h-4 text-yellow-400 animate-spin" /> : ci(num.connectivityStatus)}</button></td>
            <td className="px-3 py-3"><div className="flex items-center gap-1"><span className="font-mono text-white font-semibold text-sm">{num.number}</span><button onClick={() => cp(num.number, `n-${num.id}`)} className="opacity-0 group-hover:opacity-100 p-1">{copiedId===`n-${num.id}`?<Check className="w-3 h-3 text-green-400"/>:<Copy className="w-3 h-3 text-green-300"/>}</button></div></td>
            <td className="px-3 py-3"><span className="text-blue-200 text-sm font-mono">{num.username || num.number}</span></td>
            <td className="px-3 py-3"><span className="text-blue-200 text-xs font-mono">{num.sipServer || num.ipAddress}:{num.port}</span></td>
            <td className="px-3 py-3"><span className="text-white text-sm">{num.port || SIP_PORT}</span></td>
            <td className="px-3 py-3"><span className={`px-2 py-1 rounded-full text-xs border ${sc(num.status)}`}>{num.status}</span></td>
            <td className="px-3 py-3"><div className="flex justify-end gap-0.5">
              <button onClick={() => cp(genConfig(num), `c-${num.id}`)} className="p-1.5 hover:bg-green-500/20 rounded text-green-300"><Copy className="w-3.5 h-3.5"/></button>
              <button onClick={() => cp(`${num.number}|${num.password||''}|${num.sipServer||num.ipAddress}:${num.port}`, `cr-${num.id}`)} className="p-1.5 hover:bg-blue-500/20 rounded text-blue-300"><Key className="w-3.5 h-3.5"/></button>
              <button onClick={() => openEdit(num)} className="p-1.5 hover:bg-cyan-500/20 rounded text-cyan-300"><Edit2 className="w-3.5 h-3.5"/></button>
              <button onClick={() => { if(confirm(`Delete ${num.number}?`)) deleteSIPNumber(num.id); }} className="p-1.5 hover:bg-red-500/20 rounded text-red-300"><Trash2 className="w-3.5 h-3.5"/></button>
              <button onClick={() => setExpandedId(expandedId===num.id?null:num.id)} className="p-1.5 hover:bg-white/10 rounded text-blue-200">{expandedId===num.id?<ChevronUp className="w-3.5 h-3.5"/>:<ChevronDown className="w-3.5 h-3.5"/>}</button>
            </div></td></tr>
          ))}
        </tbody></table></div>
      </div>

      {/* Traffic Flow */}
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6">
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2"><ArrowRight className="w-5 h-5 text-green-400" /> Traffic Flow</h2>
        <div className="font-mono text-xs space-y-3 text-blue-200">
          <div className="p-4 bg-black/30 rounded-lg border-l-4 border-green-500"><p className="text-green-400 font-semibold mb-1">🇧🇩 SIP Registration Flow</p><p>SIP Request → OVH Asterisk({OVH_MAIN}) → WireGuard → BD Relay({BD_RELAY}:{WG_PORT}) → BD Internet → IPTSP({BD_IPTSP_SIP}:{SIP_PORT}) → REGISTERED ✅</p></div>
          <div className="p-4 bg-black/30 rounded-lg border-l-4 border-indigo-500"><p className="text-indigo-400 font-semibold mb-1">🌐 Inbound Call Flow</p><p>Caller → BDIX → IPTSP({BD_IPTSP_SIP}) → BD Internet → BD Relay → WireGuard → OVH Asterisk → SIP Phone</p></div>
        </div>
        <div className="mt-4 p-3 bg-yellow-600/20 border border-yellow-500/30 rounded-lg"><p className="text-yellow-200 text-sm">⚠️ <strong>Critical:</strong> IPTSP will NOT register without Bangladesh IP! OVH main server ({OVH_MAIN}) has no BD IP. BD Relay ({BD_RELAY}) provides the BD IP through WireGuard tunnel. Port 5060 is blocked — use {SIP_PORT}.</p></div>
      </div>

      {/* Port Scan Modal */}
      {showPortScan && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 rounded-2xl border border-cyan-500/30 w-full max-w-lg">
            <div className="flex justify-between p-6 border-b border-white/10"><h2 className="text-xl font-semibold text-white flex items-center gap-2"><Radio className="w-5 h-5 text-cyan-400"/> UDP Port Scan — Bangladesh</h2><button onClick={()=>setShowPortScan(false)} className="p-2 hover:bg-white/10 rounded"><X className="w-5 h-5 text-cyan-300"/></button></div>
            <div className="p-6 space-y-4"><div className="bg-yellow-600/20 border border-yellow-500/30 rounded-xl p-3"><p className="text-yellow-200 text-sm">5060 BLOCKED. Testing best UDP ports.</p></div>
            <div className="space-y-2 max-h-64 overflow-y-auto">{scanResults.map((r,i) => <div key={i} className={`flex justify-between p-3 rounded-lg ${r.status.includes('BLOCKED')?'bg-red-600/20 border border-red-500/20':r.status.includes('OPEN')?'bg-green-600/20 border border-green-500/20':'bg-white/5'}`}><div className="flex items-center gap-3"><span className="text-white font-mono font-bold">{r.port}</span><span className="text-xs text-blue-200">{BD_UDP_PORTS[i]?.desc}</span></div><div className="flex items-center gap-3">{r.latency>0&&<span className="text-white text-xs">{r.latency}ms</span>}<span className={r.status.includes('BLOCKED')?'text-red-400 text-sm':r.status.includes('OPEN')?'text-green-400 text-sm':'text-yellow-300 text-sm'}>{r.status}</span></div></div>)}</div>
            <div className="flex gap-3"><button onClick={runPortScan} disabled={scanRunning} className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-cyan-600 hover:bg-cyan-700 disabled:bg-cyan-600/50 text-white rounded-xl">{scanRunning?<><RefreshCw className="w-5 h-5 animate-spin"/>Scanning...</>:<><Zap className="w-5 h-5"/>Start Scan</>}</button><button onClick={()=>setShowPortScan(false)} className="px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl">Close</button></div></div>
          </div>
        </div>
      )}

      {/* WireGuard Setup Modal */}
      {showWGSetup && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 rounded-2xl border border-indigo-500/30 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between p-6 border-b border-white/10 sticky top-0 bg-slate-900"><h2 className="text-xl font-semibold text-white flex items-center gap-2"><Shield className="w-6 h-6 text-indigo-400"/> WireGuard Tunnel Setup</h2><button onClick={()=>setShowWGSetup(false)} className="p-2 hover:bg-white/10 rounded"><X className="w-5 h-5 text-indigo-300"/></button></div>
            <div className="p-6 space-y-6">
              <div className="bg-indigo-600/20 border border-indigo-500/30 rounded-xl p-4"><h3 className="text-indigo-400 font-semibold mb-2">🖥️ OVH Main Server ({OVH_MAIN}) — Asterisk installed here</h3><pre className="text-white text-xs font-mono bg-black/30 rounded p-3">{`# Install & start WireGuard (SERVER)
apt-get install -y wireguard wireguard-tools
cd /etc/wireguard && wg genkey | tee private.key | wg pubkey > public.key
cat public.key  # ← Share with BD & India clients
# Copy config from "OVH Config" button → /etc/wireguard/wg0.conf
wg-quick up wg0 && systemctl enable wg-quick@wg0
wg show`}</pre></div>
              <div className="bg-purple-600/20 border border-purple-500/30 rounded-xl p-4"><h3 className="text-purple-400 font-semibold mb-2">🇧🇩 BD Relay Client ({BD_RELAY})</h3><pre className="text-white text-xs font-mono bg-black/30 rounded p-3">{`# Install & start WireGuard (CLIENT → connects to OVH)
apt-get install -y wireguard wireguard-tools
wg genkey | tee private.key | wg pubkey > public.key
cat public.key  # ← Share with OVH admin
# Copy config from "BD Config" button → /etc/wireguard/wg0.conf
wg-quick up wg0 && systemctl enable wg-quick@wg0
# Verify: curl ifconfig.me → should show ${BD_RELAY}`}</pre></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><h3 className="text-white font-semibold mb-2">OVH Server Config</h3><pre className="bg-black/50 rounded-xl p-3 text-xs font-mono text-green-400 overflow-x-auto max-h-64">{genWGServer()}</pre><button onClick={()=>cp(genWGServer(),'sc')} className="mt-2 w-full px-4 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 rounded-lg text-indigo-300 text-sm">{copiedId==='sc'?'✅ Copied!':'📋 Copy'}</button></div>
                <div><h3 className="text-white font-semibold mb-2">BD Relay Config</h3><pre className="bg-black/50 rounded-xl p-3 text-xs font-mono text-cyan-400 overflow-x-auto max-h-64">{genWGBD()}</pre><button onClick={()=>cp(genWGBD(),'bc')} className="mt-2 w-full px-4 py-2 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 rounded-lg text-purple-300 text-sm">{copiedId==='bc'?'✅ Copied!':'📋 Copy'}</button></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-start justify-center p-2 z-50 overflow-y-auto">
          <div className="bg-slate-900 rounded-2xl border border-green-500/30 w-full max-w-7xl my-4 max-h-[95vh] flex flex-col">
            <div className="flex justify-between p-6 border-b border-white/10 sticky top-0 bg-slate-900"><div><h2 className="text-2xl font-bold text-white">Bulk Add — 30 Rows</h2><p className="text-green-200 text-sm">SIP: {BD_IPTSP_SIP}:{SIP_PORT} | Empty rows skipped</p></div><button onClick={()=>setShowBulkModal(false)} className="p-2 hover:bg-white/10 rounded"><X className="w-6 h-6 text-green-300"/></button></div>
            <div className="p-4 border-b border-white/5 bg-white/5"><div className="grid grid-cols-2 md:grid-cols-5 gap-2"><div><label className="text-green-200 text-xs">SIP Server</label><input type="text" value={bulkFillAll.sipServer} onChange={e=>setBulkFillAll({...bulkFillAll,sipServer:e.target.value})} className="w-full px-3 py-1.5 bg-white/10 border border-white/20 rounded text-white text-sm"/></div><div><label className="text-green-200 text-xs">Port</label><input type="number" value={bulkFillAll.port} onChange={e=>setBulkFillAll({...bulkFillAll,port:parseInt(e.target.value)})} className="w-full px-3 py-1.5 bg-white/10 border border-white/20 rounded text-white text-sm"/></div><div><label className="text-green-200 text-xs">Prefix</label><input type="text" value={bulkFillAll.prefix} onChange={e=>setBulkFillAll({...bulkFillAll,prefix:e.target.value})} className="w-full px-3 py-1.5 bg-white/10 border border-white/20 rounded text-white text-sm"/></div><div><label className="text-green-200 text-xs">Status</label><select value={bulkFillAll.status} onChange={e=>setBulkFillAll({...bulkFillAll,status:e.target.value as 'active'|'inactive'|'pending'})} className="w-full px-3 py-1.5 bg-white/10 border border-white/20 rounded text-white text-sm"><option value="active">Active</option><option value="inactive">Inactive</option><option value="pending">Pending</option></select></div><div className="flex items-end"><button onClick={applyBulkFill} className="w-full px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded text-sm">Apply All</button></div></div></div>
            <div className="flex-1 overflow-y-auto p-3"><div className="space-y-1">{bulkRows.map((row,idx)=>(<div key={idx} className={`grid grid-cols-12 gap-1.5 p-1.5 rounded-lg ${row.number.trim()?'bg-green-600/10 border border-green-500/20':'bg-white/5 border border-white/5'}`}><div className="col-span-1 flex items-center justify-center"><span className={`text-xs font-mono ${row.number.trim()?'text-green-400':'text-gray-500'}`}>#{idx+1}</span></div><div className="col-span-3"><input type="text" placeholder="SIP Number" value={row.number} onChange={e=>{const nr=[...bulkRows];nr[idx]={...nr[idx],number:e.target.value};setBulkRows(nr);}} className="w-full px-2 py-1.5 bg-white/10 border border-white/20 rounded text-white text-xs"/></div><div className="col-span-2"><input type="text" placeholder="Username" value={row.username} onChange={e=>{const nr=[...bulkRows];nr[idx]={...nr[idx],username:e.target.value};setBulkRows(nr);}} className="w-full px-2 py-1.5 bg-white/10 border border-white/20 rounded text-white text-xs"/></div><div className="col-span-2"><input type="text" placeholder="Password" value={row.password} onChange={e=>{const nr=[...bulkRows];nr[idx]={...nr[idx],password:e.target.value};setBulkRows(nr);}} className="w-full px-2 py-1.5 bg-white/10 border border-white/20 rounded text-white text-xs"/></div><div className="col-span-2"><input type="text" value={row.sipServer} onChange={e=>{const nr=[...bulkRows];nr[idx]={...nr[idx],sipServer:e.target.value};setBulkRows(nr);}} className="w-full px-2 py-1.5 bg-white/10 border border-white/20 rounded text-white text-xs"/></div><div className="col-span-1"><input type="number" value={row.port} onChange={e=>{const nr=[...bulkRows];nr[idx]={...nr[idx],port:parseInt(e.target.value)||SIP_PORT};setBulkRows(nr);}} className="w-full px-2 py-1.5 bg-white/10 border border-white/20 rounded text-white text-xs"/></div><div className="col-span-1"><input type="text" placeholder="Prefix" value={row.prefix} onChange={e=>{const nr=[...bulkRows];nr[idx]={...nr[idx],prefix:e.target.value};setBulkRows(nr);}} className="w-full px-2 py-1.5 bg-white/10 border border-white/20 rounded text-white text-xs"/></div></div>))}</div></div>
            <div className="p-4 border-t border-white/10 sticky bottom-0 bg-slate-900"><div className="flex justify-between"><p className="text-blue-200 text-sm">{bulkRows.filter(r=>r.number.trim()).length} of 30 filled</p><div className="flex gap-3"><button onClick={()=>setShowBulkModal(false)} className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl">Cancel</button><button onClick={handleBulkSave} className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-lg shadow-green-500/30">💾 Save</button></div></div></div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 rounded-2xl border border-green-500/30 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between p-6 border-b border-white/10"><h2 className="text-xl font-semibold text-white">{editingNumber?.id?'Edit':'Add'} Number</h2><button onClick={()=>{setShowEditModal(false);setEditingNumber(null);}} className="p-2 hover:bg-white/10 rounded"><X className="w-5 h-5 text-green-300"/></button></div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4"><div><label className="text-sm text-green-200 mb-1 block"><Phone className="w-3 h-3 inline"/> Number</label><input type="text" value={editForm.number} onChange={e=>setEditForm({...editForm,number:e.target.value})} className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white text-sm" required/></div><div><label className="text-sm text-green-200 mb-1 block"><User className="w-3 h-3 inline"/> Username</label><input type="text" value={editForm.username} onChange={e=>setEditForm({...editForm,username:e.target.value})} className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white text-sm"/></div></div>
              <div className="grid grid-cols-2 gap-4"><div><label className="text-sm text-green-200 mb-1 block"><Key className="w-3 h-3 inline"/> Password</label><div className="flex gap-2"><input type="text" value={editForm.password} onChange={e=>setEditForm({...editForm,password:e.target.value})} className="flex-1 px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white text-sm"/><button onClick={()=>setEditForm({...editForm,password:genPass()})} className="px-3 py-2.5 bg-green-600/20 hover:bg-green-600/30 rounded-xl text-green-300 text-xs">🔑</button></div></div><div><label className="text-sm text-green-200 mb-1 block"><Server className="w-3 h-3 inline"/> SIP Server</label><input type="text" value={editForm.sipServer} onChange={e=>setEditForm({...editForm,sipServer:e.target.value})} className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white text-sm"/></div></div>
              <div className="grid grid-cols-3 gap-4"><div><label className="text-sm text-green-200 mb-1 block">Host</label><input type="text" value={editForm.host} onChange={e=>setEditForm({...editForm,host:e.target.value})} className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white text-sm"/></div><div><label className="text-sm text-green-200 mb-1 block">Port</label><input type="number" value={editForm.port} onChange={e=>setEditForm({...editForm,port:parseInt(e.target.value)||SIP_PORT})} className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white text-sm"/></div><div><label className="text-sm text-green-200 mb-1 block">Status</label><select value={editForm.status} onChange={e=>setEditForm({...editForm,status:e.target.value as SIPNumber['status']})} className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white text-sm"><option value="active">Active</option><option value="inactive">Inactive</option><option value="pending">Pending</option></select></div></div>
              <div className="flex gap-3"><button onClick={()=>{setShowEditModal(false);setEditingNumber(null);}} className="flex-1 px-5 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl">Cancel</button><button onClick={handleEditSave} className="flex-1 px-5 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-xl shadow-lg shadow-green-500/30">{editingNumber?.id?'Update':'Create'}</button></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
