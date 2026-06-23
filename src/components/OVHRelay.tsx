import { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { Copy, Check, Download, Save, Server, Globe, ArrowLeftRight, Shield } from 'lucide-react';

export default function OVHRelay() {
  const { ovhConfig, updateOVHConfig } = useData();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [form, setForm] = useState({
    ovhPublicIp: ovhConfig?.ovhPublicIp || '51.xxx.xxx.xxx',
    ovhWireGuardPort: ovhConfig?.ovhWireGuardPort || 51820,
    ovhInterfaceIp: ovhConfig?.ovhInterfaceIp || '10.0.0.1',
    bangladeshClientIp: ovhConfig?.bangladeshClientIp || '10.100.0.2',
    indiaClientIp: ovhConfig?.indiaClientIp || '10.200.0.2',
    bangladeshSubnet: ovhConfig?.bangladeshSubnet || '10.100.0.0/24',
    indiaSubnet: ovhConfig?.indiaSubnet || '10.200.0.0/24',
    sipPort: ovhConfig?.forwardPorts?.sip || 5080,
    rtpRange: ovhConfig?.forwardPorts?.rtp || '10000-20000',
    amiPort: ovhConfig?.forwardPorts?.ami || 5038,
  });

  const c = (t: string, id: string) => { navigator.clipboard.writeText(t); setCopiedId(id); setTimeout(() => setCopiedId(null), 2000); };

  const handleSave = () => {
    updateOVHConfig({
      ovhPublicIp: form.ovhPublicIp, ovhWireGuardPort: form.ovhWireGuardPort,
      ovhInterfaceIp: form.ovhInterfaceIp, bangladeshClientIp: form.bangladeshClientIp,
      indiaClientIp: form.indiaClientIp, bangladeshSubnet: form.bangladeshSubnet,
      indiaSubnet: form.indiaSubnet,
      forwardPorts: { sip: form.sipPort, rtp: form.rtpRange, ami: form.amiPort },
      status: 'running',
    });
    alert('OVH Relay configuration saved!');
  };

  const ovhServerConf = `# ═══════════════════════════════════════════════════
# OVH CLOUD - WireGuard Server Config
# ═══════════════════════════════════════════════════
[Interface]
PrivateKey = <OVH_PRIVATE_KEY>
Address = ${form.ovhInterfaceIp}/24
ListenPort = ${form.ovhWireGuardPort}

# Enable IP forwarding
PostUp = sysctl -w net.ipv4.ip_forward=1
PostUp = iptables -A FORWARD -i wg0 -j ACCEPT
PostUp = iptables -A FORWARD -o wg0 -j ACCEPT
PostUp = iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE
PostUp = iptables -t nat -A PREROUTING -p udp --dport ${form.sipPort} -j DNAT --to-destination ${form.bangladeshClientIp}:${form.sipPort}
PostUp = iptables -t nat -A PREROUTING -p udp --dport 5060 -j DNAT --to-destination ${form.indiaClientIp}:5060
PostUp = iptables -t nat -A PREROUTING -p udp --dport ${form.rtpRange} -j DNAT --to-destination ${form.bangladeshClientIp}
PostUp = iptables -t nat -A PREROUTING -p tcp --dport ${form.amiPort} -j DNAT --to-destination ${form.bangladeshClientIp}:${form.amiPort}

PostDown = iptables -D FORWARD -i wg0 -j ACCEPT
PostDown = iptables -D FORWARD -o wg0 -j ACCEPT
PostDown = iptables -t nat -D POSTROUTING -o eth0 -j MASQUERADE
SaveConfig = true

# ──────────── Bangladesh Client ────────────
[Peer]
# Bangladesh WireGuard Client
PublicKey = <BD_CLIENT_PUBLIC_KEY>
AllowedIPs = ${form.bangladeshClientIp}/32, ${form.bangladeshSubnet}
PersistentKeepalive = 25

# ──────────── India Client ────────────
[Peer]
# India WireGuard Client
PublicKey = <IN_CLIENT_PUBLIC_KEY>
AllowedIPs = ${form.indiaClientIp}/32, ${form.indiaSubnet}
PersistentKeepalive = 25`;

  const bdClientConf = `# ═══════════════════════════════════════════════════
# BANGLADESH - WireGuard Client Config
# Connect to OVH Cloud Relay
# ═══════════════════════════════════════════════════
[Interface]
PrivateKey = <BD_CLIENT_PRIVATE_KEY>
Address = ${form.bangladeshClientIp}/24
# DNS = 8.8.8.8
MTU = 1420

PostUp = iptables -A FORWARD -i wg0 -j ACCEPT
PostUp = iptables -t nat -A POSTROUTING -o wg0 -j MASQUERADE

[Peer]
# OVH Cloud Relay Server
PublicKey = <OVH_SERVER_PUBLIC_KEY>
Endpoint = ${form.ovhPublicIp}:${form.ovhWireGuardPort}
AllowedIPs = 0.0.0.0/0
PersistentKeepalive = 25

# ───────────────────────────────────────────────
# HOW TO USE (Bangladesh Side):
#
# 1. Install WireGuard: apt-get install wireguard
# 2. Save this file: /etc/wireguard/wg0.conf
# 3. Start: wg-quick up wg0
# 4. Auto-start: systemctl enable wg-quick@wg0
#
# SIP Traffic Flow:
#   SIP Phone → Asterisk(192.168.x.x:5080)
#   → wg0 tunnel → OVH(${form.ovhPublicIp}:${form.ovhWireGuardPort})
#   → Forwarded to BD IPTSP/BTCL network
#
# Port Forwarding from OVH:
#   OVH receives:${form.sipPort} → Forwards to: ${form.bangladeshClientIp}:${form.sipPort}
#   This means your Asterisk at 192.168.x.x:5080
#   is reachable via ${form.ovhPublicIp}:${form.sipPort}
# ───────────────────────────────────────────────`;

  const inClientConf = `# ═══════════════════════════════════════════════════
# INDIA - WireGuard Client Config
# Connect to OVH Cloud Relay
# ═══════════════════════════════════════════════════
[Interface]
PrivateKey = <IN_CLIENT_PRIVATE_KEY>
Address = ${form.indiaClientIp}/24
MTU = 1420

PostUp = iptables -A FORWARD -i wg0 -j ACCEPT
PostUp = iptables -t nat -A POSTROUTING -o wg0 -j MASQUERADE

[Peer]
# OVH Cloud Relay Server
PublicKey = <OVH_SERVER_PUBLIC_KEY>
Endpoint = ${form.ovhPublicIp}:${form.ovhWireGuardPort}
AllowedIPs = 0.0.0.0/0
PersistentKeepalive = 25

# ───────────────────────────────────────────────
# HOW TO USE (India Side):
#
# 1. Install WireGuard: apt-get install wireguard
# 2. Save this file: /etc/wireguard/wg0.conf
# 3. Start: wg-quick up wg0
#
# SIP Trunk Traffic Flow:
#   Indian SBC(100.64.216.4:5060)
#   → wg0 tunnel → OVH(${form.ovhPublicIp}:${form.ovhWireGuardPort})
#   → Forwarded to India SIP Trunk
#
# Asterisk SIP Peer Config for India Trunk:
#   host=${form.indiaClientIp}
#   fromdomain=100.65.166.6
#   port=5060
# ───────────────────────────────────────────────`;

  const iptablesOvh = `# ═══════════════════════════════════════════════════
# OVH SERVER - iptables Forwarding Rules
# Run: bash iptables_ovh.sh
# ═══════════════════════════════════════════════════
#!/bin/bash

# Enable IP forwarding
echo 'net.ipv4.ip_forward=1' >> /etc/sysctl.conf
sysctl -p

# Flush existing NAT rules
iptables -t nat -F
iptables -F FORWARD

# Allow forwarding on WireGuard interface
iptables -A FORWARD -i wg0 -j ACCEPT
iptables -A FORWARD -o wg0 -j ACCEPT

# NAT masquerade for WireGuard traffic
iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE

# ──── Forward SIP to Bangladesh ────
# Forward incoming SIP traffic on port ${form.sipPort} to BD client
iptables -t nat -A PREROUTING -p udp -i eth0 --dport ${form.sipPort} \\
  -j DNAT --to-destination ${form.bangladeshClientIp}:${form.sipPort}

# ──── Forward SIP to India ────
# Forward port 5060 to India client for SIP trunk
iptables -t nat -A PREROUTING -p udp -i eth0 --dport 5060 \\
  -j DNAT --to-destination ${form.indiaClientIp}:5060

# ──── Forward RTP to Bangladesh ────
iptables -t nat -A PREROUTING -p udp -i eth0 --dport ${form.rtpRange} \\
  -j DNAT --to-destination ${form.bangladeshClientIp}

# ──── Forward AMI ────
iptables -t nat -A PREROUTING -p tcp -i eth0 --dport ${form.amiPort} \\
  -j DNAT --to-destination ${form.bangladeshClientIp}:${form.amiPort}

echo "iptables forwarding rules applied!"
iptables -t nat -L -n -v`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">☁️ OVH Cloud Relay</h1>
          <p className="text-blue-200">WireGuard relay server for Bangladesh & India (both behind NAT)</p>
        </div>
        <button onClick={handleSave} className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-all shadow-lg shadow-indigo-500/30">
          <Save className="w-5 h-5" /> Save Config
        </button>
      </div>

      <div className="bg-indigo-600/20 border border-indigo-500/30 rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <Server className="w-8 h-8 text-indigo-400 flex-shrink-0" />
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">OVH Cloud Relay Architecture</h3>
            <p className="text-indigo-200 text-sm">
              OVH Cloud has a real public IP. Bangladesh and India offices don't have real IPs (behind NAT/GNAT).
              All traffic flows through OVH WireGuard relay. Below are config files and iptables forwarding rules.
            </p>
          </div>
        </div>
      </div>

      {/* Architecture Visualization */}
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Traffic Flow</h2>
        <div className="font-mono text-sm space-y-2 text-blue-200 overflow-x-auto">
          <div className="p-3 bg-white/5 rounded-lg">
            <span className="text-green-400">🇧🇩 BD Client</span> (No Real IP) → 
            <span className="text-indigo-400"> wg0 tunnel </span> → 
            <span className="text-yellow-400">OVH Cloud</span> ({form.ovhPublicIp}:{form.ovhWireGuardPort}) → 
            <span className="text-green-400"> BD IPTSP / BDIX</span>
          </div>
          <div className="p-3 bg-white/5 rounded-lg">
            <span className="text-orange-400">🇮🇳 IN Client</span> (No Real IP) → 
            <span className="text-indigo-400"> wg0 tunnel </span> → 
            <span className="text-yellow-400">OVH Cloud</span> ({form.ovhPublicIp}:{form.ovhWireGuardPort}) → 
            <span className="text-orange-400"> SBC (100.64.216.4)</span> → 
            <span className="text-orange-400"> India PSTN</span>
          </div>
          <div className="p-3 bg-white/5 rounded-lg">
            <span className="text-yellow-400">OVH Port {form.sipPort}</span> → 
            <span className="text-indigo-400"> DNAT </span> → 
            <span className="text-green-400"> {form.bangladeshClientIp}:{form.sipPort}</span>
          </div>
          <div className="p-3 bg-white/5 rounded-lg">
            <span className="text-yellow-400">OVH Port 5060</span> → 
            <span className="text-indigo-400"> DNAT </span> → 
            <span className="text-orange-400"> {form.indiaClientIp}:5060</span>
          </div>
        </div>
      </div>

      {/* OVH Server IP Settings */}
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6">
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2"><Globe className="w-5 h-5" /> OVH Server Settings</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div><label className="block text-sm font-medium text-indigo-200 mb-2">OVH Public IP</label>
            <input type="text" value={form.ovhPublicIp} onChange={e => setForm({...form, ovhPublicIp: e.target.value})}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-indigo-500" /></div>
          <div><label className="block text-sm font-medium text-indigo-200 mb-2">WG Port</label>
            <input type="number" value={form.ovhWireGuardPort} onChange={e => setForm({...form, ovhWireGuardPort: parseInt(e.target.value)})}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-indigo-500" /></div>
          <div><label className="block text-sm font-medium text-indigo-200 mb-2">OVH WG IP</label>
            <input type="text" value={form.ovhInterfaceIp} onChange={e => setForm({...form, ovhInterfaceIp: e.target.value})}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-indigo-500" /></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div><label className="block text-sm font-medium text-green-200 mb-2">🇧🇩 BD Client WG IP</label>
            <input type="text" value={form.bangladeshClientIp} onChange={e => setForm({...form, bangladeshClientIp: e.target.value})}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-green-500" /></div>
          <div><label className="block text-sm font-medium text-orange-200 mb-2">🇮🇳 IN Client WG IP</label>
            <input type="text" value={form.indiaClientIp} onChange={e => setForm({...form, indiaClientIp: e.target.value})}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-orange-500" /></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div><label className="block text-sm font-medium text-indigo-200 mb-2">SIP Forward Port</label>
            <input type="number" value={form.sipPort} onChange={e => setForm({...form, sipPort: parseInt(e.target.value)})}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-indigo-500" /></div>
          <div><label className="block text-sm font-medium text-indigo-200 mb-2">RTP Range</label>
            <input type="text" value={form.rtpRange} onChange={e => setForm({...form, rtpRange: e.target.value})}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-indigo-500" /></div>
          <div><label className="block text-sm font-medium text-indigo-200 mb-2">AMI Port</label>
            <input type="number" value={form.amiPort} onChange={e => setForm({...form, amiPort: parseInt(e.target.value)})}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-indigo-500" /></div>
        </div>
      </div>

      {/* Config Files */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* OVH Server Config */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2"><Server className="w-5 h-5 text-yellow-400" /> OVH Server Config</h2>
            <div className="flex gap-2">
              <button onClick={() => c(ovhServerConf, 'ovh')} className="p-2 hover:bg-white/10 rounded text-indigo-300">
                {copiedId === 'ovh' ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
              </button>
              <button onClick={() => { const b = new Blob([ovhServerConf], { type: 'text/plain' }); const u = URL.createObjectURL(b); const a = document.createElement('a'); a.href = u; a.download = 'ovh-server-wg0.conf'; a.click(); URL.revokeObjectURL(u); }}
                className="p-2 hover:bg-white/10 rounded text-indigo-300"><Download className="w-4 h-4" /></button>
            </div>
          </div>
          <pre className="bg-black/50 rounded-xl p-4 text-xs font-mono text-green-400 overflow-x-auto max-h-96">{ovhServerConf}</pre>
        </div>

        {/* iptables Rules */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2"><ArrowLeftRight className="w-5 h-5 text-red-400" /> iptables Forwarding</h2>
            <div className="flex gap-2">
              <button onClick={() => c(iptablesOvh, 'ipt')} className="p-2 hover:bg-white/10 rounded text-indigo-300">
                {copiedId === 'ipt' ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
              </button>
              <button onClick={() => { const b = new Blob([iptablesOvh], { type: 'text/plain' }); const u = URL.createObjectURL(b); const a = document.createElement('a'); a.href = u; a.download = 'iptables_ovh.sh'; a.click(); URL.revokeObjectURL(u); }}
                className="p-2 hover:bg-white/10 rounded text-indigo-300"><Download className="w-4 h-4" /></button>
            </div>
          </div>
          <pre className="bg-black/50 rounded-xl p-4 text-xs font-mono text-cyan-400 overflow-x-auto max-h-96">{iptablesOvh}</pre>
        </div>

        {/* Bangladesh Client Config */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-green-500/20 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2"><Shield className="w-5 h-5 text-green-400" /> 🇧🇩 Bangladesh Client</h2>
            <div className="flex gap-2">
              <button onClick={() => c(bdClientConf, 'bd')} className="p-2 hover:bg-white/10 rounded text-green-300">
                {copiedId === 'bd' ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
              </button>
              <button onClick={() => { const b = new Blob([bdClientConf], { type: 'text/plain' }); const u = URL.createObjectURL(b); const a = document.createElement('a'); a.href = u; a.download = 'bangladesh-client-wg0.conf'; a.click(); URL.revokeObjectURL(u); }}
                className="p-2 hover:bg-white/10 rounded text-green-300"><Download className="w-4 h-4" /></button>
            </div>
          </div>
          <pre className="bg-black/50 rounded-xl p-4 text-xs font-mono text-green-400 overflow-x-auto max-h-96">{bdClientConf}</pre>
          <div className="mt-4 p-3 bg-green-600/20 border border-green-500/30 rounded-lg">
            <p className="text-green-200 text-xs"><strong>Bangladesh Steps:</strong> Install WG → Save as /etc/wireguard/wg0.conf → Replace keys → wg-quick up wg0 → Asterisk listens on 0.0.0.0:{form.sipPort} → SIP phone connects to Asterisk internal IP → Traffic flows through WG tunnel → OVH port-forwards to BD IPTSP</p>
          </div>
        </div>

        {/* India Client Config */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-orange-500/20 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2"><Shield className="w-5 h-5 text-orange-400" /> 🇮🇳 India Client</h2>
            <div className="flex gap-2">
              <button onClick={() => c(inClientConf, 'in')} className="p-2 hover:bg-white/10 rounded text-orange-300">
                {copiedId === 'in' ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
              </button>
              <button onClick={() => { const b = new Blob([inClientConf], { type: 'text/plain' }); const u = URL.createObjectURL(b); const a = document.createElement('a'); a.href = u; a.download = 'india-client-wg0.conf'; a.click(); URL.revokeObjectURL(u); }}
                className="p-2 hover:bg-white/10 rounded text-orange-300"><Download className="w-4 h-4" /></button>
            </div>
          </div>
          <pre className="bg-black/50 rounded-xl p-4 text-xs font-mono text-orange-400 overflow-x-auto max-h-96">{inClientConf}</pre>
          <div className="mt-4 p-3 bg-orange-600/20 border border-orange-500/30 rounded-lg">
            <p className="text-orange-200 text-xs"><strong>India Steps:</strong> Install WG → Save as /etc/wireguard/wg0.conf → Replace keys → wg-quick up wg0 → Asterisk peer to {form.indiaClientIp}:5060 → SBC(100.64.216.4) connects through tunnel → Traffic flows: SBC → wg0 → OVH → forwarded to Indian carrier</p>
          </div>
        </div>
      </div>

      {/* Quick Install Commands */}
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Quick Setup Commands</h2>
        <div className="space-y-4">
          <div className="p-4 bg-yellow-600/20 border border-yellow-500/30 rounded-xl">
            <h3 className="text-yellow-400 font-medium mb-2">On OVH Server:</h3>
            <pre className="text-white text-sm font-mono bg-black/30 rounded p-3 overflow-x-auto">{`# Install WireGuard
apt-get install wireguard -y

# Generate keys
wg genkey | tee /etc/wireguard/private.key | wg pubkey > /etc/wireguard/public.key

# Save the downloaded wg0.conf to /etc/wireguard/wg0.conf
# Replace <OVH_PRIVATE_KEY> with: cat /etc/wireguard/private.key
# Replace <BD_CLIENT_PUBLIC_KEY> from Bangladesh cat /etc/wireguard/public.key
# Replace <IN_CLIENT_PUBLIC_KEY> from India cat /etc/wireguard/public.key

# Start WireGuard
wg-quick up wg0
systemctl enable wg-quick@wg0

# Run iptables forwarding
bash iptables_ovh.sh

# Check status
wg show`}</pre>
          </div>
          <div className="p-4 bg-green-600/20 border border-green-500/30 rounded-xl">
            <h3 className="text-green-400 font-medium mb-2">On Bangladesh Server:</h3>
            <pre className="text-white text-sm font-mono bg-black/30 rounded p-3 overflow-x-auto">{`# Install WireGuard
apt-get install wireguard -y

# Generate keys
wg genkey | tee /etc/wireguard/private.key | wg pubkey > /etc/wireguard/public.key
cat /etc/wireguard/public.key  # Share this with OVH admin

# Save downloaded config to /etc/wireguard/wg0.conf
# Replace <BD_CLIENT_PRIVATE_KEY> with: cat /etc/wireguard/private.key
# Replace <OVH_SERVER_PUBLIC_KEY> with OVH server's public key

# Start
wg-quick up wg0
systemctl enable wg-quick@wg0

# Test tunnel
ping ${form.ovhInterfaceIp}
ping ${form.indiaClientIp}`}</pre>
          </div>
          <div className="p-4 bg-orange-600/20 border border-orange-500/30 rounded-xl">
            <h3 className="text-orange-400 font-medium mb-2">On India Server:</h3>
            <pre className="text-white text-sm font-mono bg-black/30 rounded p-3 overflow-x-auto">{`# Install WireGuard
apt-get install wireguard -y

# Generate keys
wg genkey | tee /etc/wireguard/private.key | wg pubkey > /etc/wireguard/public.key
cat /etc/wireguard/public.key  # Share this with OVH admin

# Save downloaded config to /etc/wireguard/wg0.conf
# Replace <IN_CLIENT_PRIVATE_KEY> with: cat /etc/wireguard/private.key
# Replace <OVH_SERVER_PUBLIC_KEY> with OVH server's public key

# Start
wg-quick up wg0
systemctl enable wg-quick@wg0

# Test tunnel
ping ${form.ovhInterfaceIp}
ping ${form.bangladeshClientIp}`}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}
