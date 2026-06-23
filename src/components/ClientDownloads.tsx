import { useState } from 'react';
import { Download, Server, Cpu, Radio, FileText, ChevronDown, Check, Copy, ExternalLink } from 'lucide-react';

export default function ClientDownloads() {
  const [copied, setCopied] = useState<string | null>(null);

  const isos = [
    {
      id: 'pc',
      icon: <Server className="w-8 h-8" />,
      title: 'PC / Server ISO',
      desc: 'Full bandwidth optimization for x86_64 systems. Includes CMER engine, encrypted tunnel, and management agent.',
      version: 'v2.1.0',
      size: '850 MB',
      updated: '2026-06-20',
      features: ['CMER Optimization Engine', 'WireGuard Tunnel Client', 'Auto-config on first boot', 'Web-based status dashboard', 'SSH access enabled'],
      instructions: [
        'Download the ISO file below',
        'Burn to USB using Rufus (Windows) or dd (Linux/Mac)',
        'Boot the target machine from the USB drive',
        'Login with username: root, password: vpnnet',
        'Run: vpnnet-connect to activate your tunnel',
      ],
    },
    {
      id: 'pi',
      icon: <Cpu className="w-8 h-8" />,
      title: 'Raspberry Pi ISO',
      desc: 'Lightweight ARM image for Pi 3/4/5. Perfect for 24/7 edge deployments with minimal power usage.',
      version: 'v2.1.0',
      size: '520 MB',
      updated: '2026-06-18',
      features: ['Optimized for Raspberry Pi 3/4/5', 'Headless mode (no monitor needed)', 'Auto-connect on boot', 'LED status indicator', 'PoE compatible'],
      instructions: [
        'Download the Pi ISO',
        'Flash to microSD (16GB+ recommended) using Raspberry Pi Imager',
        'Insert SD card into Pi and power on',
        'Wait 60 seconds for first boot config',
        'The tunnel connects automatically — check your portal to verify',
      ],
    },
    {
      id: 'router',
      icon: <Radio className="w-8 h-8" />,
      title: 'Router Edition',
      desc: 'OpenWRT-based firmware for 300+ router models. Flash directly and get VPN.net on your existing hardware.',
      version: 'v2.0.0',
      size: '120 MB',
      updated: '2026-06-15',
      features: ['Based on OpenWRT 23.05', 'Pre-configured tunnel client', 'Works with 300+ router models', 'Dual-band WiFi support', 'VPN passthrough enabled'],
      instructions: [
        'Check if your router model is supported',
        'Download the correct firmware file for your model',
        'Flash via router admin panel (Firmware Upgrade)',
        'Router will reboot — wait 2 minutes',
        'Tunnel connects automatically on boot',
      ],
    },
  ];

  const tools = [
    { name: 'Rufus', desc: 'Burn ISO to USB on Windows', url: 'https://rufus.ie' },
    { name: 'Raspberry Pi Imager', desc: 'Flash Pi ISO to microSD', url: 'https://www.raspberrypi.com/software/' },
    { name: 'Etcher', desc: 'Cross-platform USB burner', url: 'https://www.balena.io/etcher/' },
  ];

  const copyCmd = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Downloads</h1>
        <p className="text-slate-400 mt-1">Download pre-built ISO images for your hardware.</p>
      </div>

      {/* ISOs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {isos.map(iso => (
          <div key={iso.id} className="group bg-white/5 border border-white/5 hover:border-cyan-500/20 rounded-2xl overflow-hidden transition-all">
            {/* Header */}
            <div className="p-6 pb-4">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
                  {iso.icon}
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-500">{iso.version}</div>
                  <div className="text-xs text-slate-600">{iso.size}</div>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-white mb-1">{iso.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">{iso.desc}</p>
              <p className="text-xs text-slate-500 mb-2">Updated: {iso.updated}</p>

              {/* Features */}
              <div className="space-y-1.5 mb-4">
                {iso.features.map((f, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-slate-400">
                    <Check className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                    {f}
                  </div>
                ))}
              </div>
            </div>

            {/* Download Button */}
            <div className="px-6 pb-6">
              <button className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 rounded-xl text-sm font-medium transition-all shadow-lg shadow-cyan-500/20">
                <Download className="w-4 h-4" />
                Download {iso.title}
              </button>
            </div>

            {/* Instructions (collapsible) */}
            <details className="border-t border-white/5 group-open:border-cyan-500/20">
              <summary className="flex items-center gap-2 px-6 py-3 text-xs text-slate-400 hover:text-white cursor-pointer transition-colors">
                <ChevronDown className="w-3 h-3" />
                Installation Instructions
              </summary>
              <div className="px-6 pb-4 space-y-2">
                {iso.instructions.map((step, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-slate-500">
                    <span className="w-5 h-5 rounded-full bg-cyan-500/10 text-cyan-400 flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    {step}
                  </div>
                ))}
              </div>
            </details>
          </div>
        ))}
      </div>

      {/* Tools */}
      <div className="bg-white/5 border border-white/5 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-cyan-400" />
          Burning Tools
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {tools.map((tool, i) => (
            <a key={i} href={tool.url} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-between p-4 bg-white/5 rounded-xl hover:bg-white/[0.07] transition-all group">
              <div>
                <p className="text-sm font-medium text-white group-hover:text-cyan-400 transition-colors">{tool.name}</p>
                <p className="text-xs text-slate-500">{tool.desc}</p>
              </div>
              <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition-colors" />
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
