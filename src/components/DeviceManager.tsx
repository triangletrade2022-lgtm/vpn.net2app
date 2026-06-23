import { useState, useEffect, useCallback } from 'react';
import { 
  Monitor, Trash2, RefreshCw, 
  Search, AlertCircle, Clock, Cpu, Server,
  Activity, Globe, X
} from 'lucide-react';

const API_BASE = ''; // proxied by nginx /api/ → http://127.0.0.1:3001/api/

interface RegisteredDevice {
  device_id: string;
  hostname: string;
  model: string;
  arch: string;
  wg_ip: string;
  status: string;
  first_seen: string;
  last_seen: string;
  version: string;
}

export default function DeviceManager() {
  const [devices, setDevices] = useState<RegisteredDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [confirmRevoke, setConfirmRevoke] = useState<string | null>(null);

  const fetchDevices = useCallback(async () => {
    try {
      setRefreshing(true);
      setError('');
      const res = await fetch(`${API_BASE}/api/devices`);
      if (!res.ok) throw new Error(`API returned ${res.status}`);
      const data = await res.json();
      setDevices(data.devices || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch devices');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchDevices(); }, [fetchDevices]);

  const handleRevoke = async (deviceId: string) => {
    setRevokingId(deviceId);
    try {
      const res = await fetch(`${API_BASE}/api/device/revoke/${deviceId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`Revoke failed: ${res.status}`);
      setDevices(prev => prev.filter(d => d.device_id !== deviceId));
      setConfirmRevoke(null);
    } catch (err: any) {
      alert(`Revoke failed: ${err.message}`);
    } finally {
      setRevokingId(null);
    }
  };

  const filtered = devices.filter(d =>
    d.device_id.toLowerCase().includes(search.toLowerCase()) ||
    d.hostname.toLowerCase().includes(search.toLowerCase()) ||
    d.wg_ip.includes(search)
  );

  const timeAgo = (iso: string) => {
    const sec = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    if (sec < 60) return `${sec}s ago`;
    if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
    if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
    return `${Math.floor(sec / 86400)}d ago`;
  };

  const isOnline = (device: RegisteredDevice) => {
    const sec = (Date.now() - new Date(device.last_seen).getTime()) / 1000;
    return sec < 300; // 5 minutes = online
  };

  const modelIcon = (model: string) => {
    if (model.includes('router') || model.includes('openwrt')) return <Globe className="w-4 h-4" />;
    if (model.includes('pi') || model.includes('raspberry')) return <Cpu className="w-4 h-4" />;
    return <Monitor className="w-4 h-4" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            📱 Registered Devices
          </h1>
          <p className="text-blue-200">
            Client devices that have registered via the boot ISO agent
          </p>
        </div>
        <button onClick={fetchDevices} disabled={refreshing}
          className="flex items-center gap-2 px-5 py-3 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white font-medium rounded-xl transition-all shadow-lg shadow-cyan-500/30">
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* API Status */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-amber-600/20 border border-amber-500/30 rounded-2xl">
          <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0" />
          <div>
            <p className="text-amber-200 text-sm font-medium">API Server Unreachable</p>
            <p className="text-amber-300/70 text-xs mt-0.5">
              {error} — Make sure the Kamailio API server is running on port 3001.
              Start it with: <code className="font-mono bg-black/30 px-1.5 py-0.5 rounded">node kamailio-api-server.js</code>
            </p>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-cyan-300" />
        <input type="text" placeholder="Search by device ID, hostname, or IP..."
          value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-cyan-300/50 focus:outline-none focus:ring-2 focus:ring-cyan-500" />
      </div>

      {/* Stats Cards */}
      {!loading && !error && devices.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <p className="text-slate-400 text-xs mb-1">Total Devices</p>
            <p className="text-2xl font-bold text-white">{devices.length}</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <p className="text-slate-400 text-xs mb-1">Online</p>
            <p className="text-2xl font-bold text-emerald-400">{devices.filter(isOnline).length}</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <p className="text-slate-400 text-xs mb-1">Offline</p>
            <p className="text-2xl font-bold text-slate-400">{devices.filter(d => !isOnline(d)).length}</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <p className="text-slate-400 text-xs mb-1">Models</p>
            <p className="text-2xl font-bold text-white">{new Set(devices.map(d => d.model)).size}</p>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="flex items-center gap-3 text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin text-cyan-400" />
            Loading devices...
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && devices.length === 0 && !error && (
        <div className="text-center py-20">
          <div className="w-20 h-20 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-6">
            <Server className="w-10 h-10 text-slate-500" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">No Devices Registered</h3>
          <p className="text-slate-400 max-w-md mx-auto">
            Devices will appear here when clients boot the VPN.net ISO and the registration agent
            calls home. Make sure the Kamailio API server is running.
          </p>
        </div>
      )}

      {/* Device Table */}
      {!loading && filtered.length > 0 && (
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-white/5">
                <tr>
                  <th className="px-4 py-3 text-left text-xs text-blue-200">Status</th>
                  <th className="px-4 py-3 text-left text-xs text-blue-200">Device ID</th>
                  <th className="px-4 py-3 text-left text-xs text-blue-200">Hostname</th>
                  <th className="px-4 py-3 text-left text-xs text-blue-200">Model</th>
                  <th className="px-4 py-3 text-left text-xs text-blue-200">WG IP</th>
                  <th className="px-4 py-3 text-left text-xs text-blue-200">Last Seen</th>
                  <th className="px-4 py-3 text-left text-xs text-blue-200">Version</th>
                  <th className="px-4 py-3 text-right text-xs text-blue-200">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {filtered.map(device => {
                  const online = isOnline(device);
                  return (
                    <tr key={device.device_id} className="hover:bg-white/5 group">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${online ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
                          <span className={`text-xs ${online ? 'text-emerald-400' : 'text-slate-400'}`}>
                            {online ? 'Online' : 'Offline'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-white text-xs">{device.device_id}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-white">{device.hostname || '—'}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          {modelIcon(device.model)}
                          <span className="text-slate-300 text-xs capitalize">{device.model.replace(/-/g, ' ')}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-cyan-300">{device.wg_ip}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3 h-3 text-slate-500" />
                          <span className="text-slate-400 text-xs">{timeAgo(device.last_seen)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-slate-500 font-mono">v{device.version}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          {confirmRevoke === device.device_id ? (
                            <div className="flex items-center gap-1">
                              <button onClick={() => handleRevoke(device.device_id)} disabled={revokingId === device.device_id}
                                className="px-2 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs rounded-lg transition-all">
                                {revokingId === device.device_id ? '...' : 'Confirm'}
                              </button>
                              <button onClick={() => setConfirmRevoke(null)}
                                className="p-1.5 hover:bg-white/10 rounded text-slate-400">
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <>
                              <button onClick={() => setConfirmRevoke(device.device_id)}
                                className="p-1.5 hover:bg-red-500/20 rounded text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                                title="Revoke device access">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 bg-white/5 border-t border-white/10 text-xs text-slate-500">
            Showing {filtered.length} of {devices.length} device{devices.length !== 1 ? 's' : ''}
          </div>
        </div>
      )}

      {/* Info Banner */}
      <div className="bg-gradient-to-r from-cyan-600/10 to-blue-600/10 border border-cyan-500/20 rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <div className="p-2 bg-cyan-600/20 rounded-lg">
            <Activity className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white mb-1">How Device Registration Works</h3>
            <ol className="text-sm text-slate-300 space-y-1 list-decimal list-inside">
              <li>Client burns the VPN.net ISO to USB and boots the device</li>
              <li>The <code className="font-mono text-cyan-300 bg-black/30 px-1 rounded">vpnnet-agent.sh</code> script starts automatically via systemd</li>
              <li>Agent detects MAC address → registers via <code className="font-mono text-cyan-300 bg-black/30 px-1 rounded">POST /api/device/register</code></li>
              <li>Server assigns a WireGuard IP from the <code className="font-mono text-cyan-300 bg-black/30 px-1 rounded">10.0.0.0/24</code> subnet</li>
              <li>Agent downloads config → starts tunnel → sends heartbeats every 5 minutes</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
