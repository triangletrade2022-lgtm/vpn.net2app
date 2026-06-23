import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Server, Download, CreditCard, Activity, Radio,
  Wifi, Shield, ArrowRight, Zap, Globe, Clock,
  CheckCircle, AlertCircle
} from 'lucide-react';
import { useData } from '../contexts/DataContext';

export default function ClientDashboard() {
  const { user } = useAuth();
  const { stats } = useData();
  const navigate = useNavigate();

  const quickActions = [
    { icon: <Download className="w-5 h-5" />, title: 'Download ISO', desc: 'Get pre-built images for PC, Pi, or Router', color: 'from-cyan-500 to-blue-600', path: '/portal/downloads' },
    { icon: <CreditCard className="w-5 h-5" />, title: 'Top Up Wallet', desc: 'Add credit via PayPal, card, or bank transfer', color: 'from-emerald-500 to-teal-600', path: '/portal/billing' },
    { icon: <Shield className="w-5 h-5" />, title: 'Deploy Tunnel', desc: 'Create a new encrypted tunnel in one click', color: 'from-purple-500 to-pink-600', path: '/portal/settings' },
  ];

  const serverInfo = [
    { label: 'Server IP', value: '51.161.45.126', icon: Globe },
    { label: 'WireGuard Port', value: '51820', icon: Radio },
    { label: 'SIP Port', value: '5080', icon: Activity },
    { label: 'Status', value: 'Online', icon: CheckCircle, highlight: true },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-white">Welcome back{user?.email ? `, ${user.email.split('@')[0]}` : ''}</h1>
        <p className="text-slate-400 mt-1">Manage your VPN.net services from your dashboard.</p>
      </div>

      {/* Balance Card */}
      <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-white/10 rounded-2xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-400 mb-1">Account Balance</p>
            <div className="text-4xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
              ${user?.balance?.toFixed(2) || '0.00'}
            </div>
            <p className="text-xs text-slate-500 mt-1">USD — Pay As You Go</p>
          </div>
          <button onClick={() => navigate('/portal/billing')}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 rounded-xl text-sm font-medium transition-all shadow-lg shadow-emerald-500/25">
            <CreditCard className="w-4 h-4" />
            Add Credit
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quickActions.map((action, i) => (
            <button key={i} onClick={() => navigate(action.path)}
              className="group p-5 bg-white/5 hover:bg-white/[0.07] border border-white/5 hover:border-cyan-500/20 rounded-2xl text-left transition-all">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                {action.icon}
              </div>
              <h3 className="text-white font-medium mb-1">{action.title}</h3>
              <p className="text-xs text-slate-400">{action.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Server Info */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Your Server</h2>
        <div className="bg-white/5 border border-white/5 rounded-2xl p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {serverInfo.map((info, i) => (
              <div key={i} className="p-4 bg-white/5 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <info.icon className={`w-4 h-4 ${info.highlight ? 'text-emerald-400' : 'text-cyan-400'}`} />
                  <span className="text-xs text-slate-500">{info.label}</span>
                </div>
                <p className={`text-sm font-mono ${info.highlight ? 'text-emerald-400 flex items-center gap-2' : 'text-white'}`}>
                  {info.highlight && <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />}
                  {info.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Usage Stats */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Platform Usage</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Active Tunnels', value: stats.connectedTunnels, icon: Shield },
            { label: "Today's Calls", value: stats.todayCalls, icon: Activity },
            { label: "Today's Minutes", value: stats.todayMinutes, icon: Clock },
            { label: 'Active Numbers', value: stats.activeNumbers, icon: Radio },
          ].map((stat, i) => (
            <div key={i} className="p-4 bg-white/5 rounded-xl border border-white/5">
              <div className="flex items-center gap-2 mb-2">
                <stat.icon className="w-4 h-4 text-cyan-400" />
                <span className="text-xs text-slate-500">{stat.label}</span>
              </div>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
