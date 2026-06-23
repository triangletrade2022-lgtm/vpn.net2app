import { useState } from 'react';
import { useData } from '../contexts/DataContext';
import {
  Settings, MessageSquare, DollarSign, Send, Plus, Trash2,
  Search, Globe, Key, Activity, RefreshCw,
  Users, CheckCircle, Loader
} from 'lucide-react';

export default function AdminSms() {
  const { smsGateways, addSmsGateway, updateSmsGateway, deleteSmsGateway, smsPricing, addSmsPricing, updateSmsPricing, deleteSmsPricing, smsRecords, smsCampaigns, addSmsCampaign } = useData();
  const [activeTab, setActiveTab] = useState<'gateways' | 'pricing' | 'blast' | 'logs'>('gateways');
  const [searchTerm, setSearchTerm] = useState('');

  // ── Gateway Form ──
  const [showGatewayForm, setShowGatewayForm] = useState(false);
  const [gwForm, setGwForm] = useState({ provider: 'net2app' as 'net2app' | 'custom', name: '', apiEndpoint: 'https://api.net2app.com/v1/sms/send', apiKey: '', senderId: '', enabled: true, defaultCountry: 'bangladesh' });

  // ── Pricing Form ──
  const [showPricingForm, setShowPricingForm] = useState(false);
  const [prForm, setPrForm] = useState({ country: '', countryCode: '', ratePerSms: 0.02, enabled: true });

  // ── Blast Campaign ──
  const [showBlastForm, setShowBlastForm] = useState(false);
  const [blastForm, setBlastForm] = useState({ name: '', message: '', recipients: '' });
  const [sendingBlast, setSendingBlast] = useState(false);

  const handleAddGateway = () => {
    addSmsGateway(gwForm);
    setShowGatewayForm(false);
    setGwForm({ provider: 'net2app', name: '', apiEndpoint: 'https://api.net2app.com/v1/sms/send', apiKey: '', senderId: '', enabled: true, defaultCountry: 'bangladesh' });
  };

  const handleAddPricing = () => {
    addSmsPricing(prForm);
    setShowPricingForm(false);
    setPrForm({ country: '', countryCode: '', ratePerSms: 0.02, enabled: true });
  };

  const handleSendBlast = () => {
    const recipients = blastForm.recipients.split('\n').map(r => r.trim()).filter(Boolean);
    if (!recipients.length) return;
    setSendingBlast(true);
    setTimeout(() => {
      addSmsCampaign({
        name: blastForm.name,
        message: blastForm.message,
        recipients,
        totalRecipients: recipients.length,
        sentCount: recipients.length,
        failedCount: 0,
        status: 'completed',
        cost: recipients.length * 0.02,
        createdBy: 'Super Admin',
      });
      setSendingBlast(false);
      setShowBlastForm(false);
      setBlastForm({ name: '', message: '', recipients: '' });
    }, 1500);
  };

  const activeGateway = smsGateways.find(g => g.enabled);
  const filteredLogs = smsRecords.filter(r =>
    r.recipient.includes(searchTerm) || r.message.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const countryOptions = [
    { code: 'BD', name: 'Bangladesh', prefix: '+880' },
    { code: 'IN', name: 'India', prefix: '+91' },
    { code: 'PK', name: 'Pakistan', prefix: '+92' },
    { code: 'US', name: 'United States', prefix: '+1' },
    { code: 'GB', name: 'United Kingdom', prefix: '+44' },
    { code: 'AE', name: 'UAE', prefix: '+971' },
    { code: 'SA', name: 'Saudi Arabia', prefix: '+966' },
    { code: 'MY', name: 'Malaysia', prefix: '+60' },
    { code: 'SG', name: 'Singapore', prefix: '+65' },
    { code: 'AU', name: 'Australia', prefix: '+61' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <MessageSquare className="w-7 h-7 text-indigo-400" />
            SMS Management
          </h1>
          <p className="text-blue-200 text-sm mt-1">
            Configure SMS gateways, set pricing, send bulk campaigns, and view logs
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {([
          { key: 'gateways', label: 'Gateway Config', icon: Settings },
          { key: 'pricing', label: 'SMS Pricing', icon: DollarSign },
          { key: 'blast', label: 'Blast Campaign', icon: Send },
          { key: 'logs', label: 'SMS Logs', icon: Activity },
        ] as const).map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeTab === tab.key
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                : 'bg-white/5 text-blue-200 hover:bg-white/10 hover:text-white'
            }`}>
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ════════════ GATEWAY CONFIG ════════════ */}
      {activeTab === 'gateways' && (
        <div className="space-y-6">
          {/* Active Gateway Status */}
          <div className={`rounded-2xl p-6 border ${activeGateway ? 'bg-emerald-600/10 border-emerald-500/30' : 'bg-amber-600/10 border-amber-500/30'}`}>
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl ${activeGateway ? 'bg-emerald-600/20' : 'bg-amber-600/20'}`}>
                <Globe className={`w-8 h-8 ${activeGateway ? 'text-emerald-400' : 'text-amber-400'}`} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white">
                  {activeGateway ? '✅ SMS Gateway Active' : '⚠️ No Active Gateway'}
                </h3>
                <p className="text-sm text-blue-200">
                  {activeGateway
                    ? `${activeGateway.name} — ${activeGateway.apiEndpoint}`
                    : 'Add and enable a gateway to allow SMS sending from the client portal'}
                </p>
              </div>
            </div>
          </div>

          {/* Gateway List */}
          <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">SMS Gateways</h3>
              <button onClick={() => setShowGatewayForm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-xl transition-all">
                <Plus className="w-4 h-4" /> Add Gateway
              </button>
            </div>
            {smsGateways.length === 0 ? (
              <div className="p-8 text-center text-blue-300/60">
                <Key className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <p>No SMS gateways configured. Add your Net2App Hub credentials above.</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {smsGateways.map(gw => (
                  <div key={gw.id} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`w-2 h-2 rounded-full ${gw.enabled ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                      <div>
                        <p className="text-white font-medium">{gw.name}</p>
                        <p className="text-blue-200 text-xs font-mono">{gw.apiEndpoint}</p>
                        <p className="text-blue-300/60 text-xs mt-0.5">Sender: {gw.senderId || 'Not set'} · Default: {gw.defaultCountry}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => updateSmsGateway(gw.id, { enabled: !gw.enabled })}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${gw.enabled ? 'bg-emerald-600/20 text-emerald-400' : 'bg-slate-600/20 text-slate-400'}`}>
                        {gw.enabled ? 'Enabled' : 'Disabled'}
                      </button>
                      <button onClick={() => deleteSmsGateway(gw.id)}
                        className="p-2 hover:bg-red-500/10 rounded-lg text-red-400 transition-all">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add Gateway Modal */}
          {showGatewayForm && (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setShowGatewayForm(false)}>
              <div className="bg-slate-800 border border-white/10 rounded-2xl p-6 w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <h3 className="text-lg font-semibold text-white mb-4">Add SMS Gateway</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-blue-200 text-sm">Provider</label>
                    <select value={gwForm.provider} onChange={e => setGwForm({...gwForm, provider: e.target.value as any})}
                      className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm mt-1">
                      <option value="net2app">Net2App Hub</option>
                      <option value="custom">Custom API</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-blue-200 text-sm">Gateway Name</label>
                      <input value={gwForm.name} onChange={e => setGwForm({...gwForm, name: e.target.value})}
                        className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm mt-1" placeholder="Net2App Main" />
                    </div>
                    <div>
                      <label className="text-blue-200 text-sm">Sender ID</label>
                      <input value={gwForm.senderId} onChange={e => setGwForm({...gwForm, senderId: e.target.value})}
                        className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm mt-1" placeholder="VPNET" />
                    </div>
                  </div>
                  <div>
                    <label className="text-blue-200 text-sm">API Endpoint</label>
                    <input value={gwForm.apiEndpoint} onChange={e => setGwForm({...gwForm, apiEndpoint: e.target.value})}
                      className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm mt-1 font-mono" />
                  </div>
                  <div>
                    <label className="text-blue-200 text-sm">API Key</label>
                    <input value={gwForm.apiKey} onChange={e => setGwForm({...gwForm, apiKey: e.target.value})}
                      className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm mt-1 font-mono" type="password" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-blue-200 text-sm">Default Country</label>
                      <select value={gwForm.defaultCountry} onChange={e => setGwForm({...gwForm, defaultCountry: e.target.value})}
                        className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm mt-1">
                        {countryOptions.map(c => <option key={c.code} value={c.name.toLowerCase()}>{c.name} ({c.prefix})</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-blue-200 text-sm">Status</label>
                      <div className="flex gap-3 mt-2">
                        <button onClick={() => setGwForm({...gwForm, enabled: true})}
                          className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${gwForm.enabled ? 'bg-emerald-600 text-white' : 'bg-white/5 text-blue-200'}`}>Enabled</button>
                        <button onClick={() => setGwForm({...gwForm, enabled: false})}
                          className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${!gwForm.enabled ? 'bg-red-600 text-white' : 'bg-white/5 text-blue-200'}`}>Disabled</button>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-6 pt-4 border-t border-white/10">
                  <button onClick={handleAddGateway}
                    className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-all">
                    Add Gateway
                  </button>
                  <button onClick={() => setShowGatewayForm(false)}
                    className="px-6 py-3 bg-white/5 hover:bg-white/10 text-blue-200 rounded-xl transition-all">
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ════════════ SMS PRICING ════════════ */}
      {activeTab === 'pricing' && (
        <div className="space-y-4">
          <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">SMS Pricing per Country</h3>
              <button onClick={() => setShowPricingForm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-xl transition-all">
                <Plus className="w-4 h-4" /> Add Pricing
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-blue-200 text-sm border-b border-white/5">
                    <th className="p-4 font-medium">Country</th>
                    <th className="p-4 font-medium">Code</th>
                    <th className="p-4 font-medium">Rate/SMS</th>
                    <th className="p-4 font-medium">Status</th>
                    <th className="p-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {smsPricing.length === 0 ? (
                    <tr><td colSpan={5} className="p-8 text-center text-blue-300/60">No pricing configured. Add rates for countries you want to support.</td></tr>
                  ) : smsPricing.map(p => (
                    <tr key={p.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="p-4 text-white">{p.country}</td>
                      <td className="p-4 text-blue-200 font-mono">{p.countryCode}</td>
                      <td className="p-4 text-emerald-400 font-mono">${p.ratePerSms.toFixed(4)}</td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-lg text-xs font-medium ${p.enabled ? 'bg-emerald-600/20 text-emerald-400' : 'bg-slate-600/20 text-slate-400'}`}>
                          {p.enabled ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <button onClick={() => updateSmsPricing(p.id, { enabled: !p.enabled })}
                            className={`p-2 rounded-lg transition-all ${p.enabled ? 'text-red-400 hover:bg-red-500/10' : 'text-emerald-400 hover:bg-emerald-500/10'}`}>
                            {p.enabled ? 'Disable' : 'Enable'}
                          </button>
                          <button onClick={() => deleteSmsPricing(p.id)}
                            className="p-2 hover:bg-red-500/10 rounded-lg text-red-400 transition-all">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Add Pricing Modal */}
          {showPricingForm && (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setShowPricingForm(false)}>
              <div className="bg-slate-800 border border-white/10 rounded-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
                <h3 className="text-lg font-semibold text-white mb-4">Add SMS Pricing</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-blue-200 text-sm">Country</label>
                      <input value={prForm.country} onChange={e => setPrForm({...prForm, country: e.target.value})}
                        className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm mt-1" placeholder="Bangladesh" />
                    </div>
                    <div>
                      <label className="text-blue-200 text-sm">Country Code</label>
                      <input value={prForm.countryCode} onChange={e => setPrForm({...prForm, countryCode: e.target.value})}
                        className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm mt-1 font-mono" placeholder="BD" />
                    </div>
                  </div>
                  <div>
                    <label className="text-blue-200 text-sm">Rate per SMS ($)</label>
                    <input type="number" step="0.0001" value={prForm.ratePerSms} onChange={e => setPrForm({...prForm, ratePerSms: parseFloat(e.target.value) || 0})}
                      className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm mt-1 font-mono" />
                  </div>
                  <div>
                    <label className="text-blue-200 text-sm">Status</label>
                    <div className="flex gap-3 mt-2">
                      <button onClick={() => setPrForm({...prForm, enabled: true})}
                        className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${prForm.enabled ? 'bg-emerald-600 text-white' : 'bg-white/5 text-blue-200'}`}>Active</button>
                      <button onClick={() => setPrForm({...prForm, enabled: false})}
                        className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${!prForm.enabled ? 'bg-red-600 text-white' : 'bg-white/5 text-blue-200'}`}>Disabled</button>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-6 pt-4 border-t border-white/10">
                  <button onClick={handleAddPricing}
                    className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-all">
                    Add Pricing
                  </button>
                  <button onClick={() => setShowPricingForm(false)}
                    className="px-6 py-3 bg-white/5 hover:bg-white/10 text-blue-200 rounded-xl transition-all">
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ════════════ BLAST CAMPAIGN ════════════ */}
      {activeTab === 'blast' && (
        <div className="space-y-6">
          {/* Campaign History */}
          <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Campaign History</h3>
              <button onClick={() => setShowBlastForm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-xl transition-all">
                <Send className="w-4 h-4" /> New Blast
              </button>
            </div>
            {smsCampaigns.length === 0 ? (
              <div className="p-8 text-center text-blue-300/60">
                <Send className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <p>No campaigns sent yet. Create your first SMS blast above.</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {smsCampaigns.map(c => (
                  <div key={c.id} className="p-4 hover:bg-white/5 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-lg text-xs font-medium ${
                          c.status === 'completed' ? 'bg-emerald-600/20 text-emerald-400' :
                          c.status === 'sending' ? 'bg-blue-600/20 text-blue-400' :
                          c.status === 'draft' ? 'bg-amber-600/20 text-amber-400' :
                          'bg-red-600/20 text-red-400'
                        }`}>{c.status}</span>
                        <span className="text-white font-medium">{c.name}</span>
                      </div>
                      <span className="text-blue-200 text-xs">{new Date(c.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="text-blue-200 text-sm mb-1 line-clamp-2">{c.message}</p>
                    <div className="flex items-center gap-4 text-xs text-blue-300/60">
                      <span><Users className="w-3 h-3 inline mr-1" />{c.totalRecipients} recipients</span>
                      <span className="text-emerald-400">✓ {c.sentCount} sent</span>
                      {c.failedCount > 0 && <span className="text-red-400">✗ {c.failedCount} failed</span>}
                      <span className="font-mono">${c.cost.toFixed(4)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Blast Modal */}
          {showBlastForm && (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setShowBlastForm(false)}>
              <div className="bg-slate-800 border border-white/10 rounded-2xl p-6 w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <h3 className="text-lg font-semibold text-white mb-4">New SMS Blast Campaign</h3>
                {!activeGateway ? (
                  <div className="p-4 bg-amber-600/10 border border-amber-500/30 rounded-xl text-amber-300 text-sm mb-4">
                    ⚠️ No active SMS gateway configured. Go to <strong>Gateway Config</strong> to set up Net2App Hub first.
                  </div>
                ) : (
                  <p className="text-emerald-400 text-sm mb-4 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" /> Sending via: {activeGateway.name}
                  </p>
                )}
                <div className="space-y-4">
                  <div>
                    <label className="text-blue-200 text-sm">Campaign Name</label>
                    <input value={blastForm.name} onChange={e => setBlastForm({...blastForm, name: e.target.value})}
                      className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm mt-1" placeholder="Promo March 2025" />
                  </div>
                  <div>
                    <label className="text-blue-200 text-sm">Message</label>
                    <textarea value={blastForm.message} onChange={e => setBlastForm({...blastForm, message: e.target.value})} rows={4}
                      className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm mt-1"
                      placeholder="Your message here..." />
                    <p className="text-blue-300/60 text-xs mt-1">{blastForm.message.length} / 160 chars (SMS segments: {Math.ceil(blastForm.message.length / 160)})</p>
                  </div>
                  <div>
                    <label className="text-blue-200 text-sm">Recipients (one per line)</label>
                    <textarea value={blastForm.recipients} onChange={e => setBlastForm({...blastForm, recipients: e.target.value})} rows={5}
                      className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm mt-1 font-mono"
                      placeholder="+8801712345678&#10;+8801812345678&#10;+8801912345678" />
                    <p className="text-blue-300/60 text-xs mt-1">
                      {blastForm.recipients.split('\n').filter(Boolean).length} recipients · ~${(blastForm.recipients.split('\n').filter(Boolean).length * 0.02).toFixed(4)} estimated cost
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-6 pt-4 border-t border-white/10">
                  <button onClick={handleSendBlast} disabled={!activeGateway || sendingBlast || !blastForm.message || !blastForm.recipients}
                    className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium rounded-xl transition-all flex items-center justify-center gap-2">
                    {sendingBlast ? <><Loader className="w-4 h-4 animate-spin" /> Sending...</> : <><Send className="w-4 h-4" /> Send Blast</>}
                  </button>
                  <button onClick={() => setShowBlastForm(false)}
                    className="px-6 py-3 bg-white/5 hover:bg-white/10 text-blue-200 rounded-xl transition-all">
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ════════════ SMS LOGS ════════════ */}
      {activeTab === 'logs' && (
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">SMS Records ({smsRecords.length})</h3>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-300/60" />
                <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                  className="pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm w-64"
                  placeholder="Search by number or message..." />
              </div>
              <button className="p-2 hover:bg-white/10 rounded-lg text-blue-200 transition-all">
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
          {filteredLogs.length === 0 ? (
            <div className="p-8 text-center text-blue-300/60">
              <Activity className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p>{searchTerm ? 'No matching records found' : 'No SMS records yet. Send SMS from the client portal or blast campaigns.'}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-blue-200 text-sm border-b border-white/5">
                    <th className="p-4 font-medium">Date/Time</th>
                    <th className="p-4 font-medium">From</th>
                    <th className="p-4 font-medium">To</th>
                    <th className="p-4 font-medium">Message</th>
                    <th className="p-4 font-medium">Segments</th>
                    <th className="p-4 font-medium">Cost</th>
                    <th className="p-4 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.slice(0, 100).map(r => (
                    <tr key={r.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="p-4 text-blue-200 text-xs">{new Date(r.createdAt).toLocaleString()}</td>
                      <td className="p-4 text-white font-mono text-sm">{r.sender}</td>
                      <td className="p-4 text-white font-mono text-sm">{r.recipient}</td>
                      <td className="p-4 text-blue-200 text-sm max-w-xs truncate">{r.message}</td>
                      <td className="p-4 text-blue-200 text-sm">{r.segments}</td>
                      <td className="p-4 text-emerald-400 font-mono text-sm">${r.cost.toFixed(4)}</td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-lg text-xs font-medium ${
                          r.status === 'delivered' ? 'bg-emerald-600/20 text-emerald-400' :
                          r.status === 'sent' ? 'bg-blue-600/20 text-blue-400' :
                          r.status === 'failed' ? 'bg-red-600/20 text-red-400' :
                          'bg-amber-600/20 text-amber-400'
                        }`}>{r.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
