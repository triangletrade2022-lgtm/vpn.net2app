import { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { 
  Settings as SettingsIcon,
  Save,
  User,
  Mail,
  Clock,
  Server,
  Shield,
  LogOut,
  Wifi,
  RotateCcw,
  Database,
  CheckCircle,
  AlertCircle,
  Loader
} from 'lucide-react';

export default function Settings() {
  const { settings, updateSettings, sipNumbers, addSIPNumber, deleteSIPNumber, extensions, addExtension, deleteExtension } = useData();
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'general' | 'network' | 'account'>('general');
  const [syncState, setSyncState] = useState<'idle' | 'syncing' | 'done' | 'error'>('idle');
  const [syncResult, setSyncResult] = useState<{ added?: number; total?: number; error?: string }>({});

  const [formData, setFormData] = useState({
    bangladeshDefaultPort: settings?.bangladeshDefaultPort || 5080,
    indiaDefaultPort: settings?.indiaDefaultPort || 5090,
    wireGuardServerIp: settings?.wireGuardServerIp || '10.0.0.1',
    asteriskServerIp: settings?.asteriskServerIp || '51.161.45.126',
    adminEmail: settings?.adminEmail || 'admin@iptsp.local',
    timezone: settings?.timezone || 'Asia/Dhaka',
    sessionTimeout: settings?.sessionTimeout || 3600,
  });

  const handleSave = () => {
    updateSettings(formData);
    alert('Settings saved successfully!');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
        <p className="text-blue-200">System configuration and preferences</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/10">
        <button
          onClick={() => setActiveTab('general')}
          className={`px-6 py-3 font-medium transition-all ${
            activeTab === 'general'
              ? 'text-white border-b-2 border-blue-500'
              : 'text-blue-300 hover:text-white'
          }`}
        >
          General
        </button>
        <button
          onClick={() => setActiveTab('network')}
          className={`px-6 py-3 font-medium transition-all ${
            activeTab === 'network'
              ? 'text-white border-b-2 border-blue-500'
              : 'text-blue-300 hover:text-white'
          }`}
        >
          Network
        </button>
        <button
          onClick={() => setActiveTab('account')}
          className={`px-6 py-3 font-medium transition-all ${
            activeTab === 'account'
              ? 'text-white border-b-2 border-blue-500'
              : 'text-blue-300 hover:text-white'
          }`}
        >
          Account
        </button>
      </div>

      {/* General Settings */}
      {activeTab === 'general' && (
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6 space-y-6">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <SettingsIcon className="w-5 h-5" />
            General Settings
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-blue-200 mb-2">
                <Clock className="w-4 h-4 inline mr-2" />
                Timezone
              </label>
              <select
                value={formData.timezone}
                onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Asia/Dhaka">Asia/Dhaka (BDT)</option>
                <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                <option value="UTC">UTC</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-blue-200 mb-2">
                <Mail className="w-4 h-4 inline mr-2" />
                Admin Email
              </label>
              <input
                type="email"
                value={formData.adminEmail}
                onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-blue-200 mb-2">
                <Clock className="w-4 h-4 inline mr-2" />
                Session Timeout (seconds)
              </label>
              <input
                type="number"
                value={formData.sessionTimeout}
                onChange={(e) => setFormData({ ...formData, sessionTimeout: parseInt(e.target.value) })}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-white/10">
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-all shadow-lg shadow-blue-500/30"
            >
              <Save className="w-5 h-5" />
              Save Settings
            </button>
          </div>
        </div>
      )}

      {/* Network Settings */}
      {activeTab === 'network' && (
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6 space-y-6">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <Server className="w-5 h-5" />
            Network Configuration
          </h2>

          <div className="bg-yellow-600/20 border border-yellow-500/30 rounded-xl p-4">
            <p className="text-yellow-200 text-sm">
              Configure network settings for Bangladesh and India SIP infrastructure.
              These settings are used for WireGuard tunnels and Asterisk configuration.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-blue-200 mb-2">
                <Shield className="w-4 h-4 inline mr-2" />
                WireGuard Server IP
              </label>
              <input
                type="text"
                value={formData.wireGuardServerIp}
                onChange={(e) => setFormData({ ...formData, wireGuardServerIp: e.target.value })}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 10.0.0.1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-blue-200 mb-2">
                <Server className="w-4 h-4 inline mr-2" />
                Asterisk Server IP
              </label>
              <input
                type="text"
                value={formData.asteriskServerIp}
                onChange={(e) => setFormData({ ...formData, asteriskServerIp: e.target.value })}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 192.168.1.100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-green-200 mb-2">
                🇧🇩 Bangladesh Default SIP Port
              </label>
              <input
                type="number"
                value={formData.bangladeshDefaultPort}
                onChange={(e) => setFormData({ ...formData, bangladeshDefaultPort: parseInt(e.target.value) })}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="e.g., 5080"
              />
              <p className="text-green-200/70 text-sm mt-2">
                Port 5060 is blocked in Bangladesh. Use 5080, 5081, or 5082.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-orange-200 mb-2">
                🇮🇳 India Default SIP Port
              </label>
              <input
                type="number"
                value={formData.indiaDefaultPort}
                onChange={(e) => setFormData({ ...formData, indiaDefaultPort: parseInt(e.target.value) })}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="e.g., 5090"
              />
            </div>
          </div>

          <div className="flex items-center gap-4 pt-4 border-t border-white/10">
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-all shadow-lg shadow-blue-500/30"
            >
              <Save className="w-5 h-5" />
              Save Network Settings
            </button>
            <button
              onClick={async () => {
                try {
                  const res = await fetch('https://api.ipify.org?format=json');
                  const data = await res.json();
                  setFormData(prev => ({ ...prev, asteriskServerIp: data.ip }));
                } catch {
                  alert('Could not auto-detect IP. Try curl ifconfig.me');
                }
              }}
              className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-xl transition-all shadow-lg shadow-green-500/30"
            >
              <Wifi className="w-5 h-5" />
              Auto-Detect IP
            </button>
          </div>

          {/* ── Kamailio Sync ── */}
          <div className="border-t border-white/10 pt-6">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
              <Database className="w-5 h-5 text-emerald-400" />
              Kamailio Subscriber Sync
            </h3>
            <p className="text-blue-200 text-sm mb-4">
              Pull live subscriber list from the Kamailio SQLite database and sync it with the dashboard.
              Extensions and SIP numbers will be updated to match the database.
            </p>

            <div className="flex items-center gap-4">
              <button
                onClick={async () => {
                  if (!confirm('Replace all existing SIP numbers and extensions with data from Kamailio? This cannot be undone.')) return;
                  setSyncState('syncing');
                  setSyncResult({});
                  try {
                    const res = await fetch('http://127.0.0.1:3001/api/kamailio/subscribers');
                    if (!res.ok) throw new Error('API returned ' + res.status);
                    const data = await res.json();
                    
                    // Prepare new entries from Kamailio DB
                    const newIps: any[] = [];
                    const newExts: any[] = [];
                    const serverIp = settings?.asteriskServerIp || '51.161.45.126';
                    
                    data.subscribers.forEach((s: any) => {
                      const isBD = s.username.startsWith('096');
                      const isIN = s.username.startsWith('+91') || s.username.startsWith('0091');
                      const isExt = s.username.startsWith('200') || s.username.startsWith('201');
                      
                      if (isBD && !isExt) {
                        newIps.push({
                          number: s.username, username: s.username, password: s.password,
                          sipServer: serverIp, ipAddress: serverIp,
                          port: 5060, country: 'bangladesh', status: 'active',
                          prefix: '097', tenantId: 't1',
                        });
                      }
                      if (isIN) {
                        newIps.push({
                          number: s.username, username: s.username, password: s.password,
                          sipServer: serverIp, ipAddress: serverIp,
                          port: 5060, country: 'india', status: 'active',
                          prefix: '0091', tenantId: 't2',
                        });
                      }
                      if (isExt) {
                        newExts.push({
                          extension: s.username, name: `Synced ${s.username}`,
                          password: s.password, context: 'bangladesh-inbound',
                          nat: true, qualify: true, dtmfMode: 'rfc2833',
                          transport: 'udp', status: 'active',
                          codecs: ['ulaw', 'alaw'],
                          callerid: `"Synced ${s.username}" <${s.username}>`,
                          maxContacts: 2, tenantId: 't1', email: s.email_address,
                        });
                      }
                    });
                    
                    // Only clear and re-add after data is ready
                    sipNumbers.forEach(n => deleteSIPNumber(n.id));
                    extensions.forEach(e => deleteExtension(e.id));
                    newIps.forEach(ip => addSIPNumber(ip));
                    newExts.forEach(ext => addExtension(ext));
                    
                    setSyncState('done');
                    setSyncResult({ added: newIps.length + newExts.length, total: data.count });
                  } catch (err: any) {
                    setSyncState('error');
                    setSyncResult({ error: err.message || 'Connection failed' });
                  }
                }}
                disabled={syncState === 'syncing'}
                className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-medium rounded-xl transition-all shadow-lg shadow-emerald-500/30"
              >
                {syncState === 'syncing' ? (
                  <><Loader className="w-5 h-5 animate-spin" /> Syncing...</>
                ) : (
                  <><Database className="w-5 h-5" /> Sync from Kamailio</>
                )}
              </button>

              {syncState === 'done' && (
                <span className="flex items-center gap-2 text-emerald-400 text-sm">
                  <CheckCircle className="w-4 h-4" />
                  Synced {syncResult.added} items from {syncResult.total} subscribers
                </span>
              )}
              {syncState === 'error' && (
                <span className="flex items-center gap-2 text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  {syncResult.error || 'Sync failed'}
                </span>
              )}
            </div>

            <p className="text-blue-300/70 text-xs mt-3">
              API server runs on port 3001 — reads directly from <span className="font-mono">/var/lib/kamailio/kamailio.db</span>
            </p>
          </div>
        </div>
      )}

      {/* Account Settings */}
      {activeTab === 'account' && (
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6 space-y-6">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <User className="w-5 h-5" />
            Account Settings
          </h2>

          <div className="space-y-4">
            <div className="p-4 bg-white/5 rounded-xl">
              <p className="text-sm text-blue-200 mb-1">Username</p>
              <p className="text-white font-medium">{user?.username}</p>
            </div>

            <div className="p-4 bg-white/5 rounded-xl">
              <p className="text-sm text-blue-200 mb-1">Role</p>
              <p className="text-white font-medium capitalize">{user?.role}</p>
            </div>

            <div className="p-4 bg-white/5 rounded-xl">
              <p className="text-sm text-blue-200 mb-1">Member Since</p>
              <p className="text-white font-medium">
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-white/10 flex items-center gap-4">
            <button
              onClick={logout}
              className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl transition-all shadow-lg shadow-red-500/30"
            >
              <LogOut className="w-5 h-5" />
              Sign Out
            </button>
            <button
              onClick={() => {
                if (confirm('This will clear ALL local data and reset to defaults. Continue?')) {
                  localStorage.removeItem('iptsp_data_v3');
                  localStorage.removeItem('iptsp_token');
                  localStorage.removeItem('iptsp_user');
                  localStorage.removeItem('iptsp_active_tenant');
                  window.location.reload();
                }
              }}
              className="flex items-center gap-2 px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-xl transition-all shadow-lg shadow-orange-500/30"
            >
              <RotateCcw className="w-5 h-5" />
              Reset to Defaults
            </button>
          </div>
        </div>
      )}

      {/* System Info */}
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6">
        <h2 className="text-xl font-semibold text-white mb-4">System Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-white/5 rounded-xl">
            <p className="text-sm text-blue-200 mb-1">IPTSP Manager Version</p>
            <p className="text-white font-mono">1.0.0</p>
          </div>
          <div className="p-4 bg-white/5 rounded-xl">
            <p className="text-sm text-blue-200 mb-1">SIP Server</p>
            <p className="text-white font-mono">{settings?.asteriskServerIp || '51.161.45.126'}</p>
          </div>
          <div className="p-4 bg-white/5 rounded-xl">
            <p className="text-sm text-blue-200 mb-1">WireGuard Version</p>
            <p className="text-white font-mono">1.0.20210606+</p>
          </div>
        </div>
      </div>
    </div>
  );
}
