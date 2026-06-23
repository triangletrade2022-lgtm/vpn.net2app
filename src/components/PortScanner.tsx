import { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { PortConfig } from '../types';
import { 
  Activity,
  Plus,
  Edit2,
  Trash2,
  X,
  RefreshCw,
  Check,
  AlertTriangle,
  XCircle,
  Search
} from 'lucide-react';

export default function PortScanner() {
  const { portConfigs, addPortConfig, updatePortConfig, deletePortConfig } = useData();
  const [showModal, setShowModal] = useState(false);
  const [editingPort, setEditingPort] = useState<PortConfig | null>(null);
  const [scanning, setScanning] = useState(false);
  const [filterCountry, setFilterCountry] = useState<'all' | 'bangladesh' | 'india'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'open' | 'closed' | 'blocked'>('all');

  const [formData, setFormData] = useState({
    country: 'bangladesh' as 'bangladesh' | 'india',
    port: 5080,
    protocol: 'udp' as 'udp' | 'tcp',
    status: 'open' as 'open' | 'closed' | 'blocked',
    isRecommended: false,
  });

  const filteredPorts = portConfigs.filter(p => {
    const matchesCountry = filterCountry === 'all' || p.country === filterCountry;
    const matchesStatus = filterStatus === 'all' || p.status === filterStatus;
    return matchesCountry && matchesStatus;
  });

  const simulateScan = () => {
    setScanning(true);
    // Simulate port scanning
    setTimeout(() => {
      portConfigs.forEach(port => {
        const randomLatency = Math.floor(Math.random() * 100) + 20;
        const statuses: ('open' | 'closed' | 'blocked')[] = ['open', 'open', 'open', 'closed', 'blocked'];
        const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
        
        updatePortConfig(port.id, {
          latency: randomStatus === 'open' ? randomLatency : 0,
          status: randomStatus,
          lastChecked: new Date().toISOString(),
          isRecommended: randomStatus === 'open' && randomLatency < 60,
        });
      });
      setScanning(false);
    }, 3000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingPort) {
      updatePortConfig(editingPort.id, {
        ...formData,
        lastChecked: new Date().toISOString(),
      });
    } else {
      addPortConfig({
        ...formData,
        latency: 0,
      });
    }
    
    closeModal();
  };

  const openModal = (port?: PortConfig) => {
    if (port) {
      setEditingPort(port);
      setFormData({
        country: port.country,
        port: port.port,
        protocol: port.protocol,
        status: port.status,
        isRecommended: port.isRecommended,
      });
    } else {
      setEditingPort(null);
      setFormData({
        country: 'bangladesh',
        port: 5080,
        protocol: 'udp',
        status: 'open',
        isRecommended: false,
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingPort(null);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return <Check className="w-5 h-5 text-green-400" />;
      case 'closed': return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
      case 'blocked': return <XCircle className="w-5 h-5 text-red-400" />;
      default: return <Activity className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'closed': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'blocked': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Port Scanner</h1>
          <p className="text-blue-200">Monitor UDP/TCP ports for SIP traffic (5060 blocked in Bangladesh)</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={simulateScan}
            disabled={scanning}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white font-medium rounded-xl transition-all shadow-lg shadow-blue-500/30"
          >
            <RefreshCw className={`w-5 h-5 ${scanning ? 'animate-spin' : ''}`} />
            {scanning ? 'Scanning...' : 'Scan Ports'}
          </button>
          <button
            onClick={() => openModal()}
            className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl transition-all shadow-lg shadow-emerald-500/30"
          >
            <Plus className="w-5 h-5" />
            Add Port
          </button>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-yellow-600/20 border border-yellow-500/30 rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <AlertTriangle className="w-8 h-8 text-yellow-400 flex-shrink-0" />
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">Bangladesh Port Restrictions</h3>
            <p className="text-yellow-200 text-sm">
              Port 5060 (standard SIP port) is blocked by most Bangladesh ISPs. 
              Use alternative UDP ports like 5080, 5081, 5082, 5090 for SIP traffic.
              WireGuard tunnel encapsulates SIP traffic to bypass these restrictions.
              Recommended latency for VoIP: &lt; 100ms
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <Search className="w-5 h-5 text-blue-300" />
          <select
            value={filterCountry}
            onChange={(e) => setFilterCountry(e.target.value as typeof filterCountry)}
            className="px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Countries</option>
            <option value="bangladesh">Bangladesh</option>
            <option value="india">India</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-blue-300" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}
            className="px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="open">Open</option>
            <option value="closed">Closed</option>
            <option value="blocked">Blocked</option>
          </select>
        </div>
      </div>

      {/* Ports Table */}
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-blue-200">Port</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-blue-200">Protocol</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-blue-200">Country</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-blue-200">Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-blue-200">Latency</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-blue-200">Recommended</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-blue-200">Last Checked</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-blue-200">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {filteredPorts.map((port) => (
                <tr key={port.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                    <span className="font-mono text-white text-lg">{port.port}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      port.protocol === 'udp' 
                        ? 'bg-blue-500/20 text-blue-400' 
                        : 'bg-purple-500/20 text-purple-400'
                    }`}>
                      {port.protocol.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      port.country === 'bangladesh' 
                        ? 'bg-green-500/20 text-green-400' 
                        : 'bg-orange-500/20 text-orange-400'
                    }`}>
                      {port.country === 'bangladesh' ? '🇧🇩 BD' : '🇮🇳 IN'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(port.status)}
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(port.status)}`}>
                        {port.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {port.status === 'open' ? (
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-white/10 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${
                              port.latency < 50 ? 'bg-green-500' : 
                              port.latency < 100 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${Math.min(port.latency, 150) / 150 * 100}%` }}
                          />
                        </div>
                        <span className="text-white font-mono">{port.latency}ms</span>
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {port.isRecommended ? (
                      <span className="flex items-center gap-2 text-green-400">
                        <Check className="w-5 h-5" />
                        <span className="text-sm">Yes</span>
                      </span>
                    ) : (
                      <span className="text-gray-400 text-sm">No</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-blue-200 text-sm">
                      {new Date(port.lastChecked).toLocaleString()}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openModal(port)}
                        className="p-2 hover:bg-blue-500/20 rounded-lg transition-colors text-blue-300 hover:text-blue-200"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this port config?')) {
                            deletePortConfig(port.id);
                          }
                        }}
                        className="p-2 hover:bg-red-500/20 rounded-lg transition-colors text-red-300 hover:text-red-200"
                      >
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

      {/* Recommended Ports Summary */}
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Recommended Ports</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-green-600/20 border border-green-500/30 rounded-xl">
            <h3 className="text-green-400 font-semibold mb-2">🇧🇩 Bangladesh</h3>
            <div className="space-y-2">
              {portConfigs.filter(p => p.country === 'bangladesh' && p.isRecommended).map(port => (
                <div key={port.id} className="flex justify-between items-center">
                  <span className="text-white font-mono">Port {port.port} ({port.protocol.toUpperCase()})</span>
                  <span className="text-green-400 text-sm">{port.latency}ms</span>
                </div>
              ))}
              {portConfigs.filter(p => p.country === 'bangladesh' && p.isRecommended).length === 0 && (
                <p className="text-gray-400 text-sm">Run scan to find recommended ports</p>
              )}
            </div>
          </div>
          <div className="p-4 bg-orange-600/20 border border-orange-500/30 rounded-xl">
            <h3 className="text-orange-400 font-semibold mb-2">🇮🇳 India</h3>
            <div className="space-y-2">
              {portConfigs.filter(p => p.country === 'india' && p.isRecommended).map(port => (
                <div key={port.id} className="flex justify-between items-center">
                  <span className="text-white font-mono">Port {port.port} ({port.protocol.toUpperCase()})</span>
                  <span className="text-orange-400 text-sm">{port.latency}ms</span>
                </div>
              ))}
              {portConfigs.filter(p => p.country === 'india' && p.isRecommended).length === 0 && (
                <p className="text-gray-400 text-sm">Run scan to find recommended ports</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 rounded-2xl border border-white/20 w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <h2 className="text-xl font-semibold text-white">
                {editingPort ? 'Edit Port' : 'Add New Port'}
              </h2>
              <button onClick={closeModal} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                <X className="w-5 h-5 text-blue-300" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-blue-200 mb-2">Country</label>
                  <select
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value as 'bangladesh' | 'india' })}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="bangladesh">Bangladesh</option>
                    <option value="india">India</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-blue-200 mb-2">Protocol</label>
                  <select
                    value={formData.protocol}
                    onChange={(e) => setFormData({ ...formData, protocol: e.target.value as 'udp' | 'tcp' })}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="udp">UDP</option>
                    <option value="tcp">TCP</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-blue-200 mb-2">Port Number</label>
                <input
                  type="number"
                  value={formData.port}
                  onChange={(e) => setFormData({ ...formData, port: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-blue-200 mb-2">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as 'open' | 'closed' | 'blocked' })}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="open">Open</option>
                  <option value="closed">Closed</option>
                  <option value="blocked">Blocked</option>
                </select>
              </div>

              <label className="flex items-center gap-3 p-4 bg-white/5 rounded-xl cursor-pointer hover:bg-white/10 transition-colors">
                <input
                  type="checkbox"
                  checked={formData.isRecommended}
                  onChange={(e) => setFormData({ ...formData, isRecommended: e.target.checked })}
                  className="w-5 h-5 rounded bg-white/10 border-white/20 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-blue-200">Mark as Recommended</span>
              </label>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl transition-all shadow-lg shadow-emerald-500/30"
                >
                  {editingPort ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
