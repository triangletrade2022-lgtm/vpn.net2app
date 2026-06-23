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
  LogOut
} from 'lucide-react';

export default function Settings() {
  const { settings, updateSettings } = useData();
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'general' | 'network' | 'account'>('general');

  const [formData, setFormData] = useState({
    bangladeshDefaultPort: settings?.bangladeshDefaultPort || 5080,
    indiaDefaultPort: settings?.indiaDefaultPort || 5090,
    wireGuardServerIp: settings?.wireGuardServerIp || '10.0.0.1',
    asteriskServerIp: settings?.asteriskServerIp || '192.168.1.100',
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

          <div className="pt-4 border-t border-white/10">
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-all shadow-lg shadow-blue-500/30"
            >
              <Save className="w-5 h-5" />
              Save Network Settings
            </button>
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

          <div className="pt-4 border-t border-white/10">
            <button
              onClick={logout}
              className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl transition-all shadow-lg shadow-red-500/30"
            >
              <LogOut className="w-5 h-5" />
              Sign Out
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
            <p className="text-sm text-blue-200 mb-1">Asterisk Version</p>
            <p className="text-white font-mono">18.x / 20.x</p>
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
