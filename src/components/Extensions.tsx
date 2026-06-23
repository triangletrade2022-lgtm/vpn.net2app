import { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { Extension } from '../types';
import { Plus, Edit2, Trash2, Copy, Check, Search, X, Phone, Key, User, Network } from 'lucide-react';

export default function Extensions() {
  const { extensions, addExtension, updateExtension, deleteExtension } = useData();
  const { user, activeTenantId } = useAuth();
  const tid = user?.tenantId || activeTenantId || '';

  // Add useAuth import
  // Fix addExtension to include tenantId
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Extension | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [form, setForm] = useState({
    extension: '', name: '', password: '', email: '',
    context: 'bangladesh-inbound' as Extension['context'], nat: true, qualify: true,
    dtmfMode: 'rfc2833' as Extension['dtmfMode'], transport: 'udp' as Extension['transport'],
    status: 'active' as Extension['status'],
    g729: false, g711ulaw: true, g711alaw: true, gsm: false,
    callerid: '', maxContacts: 2,
  });

  const buildExtCodecs = (): string[] => {
    const a: string[] = [];
    if (form.g729) a.push('g729');
    if (form.g711ulaw) a.push('ulaw');
    if (form.g711alaw) a.push('alaw');
    if (form.gsm) a.push('gsm');
    return a.length ? a : ['ulaw', 'alaw'];
  };

  const filtered = extensions.filter(e =>
    e.extension.includes(searchTerm) || e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.callerid.includes(searchTerm));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const codecs = buildExtCodecs();
    const data = { ...form, codecs, callerid: form.callerid || `"${form.name}" <${form.extension}>` };
    editing ? updateExtension(editing.id, data) : addExtension({ ...data, tenantId: tid });
    closeModal();
  };

  const parseExtCodecs = (raw: string[]) => ({
    g729: raw.includes('g729'), g711ulaw: raw.includes('ulaw'),
    g711alaw: raw.includes('alaw'), gsm: raw.includes('gsm'),
  });

  const openModal = (ext?: Extension) => {
    if (ext) {
      setEditing(ext);
      const cd = parseExtCodecs(ext.codecs || []);
      setForm({ extension: ext.extension, name: ext.name, password: ext.password, email: ext.email || '',
        context: ext.context, nat: ext.nat, qualify: ext.qualify, dtmfMode: ext.dtmfMode,
        transport: ext.transport, status: ext.status, ...cd, callerid: ext.callerid, maxContacts: ext.maxContacts });
    } else {
      setEditing(null);
      setForm({ extension: '', name: '', password: '', email: '', context: 'bangladesh-inbound',
        nat: true, qualify: true, dtmfMode: 'rfc2833', transport: 'udp', status: 'active',
        g729: false, g711ulaw: true, g711alaw: true, gsm: false, callerid: '', maxContacts: 2 });
    }
    setShowModal(true);
  };

  const closeModal = () => { setShowModal(false); setEditing(null); };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text); setCopiedId(id); setTimeout(() => setCopiedId(null), 2000);
  };

  const getStatusColor = (s: string) => s === 'active' ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30';

  const generateExtConfig = (ext: Extension) => `[${ext.extension}](endpoint-template)
auth=auth${ext.extension}
aors=aor${ext.extension}
callerid=${ext.callerid || `"${ext.name}" <${ext.extension}>`}

[auth${ext.extension}](auth-basic)
username=${ext.extension}
password=${ext.password}

[aor${ext.extension}](aor-dynamic)
max_contacts=${ext.maxContacts}
`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">📞 Extensions</h1>
          <p className="text-blue-200">Internal extensions for making and receiving calls through IPTSP</p>
        </div>
        <button onClick={() => openModal()} className="flex items-center gap-2 px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white font-medium rounded-xl transition-all shadow-lg shadow-cyan-500/30">
          <Plus className="w-5 h-5" /> Add Extension
        </button>
      </div>

      <div className="bg-cyan-600/20 border border-cyan-500/30 rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <Phone className="w-8 h-8 text-cyan-400 flex-shrink-0" />
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">Extension Management</h3>
            <p className="text-cyan-200 text-sm">
              Extensions are internal numbers used by staff to make and receive calls. Each extension has a number, password,
              and can be configured for different contexts (Bangladesh Inbound or India Outbound). Extensions register through
              the WireGuard tunnel to reach the Asterisk server.
            </p>
          </div>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-cyan-300" />
        <input type="text" placeholder="Search by extension number or name..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-cyan-300/50 focus:outline-none focus:ring-2 focus:ring-cyan-500" />
      </div>

      <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-blue-200">Extension</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-blue-200">Name</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-blue-200">Context</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-blue-200">Codecs</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-blue-200">Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-blue-200">Password</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-blue-200">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-blue-300">
                  <Phone className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No extensions found</p><p className="text-sm mt-2">Click "Add Extension" to create one</p>
                </td></tr>
              ) : filtered.map(ext => (
                <tr key={ext.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4"><span className="font-mono text-white text-lg">{ext.extension}</span></td>
                  <td className="px-6 py-4"><span className="text-white">{ext.name}</span></td>
                  <td className="px-6 py-4"><span className={`px-3 py-1 rounded-full text-xs font-medium ${ext.context === 'bangladesh-inbound' ? 'bg-green-500/20 text-green-400' : 'bg-orange-500/20 text-orange-400'}`}>{ext.context}</span></td>
                  <td className="px-6 py-4"><div className="flex gap-1">{ext.codecs.map(c => <span key={c} className="px-2 py-1 bg-white/10 rounded text-xs text-blue-200 font-mono">{c}</span>)}</div></td>
                  <td className="px-6 py-4"><span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(ext.status)}`}>{ext.status}</span></td>
                  <td className="px-6 py-4"><div className="flex items-center gap-2">
                    <span className="font-mono text-blue-200">••••••</span>
                    <button onClick={() => copyToClipboard(ext.password, `p-${ext.id}`)} className="p-1 hover:bg-white/10 rounded">
                      {copiedId === `p-${ext.id}` ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-blue-300" />}
                    </button>
                  </div></td>
                  <td className="px-6 py-4"><div className="flex items-center justify-end gap-2">
                    <button onClick={() => { copyToClipboard(generateExtConfig(ext), `c-${ext.id}`); }} className="p-2 hover:bg-cyan-500/20 rounded-lg text-cyan-300" title="Copy PJSIP Config"><Copy className="w-4 h-4" /></button>
                    <button onClick={() => openModal(ext)} className="p-2 hover:bg-blue-500/20 rounded-lg text-blue-300"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => { if (confirm('Delete extension ' + ext.extension + '?')) deleteExtension(ext.id); }} className="p-2 hover:bg-red-500/20 rounded-lg text-red-300"><Trash2 className="w-4 h-4" /></button>
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 rounded-2xl border border-cyan-500/30 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <h2 className="text-xl font-semibold text-white">{editing ? 'Edit Extension' : 'Add New Extension'}</h2>
              <button onClick={closeModal} className="p-2 hover:bg-white/10 rounded-lg"><X className="w-5 h-5 text-cyan-300" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-cyan-200 mb-2"><Key className="w-4 h-4 inline mr-1" />Extension Number</label>
                  <input type="text" value={form.extension} onChange={e => setForm({ ...form, extension: e.target.value })}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-cyan-300/50 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    placeholder="e.g., 2001" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-cyan-200 mb-2"><User className="w-4 h-4 inline mr-1" />Display Name</label>
                  <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-cyan-300/50 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    placeholder="e.g., Office Desk 1" required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-cyan-200 mb-2">Password</label>
                  <input type="text" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-cyan-300/50 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    placeholder="Auto if empty" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-cyan-200 mb-2">Email (Voicemail)</label>
                  <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-cyan-300/50 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    placeholder="optional" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-cyan-200 mb-2">Context</label>
                  <select value={form.context} onChange={e => setForm({ ...form, context: e.target.value as Extension['context'] })}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500">
                    <option value="bangladesh-inbound">Bangladesh Inbound</option>
                    <option value="india-outbound">India Outbound</option>
                    <option value="default">Default</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-cyan-200 mb-2">Status</label>
                  <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as 'active' | 'inactive' })}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500">
                    <option value="active">Active</option><option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-cyan-200 mb-2"><Network className="w-4 h-4 inline mr-1" />Transport</label>
                  <select value={form.transport} onChange={e => setForm({ ...form, transport: e.target.value as 'udp' | 'tcp' | 'tls' })}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500">
                    <option value="udp">UDP</option><option value="tcp">TCP</option><option value="tls">TLS</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-cyan-200 mb-2">DTMF Mode</label>
                  <select value={form.dtmfMode} onChange={e => setForm({ ...form, dtmfMode: e.target.value as 'rfc2833' | 'info' | 'auto' })}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500">
                    <option value="rfc2833">RFC2833</option><option value="info">SIP INFO</option><option value="auto">Auto</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-cyan-200 mb-2">Caller ID</label>
                <input type="text" value={form.callerid} onChange={e => setForm({ ...form, callerid: e.target.value })}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-cyan-300/50 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  placeholder='Auto: "Name" <Extension>' />
              </div>
              <div>
                <label className="block text-sm font-medium text-cyan-200 mb-2">Max Contacts</label>
                <input type="number" value={form.maxContacts} onChange={e => setForm({ ...form, maxContacts: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500" />
              </div>
              {/* ──── CODEC SELECTION ──── */}
              <div className="border-t border-white/10 pt-4">
                <label className="block text-sm font-medium text-cyan-200 mb-3">🎵 Codecs (Inbound & Outbound)</label>
                <div className="grid grid-cols-2 gap-2">
                  <label className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer border ${form.g729 ? 'bg-green-600/20 border-green-500/40' : 'bg-white/5 border-white/10'}`}>
                    <input type="checkbox" checked={form.g729} onChange={e => setForm({...form,g729:e.target.checked})} className="w-4 h-4 rounded accent-green-500" />
                    <div><span className="text-white text-xs font-semibold">G.729</span><p className="text-green-200 text-xs">8 kbps</p></div>
                  </label>
                  <label className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer border ${form.g711ulaw ? 'bg-blue-600/20 border-blue-500/40' : 'bg-white/5 border-white/10'}`}>
                    <input type="checkbox" checked={form.g711ulaw} onChange={e => setForm({...form,g711ulaw:e.target.checked})} className="w-4 h-4 rounded accent-blue-500" />
                    <div><span className="text-white text-xs font-semibold">G.711 μ-law</span><p className="text-blue-200 text-xs">64 kbps</p></div>
                  </label>
                  <label className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer border ${form.g711alaw ? 'bg-blue-600/20 border-blue-500/40' : 'bg-white/5 border-white/10'}`}>
                    <input type="checkbox" checked={form.g711alaw} onChange={e => setForm({...form,g711alaw:e.target.checked})} className="w-4 h-4 rounded accent-blue-500" />
                    <div><span className="text-white text-xs font-semibold">G.711 A-law</span><p className="text-blue-200 text-xs">64 kbps</p></div>
                  </label>
                  <label className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer border ${form.gsm ? 'bg-purple-600/20 border-purple-500/40' : 'bg-white/5 border-white/10'}`}>
                    <input type="checkbox" checked={form.gsm} onChange={e => setForm({...form,gsm:e.target.checked})} className="w-4 h-4 rounded accent-purple-500" />
                    <div><span className="text-white text-xs font-semibold">GSM</span><p className="text-purple-200 text-xs">13 kbps</p></div>
                  </label>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <label className="flex items-center gap-3 p-4 bg-white/5 rounded-xl cursor-pointer hover:bg-white/10">
                  <input type="checkbox" checked={form.nat} onChange={e => setForm({ ...form, nat: e.target.checked })}
                    className="w-5 h-5 rounded bg-white/10 border-white/20 text-cyan-600 focus:ring-cyan-500" />
                  <span className="text-cyan-200">NAT Support</span>
                </label>
                <label className="flex items-center gap-3 p-4 bg-white/5 rounded-xl cursor-pointer hover:bg-white/10">
                  <input type="checkbox" checked={form.qualify} onChange={e => setForm({ ...form, qualify: e.target.checked })}
                    className="w-5 h-5 rounded bg-white/10 border-white/20 text-cyan-600 focus:ring-cyan-500" />
                  <span className="text-cyan-200">Qualify (Monitor)</span>
                </label>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={closeModal} className="flex-1 px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl">Cancel</button>
                <button type="submit" className="flex-1 px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white font-medium rounded-xl shadow-lg shadow-cyan-500/30">{editing ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
