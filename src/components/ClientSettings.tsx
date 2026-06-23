import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User, Mail, Globe, Phone, Save, Check, Shield, Key, Bell } from 'lucide-react';

export default function ClientSettings() {
  const { user, logout } = useAuth();
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Account Settings</h1>
        <p className="text-slate-400 mt-1">Manage your profile and preferences.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile */}
          <div className="bg-white/5 border border-white/5 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <User className="w-5 h-5 text-cyan-400" />
              Profile Information
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-slate-300 mb-1.5 block">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input type="email" defaultValue={user?.email || ''} readOnly
                    className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-slate-400 cursor-not-allowed" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-slate-300 mb-1.5 block">Full Name</label>
                  <input type="text" defaultValue={user?.username || ''}
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-cyan-500/50 transition-all" />
                </div>
                <div>
                  <label className="text-sm text-slate-300 mb-1.5 block">Company</label>
                  <input type="text" defaultValue="My Company"
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-cyan-500/50 transition-all" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-slate-300 mb-1.5 block">Phone</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input type="tel" defaultValue="+8801700000000"
                      className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-cyan-500/50 transition-all" />
                  </div>
                </div>
                <div>
                  <label className="text-sm text-slate-300 mb-1.5 block">Country</label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <select defaultValue="bangladesh"
                      className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-cyan-500/50 transition-all appearance-none">
                      <option value="bangladesh" className="bg-slate-900">🇧🇩 Bangladesh</option>
                      <option value="india" className="bg-slate-900">🇮🇳 India</option>
                      <option value="world" className="bg-slate-900">🌍 Other</option>
                    </select>
                  </div>
                </div>
              </div>
              <button onClick={handleSave}
                className="flex items-center gap-2 px-6 py-2.5 bg-cyan-600 hover:bg-cyan-700 rounded-xl text-sm font-medium transition-all shadow-lg shadow-cyan-500/25">
                {saved ? <><Check className="w-4 h-4" /> Saved!</> : <><Save className="w-4 h-4" /> Save Changes</>}
              </button>
            </div>
          </div>

          {/* Security */}
          <div className="bg-white/5 border border-white/5 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <Shield className="w-5 h-5 text-cyan-400" />
              Security
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-slate-300 mb-1.5 block">Current Password</label>
                <input type="password" placeholder="Enter current password"
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 transition-all" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-slate-300 mb-1.5 block">New Password</label>
                  <input type="password" placeholder="Min 6 characters"
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 transition-all" />
                </div>
                <div>
                  <label className="text-sm text-slate-300 mb-1.5 block">Confirm Password</label>
                  <input type="password" placeholder="Repeat password"
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 transition-all" />
                </div>
              </div>
              <button className="flex items-center gap-2 px-6 py-2.5 bg-cyan-600 hover:bg-cyan-700 rounded-xl text-sm font-medium transition-all shadow-lg shadow-cyan-500/25">
                <Key className="w-4 h-4" /> Update Password
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Account Info */}
          <div className="bg-white/5 border border-white/5 rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-white mb-4">Account Details</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Plan</span>
                <span className="text-white">Pay As You Go</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Role</span>
                <span className="text-cyan-400 capitalize">{user?.role || 'Client'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Balance</span>
                <span className="text-emerald-400">${user?.balance?.toFixed(2) || '0.00'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Created</span>
                <span className="text-white text-xs">{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}</span>
              </div>
            </div>
          </div>

          {/* Notifications */}
          <div className="bg-white/5 border border-white/5 rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <Bell className="w-4 h-4 text-cyan-400" />
              Notifications
            </h3>
            <div className="space-y-3">
              {[
                { label: 'Low Balance Alerts', enabled: true },
                { label: 'Usage Reports', enabled: true },
                { label: 'New Updates', enabled: false },
              ].map((n, i) => (
                <label key={i} className="flex items-center justify-between py-1">
                  <span className="text-sm text-slate-400">{n.label}</span>
                  <div className={`w-9 h-5 rounded-full transition-colors cursor-pointer ${n.enabled ? 'bg-cyan-500' : 'bg-slate-700'} relative`}>
                    <div className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 transition-transform ${n.enabled ? 'left-[18px]' : 'left-[4px]'}`} />
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
