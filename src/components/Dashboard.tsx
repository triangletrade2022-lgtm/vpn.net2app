import { useData } from '../contexts/DataContext';
import { 
  Phone, 
  Server, 
  Shield, 
  Activity,
  Globe,
  MapPin
} from 'lucide-react';

export default function Dashboard() {
  const { stats, sipNumbers } = useData();

  const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    color,
    subtitle 
  }: { 
    title: string; 
    value: number | string; 
    icon: React.ElementType; 
    color: string;
    subtitle?: string;
  }) => (
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-xl ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        {subtitle && (
          <span className="text-xs text-blue-200/70">{subtitle}</span>
        )}
      </div>
      <p className="text-3xl font-bold text-white mb-1">{value}</p>
      <p className="text-sm text-blue-200">{title}</p>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
        <p className="text-blue-200">Overview of your IPTSP infrastructure</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Numbers"
          value={stats.totalNumbers}
          icon={Phone}
          color="bg-blue-600"
          subtitle={`${stats.activeNumbers} active`}
        />
        <StatCard
          title="Carriers"
          value={stats.totalCarriers}
          icon={Server}
          color="bg-emerald-600"
          subtitle={`${stats.activeCarriers} active`}
        />
        <StatCard
          title="WireGuard Tunnels"
          value={stats.wireGuardTunnels}
          icon={Shield}
          color="bg-purple-600"
          subtitle={`${stats.connectedTunnels} connected`}
        />
        <StatCard
          title="System Status"
          value={stats.connectedTunnels === stats.wireGuardTunnels ? 'Healthy' : 'Warning'}
          icon={Activity}
          color={stats.connectedTunnels === stats.wireGuardTunnels ? 'bg-green-600' : 'bg-yellow-600'}
        />
      </div>

      {/* Country Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bangladesh Stats */}
        <a href="/bangladesh" className="block bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-green-600 rounded-lg">
              <MapPin className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-white">🇧🇩 Bangladesh</h2>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-white/5 rounded-xl">
              <span className="text-green-200">Active Numbers</span>
              <span className="text-2xl font-bold text-white">{sipNumbers.filter(n => n.country === 'bangladesh' && n.status === 'active').length}</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-white/5 rounded-xl">
              <span className="text-green-200">Config Type</span>
              <span className="text-2xl font-bold text-white">User/Pass</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-white/5 rounded-xl">
              <span className="text-green-200">SIP Server</span>
              <span className="text-2xl font-bold text-white">10.100.0.1:5080</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-white/5 rounded-xl">
              <span className="text-green-200">WireGuard</span>
              <span className="text-green-400 flex items-center gap-2">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                Connected
              </span>
            </div>
          </div>
        </a>

        {/* India Stats */}
        <a href="/india" className="block bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-orange-600 rounded-lg">
              <Globe className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-white">🇮🇳 India</h2>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-white/5 rounded-xl">
              <span className="text-orange-200">Active Trunks</span>
              <span className="text-2xl font-bold text-white">{sipNumbers.filter(n => n.country === 'india' && n.status === 'active').length}</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-white/5 rounded-xl">
              <span className="text-orange-200">Config Type</span>
              <span className="text-2xl font-bold text-white">type=peer</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-white/5 rounded-xl">
              <span className="text-orange-200">Host</span>
              <span className="text-2xl font-bold text-white">100.64.216.4</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-white/5 rounded-xl">
              <span className="text-orange-200">SIP Trunk</span>
              <span className="text-green-400 flex items-center gap-2">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                Connected
              </span>
            </div>
          </div>
        </a>
      </div>

      {/* Recent Activity */}
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
        <h2 className="text-xl font-semibold text-white mb-6">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <a href="/bangladesh" className="p-4 bg-green-600/20 hover:bg-green-600/30 border border-green-500/30 rounded-xl text-green-200 hover:text-white transition-all text-center">
            <Phone className="w-6 h-6 mx-auto mb-2" />
            <span className="text-sm">BD Numbers</span>
          </a>
          <a href="/india" className="p-4 bg-orange-600/20 hover:bg-orange-600/30 border border-orange-500/30 rounded-xl text-orange-200 hover:text-white transition-all text-center">
            <Phone className="w-6 h-6 mx-auto mb-2" />
            <span className="text-sm">IN Trunk</span>
          </a>
          <a href="/carriers" className="p-4 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 rounded-xl text-emerald-200 hover:text-white transition-all text-center">
            <Server className="w-6 h-6 mx-auto mb-2" />
            <span className="text-sm">Carriers</span>
          </a>
          <a href="/wireguard" className="p-4 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 rounded-xl text-purple-200 hover:text-white transition-all text-center">
            <Shield className="w-6 h-6 mx-auto mb-2" />
            <span className="text-sm">WireGuard</span>
          </a>
        </div>
      </div>

      {/* System Info */}
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
        <h2 className="text-xl font-semibold text-white mb-4">System Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-white/5 rounded-xl">
            <p className="text-sm text-blue-200 mb-1">Asterisk Server</p>
            <p className="text-lg font-mono text-white">192.168.1.100</p>
          </div>
          <div className="p-4 bg-white/5 rounded-xl">
            <p className="text-sm text-blue-200 mb-1">WireGuard Server</p>
            <p className="text-lg font-mono text-white">10.0.0.1</p>
          </div>
          <div className="p-4 bg-white/5 rounded-xl">
            <p className="text-sm text-blue-200 mb-1">Timezone</p>
            <p className="text-lg text-white">Asia/Dhaka</p>
          </div>
        </div>
      </div>
    </div>
  );
}
