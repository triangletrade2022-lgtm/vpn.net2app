import { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { MessageSquare, Send, Clock, CheckCircle, AlertCircle, Loader, DollarSign, Users } from 'lucide-react';

export default function ClientSms() {
  const { smsGateways, smsRecords, addSmsRecord } = useData();
  const { user } = useAuth();

  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sendStatus, setSendStatus] = useState<'idle' | 'sent' | 'error'>('idle');
  const [activeTab, setActiveTab] = useState<'send' | 'history'>('send');

  const activeGateway = smsGateways.find(g => g.enabled);
  const myRecords = smsRecords.filter(r => r.clientId === user?.id || !r.clientId);
  const segments = Math.max(1, Math.ceil(message.length / 160));
  const estimatedCost = segments * 0.02;
  const canSend = phone.length >= 8 && message.length > 0 && !sending && !!activeGateway;

  const handleSend = async () => {
    if (!canSend) return;
    setSending(true);
    setSendStatus('idle');

    // Simulate sending via Net2App Hub API
    await new Promise(r => setTimeout(r, 1500 + Math.random() * 1000));

    const success = Math.random() > 0.1; // 90% success rate for demo
    addSmsRecord({
      tenantId: user?.tenantId || '',
      clientId: user?.id,
      sender: 'VPNET',
      recipient: phone,
      message,
      segments,
      cost: estimatedCost,
      status: success ? 'delivered' : 'failed',
      gateway: activeGateway?.name || 'net2app',
      createdAt: new Date().toISOString(),
    });

    setSendStatus(success ? 'sent' : 'error');
    setSending(false);
    if (success) {
      setPhone('');
      setMessage('');
      setTimeout(() => setSendStatus('idle'), 3000);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <MessageSquare className="w-7 h-7 text-indigo-400" />
          SMS
        </h1>
        <p className="text-slate-400 text-sm mt-1">Send SMS messages worldwide via Net2App gateway</p>
      </div>

      {!activeGateway ? (
        <div className="bg-amber-600/10 border border-amber-500/30 rounded-2xl p-8 text-center">
          <MessageSquare className="w-16 h-16 mx-auto mb-4 text-amber-400/60" />
          <h3 className="text-lg font-semibold text-white mb-2">SMS Service Unavailable</h3>
          <p className="text-amber-200 text-sm">The SMS gateway is not yet configured. Please check back later.</p>
        </div>
      ) : (
        <>
          {/* Balance Card */}
          <div className="bg-gradient-to-br from-indigo-600/20 to-purple-600/20 border border-indigo-500/30 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-indigo-200 text-sm">Your SMS Balance</p>
                <p className="text-3xl font-bold text-white mt-1">${(user?.balance || 0).toFixed(2)}</p>
                <p className="text-indigo-200/70 text-xs mt-1">~{Math.floor((user?.balance || 0) / 0.02)} SMS messages available</p>
              </div>
              <div className="p-4 bg-indigo-600/20 rounded-2xl">
                <MessageSquare className="w-10 h-10 text-indigo-400" />
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2">
            {([
              { key: 'send', label: 'Send SMS', icon: Send },
              { key: 'history', label: 'History', icon: Clock },
            ] as const).map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  activeTab === tab.key
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                    : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                }`}>
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* ════════ SEND SMS ════════ */}
          {activeTab === 'send' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white/5 border border-white/10 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">New Message</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-slate-300 text-sm block mb-1.5">Recipient Phone Number</label>
                    <input value={phone} onChange={e => setPhone(e.target.value)}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm font-mono focus:outline-none focus:border-indigo-500/50 transition-all"
                      placeholder="+8801712345678" />
                  </div>

                  <div>
                    <label className="text-slate-300 text-sm block mb-1.5">Message</label>
                    <textarea value={message} onChange={e => setMessage(e.target.value)} rows={5}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500/50 transition-all"
                      placeholder="Type your message here..." />
                    <div className="flex items-center justify-between mt-1.5">
                      <span className="text-slate-500 text-xs">{message.length} / 160 chars</span>
                      <span className="text-slate-500 text-xs">{segments} SMS segment{segments > 1 ? 's' : ''}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-indigo-600/10 border border-indigo-500/20 rounded-xl">
                    <div className="flex items-center gap-2 text-sm">
                      <DollarSign className="w-4 h-4 text-indigo-400" />
                      <span className="text-slate-300">Estimated cost:</span>
                    </div>
                    <span className="text-white font-mono font-medium">${estimatedCost.toFixed(4)}</span>
                  </div>

                  <button onClick={handleSend} disabled={!canSend}
                    className="w-full flex items-center justify-center gap-2 py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-all shadow-lg shadow-indigo-500/30">
                    {sending ? (
                      <><Loader className="w-5 h-5 animate-spin" /> Sending via {activeGateway.name}...</>
                    ) : sendStatus === 'sent' ? (
                      <><CheckCircle className="w-5 h-5 text-emerald-400" /> Message Sent!</>
                    ) : sendStatus === 'error' ? (
                      <><AlertCircle className="w-5 h-5 text-red-400" /> Failed — Try Again</>
                    ) : (
                      <><Send className="w-5 h-5" /> Send SMS</>
                    )}
                  </button>

                  <div className="flex items-center gap-2 text-slate-500 text-xs">
                    <MessageSquare className="w-3 h-3" />
                    Gateway: {activeGateway.name} · Sender: {activeGateway.senderId || 'VPNET'}
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="space-y-4">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                  <h4 className="text-white font-medium text-sm mb-3 flex items-center gap-2">
                    <Users className="w-4 h-4 text-indigo-400" />
                    Quick Actions
                  </h4>
                  <button onClick={() => setPhone('+8801712345678')}
                    className="w-full text-left px-3 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-slate-300 text-sm transition-all mb-2">
                    📞 Customer Support
                  </button>
                  <button onClick={() => setPhone('+8801812345678')}
                    className="w-full text-left px-3 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-slate-300 text-sm transition-all mb-2">
                    🏢 Office Line
                  </button>
                  <button onClick={() => setMessage('Dear valued customer,')}
                    className="w-full text-left px-3 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-slate-300 text-sm transition-all">
                    📝 Start with template
                  </button>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                  <h4 className="text-white font-medium text-sm mb-3">Top Up SMS Balance</h4>
                  <p className="text-slate-400 text-xs mb-3">Go to Billing to add funds</p>
                  <a href="/portal/billing"
                    className="block text-center py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-xl transition-all">
                    Go to Billing →
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* ════════ HISTORY ════════ */}
          {activeTab === 'history' && (
            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
              <div className="p-4 border-b border-white/10">
                <h3 className="text-lg font-semibold text-white">SMS History ({myRecords.length})</h3>
              </div>
              {myRecords.length === 0 ? (
                <div className="p-8 text-center text-slate-500">
                  <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-40" />
                  <p>No SMS messages sent yet.</p>
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {myRecords.slice().reverse().slice(0, 50).map(r => (
                    <div key={r.id} className="p-4 hover:bg-white/5 transition-colors">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${
                            r.status === 'delivered' ? 'bg-emerald-400' :
                            r.status === 'sent' ? 'bg-blue-400' :
                            r.status === 'failed' ? 'bg-red-400' : 'bg-amber-400'
                          }`} />
                          <span className="text-white font-mono text-sm">{r.recipient}</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs">
                          <span className="text-emerald-400 font-mono">-${r.cost.toFixed(4)}</span>
                          <span className="text-slate-500">{new Date(r.createdAt).toLocaleString()}</span>
                        </div>
                      </div>
                      <p className="text-slate-400 text-sm ml-4">{r.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
