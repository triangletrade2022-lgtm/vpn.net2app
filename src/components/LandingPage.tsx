import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Globe, Shield, Zap, Cpu, Download, CreditCard,
  ChevronRight, Server, Radio, MessageSquare,
  BarChart3, ArrowRight, Check, Menu, X
} from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [ports, setPorts] = useState(32);
  const [hours, setHours] = useState(24);
  const monthlyCost = (ports * 0.083 * hours * 30).toFixed(2);
  const dailyCost = (ports * 0.083 * hours).toFixed(2);

  const features = [
    { icon: <Shield className="w-6 h-6" />, title: 'Multi-Tunnel Mechanism', desc: 'Deploy multiple encrypted tunnels with one click to bypass IP or network blockages. Anti-blocking technology built-in.' },
    { icon: <Zap className="w-6 h-6" />, title: 'Dynamic Port Scaling', desc: 'Increase ports at peak time, decrease at off-peak. Scale from 16 to 256 ports instantly from your portal.' },              { icon: <CreditCard className="w-6 h-6" />, title: 'Pay As You Go', desc: 'Hourly billing with no hidden costs. Top up your wallet via PayPal, USDT (TRC20), or bank transfer.' },
    { icon: <Cpu className="w-6 h-6" />, title: '100% Self-Managed', desc: 'Install, modify, or cancel service at any time from your portal. No support calls needed.' },
    { icon: <Download className="w-6 h-6" />, title: 'Pre-Built ISO Downloads', desc: 'Download ready-to-burn ISO images for PC, Raspberry Pi, or router. Boot and connect in under 60 seconds.' },
    { icon: <MessageSquare className="w-6 h-6" />, title: 'SMS Platform Integration', desc: 'Send bulk SMS campaigns and integrate with Net2App Hub gateway via self-service portal. Pay per message from your wallet.' },
    { icon: <Globe className="w-6 h-6" />, title: 'Worldwide Coverage', desc: 'Works in any country with any internet connection. Compatible with all major gateways and softswitches.' },
  ];

  const steps = [
    { num: '01', title: 'Create Account', desc: 'Sign up with your email and get a $10 welcome bonus instantly.' },
    { num: '02', title: 'Top Up Wallet', desc: 'Add credit via PayPal, credit card, or bank transfer. Funds update in minutes.' },
    { num: '03', title: 'Deploy Server', desc: 'Choose your ports and region. Your server is ready in seconds.' },
    { num: '04', title: 'Download ISO', desc: 'Download the pre-built ISO for your hardware (PC, Pi, or Router).' },
    { num: '05', title: 'Boot & Connect', desc: 'Burn to USB, boot, and your tunnel is live. No configuration needed.' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* ── NAV ── */}
      <nav className="fixed top-0 w-full z-50 bg-slate-950/90 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                <Radio className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">VPN.net</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm text-slate-300 hover:text-white transition-colors">Features</a>
              <a href="#pricing" className="text-sm text-slate-300 hover:text-white transition-colors">Pricing</a>
              <a href="#how-it-works" className="text-sm text-slate-300 hover:text-white transition-colors">How It Works</a>
              <a href="#downloads" className="text-sm text-slate-300 hover:text-white transition-colors">Downloads</a>
              <Link to="/login" className="text-sm text-slate-300 hover:text-white transition-colors">Sign In</Link>
              <Link to="/register" className="px-5 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 rounded-xl text-sm font-medium transition-all shadow-lg shadow-cyan-500/25">
                Get Started Free
              </Link>
            </div>
            <button className="md:hidden p-2" onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
          {menuOpen && (
            <div className="md:hidden pb-4 space-y-3">
              <a href="#features" className="block px-3 py-2 text-slate-300" onClick={() => setMenuOpen(false)}>Features</a>
              <a href="#pricing" className="block px-3 py-2 text-slate-300" onClick={() => setMenuOpen(false)}>Pricing</a>
              <a href="#how-it-works" className="block px-3 py-2 text-slate-300" onClick={() => setMenuOpen(false)}>How It Works</a>
              <Link to="/login" className="block px-3 py-2 text-slate-300" onClick={() => setMenuOpen(false)}>Sign In</Link>
              <Link to="/register" className="block px-3 py-2 text-cyan-400 font-medium" onClick={() => setMenuOpen(false)}>Get Started →</Link>
            </div>
          )}
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 via-transparent to-transparent" />
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute top-40 right-1/4 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="max-w-7xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-cyan-300 text-sm mb-8">
            <Zap className="w-4 h-4" />
            Now with Multi-Tunnel Anti-Blocking
          </div>
          <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-6">
            VoIP Bandwidth{' '}
            <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              Optimization
            </span>
            {' '}Cloud Platform
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10">
            Deploy encrypted tunnels, optimize VoIP bandwidth, and manage your
            entire infrastructure from a single self-service portal.
            No support calls needed.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/register" className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 rounded-2xl text-lg font-semibold transition-all shadow-xl shadow-cyan-500/30 flex items-center gap-2">
              Start Free — Get $10 Credit
              <ArrowRight className="w-5 h-5" />
            </Link>
            <a href="#features" className="px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-lg font-medium transition-all">
              See How It Works
            </a>
          </div>
          <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-sm text-slate-500">
            <span className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Pay As You Go</span>
            <span className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Hourly Billing</span>
            <span className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Self-Managed</span>
            <span className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> 300+ Router Models</span>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Enterprise Features, Simple Platform</h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              Everything you need to run a successful VoIP bandwidth optimization service
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <div key={i} className="group p-6 bg-white/5 hover:bg-white/[0.07] border border-white/5 hover:border-cyan-500/20 rounded-2xl transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 flex items-center justify-center text-cyan-400 mb-4 group-hover:scale-110 transition-transform">
                  {f.icon}
                </div>
                <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="py-20 px-4 bg-white/[0.02]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Get Started in 5 Minutes</h2>
            <p className="text-slate-400 text-lg">No technical knowledge required. Seriously.</p>
          </div>
          <div className="relative">
            <div className="absolute left-8 top-0 bottom-0 w-px bg-gradient-to-b from-cyan-500/50 via-blue-500/30 to-transparent hidden md:block" />
            <div className="space-y-12">
              {steps.map((s, i) => (
                <div key={i} className="relative flex items-start gap-8 group">
                  <div className="hidden md:flex w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 items-center justify-center text-xl font-bold shadow-lg shadow-cyan-500/20 z-10 group-hover:scale-110 transition-transform">
                    {s.num}
                  </div>
                  <div className="flex-1 p-6 bg-white/5 rounded-2xl border border-white/5 hover:border-cyan-500/20 transition-all">
                    <h3 className="text-xl font-semibold mb-2">{s.title}</h3>
                    <p className="text-slate-400">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── PRICING CALCULATOR ── */}
      <section id="pricing" className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Simple, Transparent Pricing</h2>
            <p className="text-slate-400 text-lg">Pay only for what you use. No contracts. No surprises.</p>
          </div>

          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-white/10 rounded-3xl p-8 md:p-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-cyan-400" />
                  </div>
                  <h3 className="text-2xl font-bold">Cost Calculator</h3>
                </div>
                <div className="space-y-6">
                  <div>
                    <label className="text-sm text-slate-400 mb-2 block">Ports</label>
                    <input type="range" min="16" max="256" step="16" value={ports}
                      onChange={e => setPorts(Number(e.target.value))}
                      className="w-full h-2 bg-slate-700 rounded-full appearance-none cursor-pointer accent-cyan-500" />
                    <div className="flex justify-between text-xs text-slate-500 mt-1">
                      <span>16</span><span>64</span><span>128</span><span>256</span>
                    </div>
                    <p className="text-2xl font-bold text-cyan-400 mt-2">{ports} Ports</p>
                  </div>
                  <div>
                    <label className="text-sm text-slate-400 mb-2 block">Hours per Day</label>
                    <input type="range" min="1" max="24" value={hours}
                      onChange={e => setHours(Number(e.target.value))}
                      className="w-full h-2 bg-slate-700 rounded-full appearance-none cursor-pointer accent-cyan-500" />
                    <div className="flex justify-between text-xs text-slate-500 mt-1">
                      <span>1h</span><span>8h</span><span>16h</span><span>24h</span>
                    </div>
                    <p className="text-2xl font-bold text-cyan-400 mt-2">{hours}h / day</p>
                  </div>
                </div>
              </div>
              <div className="bg-slate-900/50 rounded-2xl p-8 border border-white/5">
                <p className="text-sm text-slate-400 mb-2">Estimated Cost</p>
                <div className="text-5xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent mb-2">
                  ${monthlyCost}
                </div>
                <p className="text-slate-500 text-sm mb-6">per month (30 days)</p>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between py-2 border-b border-white/5">
                    <span className="text-slate-400">Ports</span>
                    <span className="text-white font-mono">{ports}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-white/5">
                    <span className="text-slate-400">Hourly Rate</span>
                    <span className="text-white font-mono">$0.083 / port</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-white/5">
                    <span className="text-slate-400">Daily</span>
                    <span className="text-white font-mono">${dailyCost}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-slate-400">Monthly Total</span>
                    <span className="text-cyan-400 font-bold font-mono">${monthlyCost}</span>
                  </div>
                </div>
                <Link to="/register"
                  className="mt-6 w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 rounded-xl font-medium transition-all">
                  Get Started — ${Math.min(10, Number(monthlyCost) > 0 ? 10 : 0)} Free Credit
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── ISO DOWNLOADS ── */}
      <section id="downloads" className="py-20 px-4 bg-white/[0.02]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Download Pre-Built ISOs</h2>
            <p className="text-slate-400 text-lg">Ready-to-boot images for your hardware. No configuration needed.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: <Server className="w-8 h-8" />, title: 'PC / Server', desc: 'Full bandwidth optimization for x86_64 systems. Includes CMER engine, WireGuard, and management agent.', size: '~850 MB', tag: 'Most Popular' },
              { icon: <Cpu className="w-8 h-8" />, title: 'Raspberry Pi', desc: 'Lightweight Pi ISO for ARM devices. Perfect for edge deployments with low power consumption.', size: '~520 MB', tag: 'Best for Edge' },
              { icon: <Radio className="w-8 h-8" />, title: 'Router Edition', desc: 'OpenWRT-based firmware for 300+ router models. Flash directly to supported hardware.', size: '~120 MB', tag: '300+ Models' },
            ].map((iso, i) => (
              <div key={i} className="group p-6 bg-white/5 border border-white/5 hover:border-cyan-500/20 rounded-2xl transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 flex items-center justify-center text-cyan-400">
                    {iso.icon}
                  </div>
                  <span className="px-3 py-1 bg-cyan-500/10 text-cyan-300 text-xs rounded-full">{iso.tag}</span>
                </div>
                <h3 className="text-lg font-semibold mb-2">{iso.title}</h3>
                <p className="text-sm text-slate-400 mb-4">{iso.desc}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">{iso.size}</span>
                  <button className="text-sm text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
                    onClick={() => navigate('/register')}>
                    <Download className="w-4 h-4" /> Download
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="p-12 bg-gradient-to-br from-cyan-500/10 to-blue-600/10 border border-cyan-500/20 rounded-3xl">
            <h2 className="text-4xl font-bold mb-4">Ready to Optimize Your VoIP?</h2>
            <p className="text-lg text-slate-400 mb-8">
              Join hundreds of customers worldwide. Get $10 free credit when you sign up.
            </p>
            <Link to="/register" className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 rounded-2xl text-lg font-semibold transition-all shadow-xl shadow-cyan-500/30">
              Create Free Account
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-white/5 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Radio className="w-5 h-5 text-cyan-400" />
                <span className="font-bold">VPN.net</span>
              </div>
              <p className="text-xs text-slate-500">VoIP bandwidth optimization cloud platform.</p>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-3">Product</h4>
              <div className="space-y-2 text-xs text-slate-400">
                <a href="#features" className="block hover:text-white transition-colors">Features</a>
                <a href="#pricing" className="block hover:text-white transition-colors">Pricing</a>
                <a href="#downloads" className="block hover:text-white transition-colors">Downloads</a>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-3">Support</h4>
              <div className="space-y-2 text-xs text-slate-400">
                <a href="#" className="block hover:text-white transition-colors">Documentation</a>
                <a href="#" className="block hover:text-white transition-colors">API Reference</a>
                <a href="#" className="block hover:text-white transition-colors">Contact</a>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-3">Legal</h4>
              <div className="space-y-2 text-xs text-slate-400">
                <a href="#" className="block hover:text-white transition-colors">Terms of Service</a>
                <a href="#" className="block hover:text-white transition-colors">Privacy Policy</a>
              </div>
            </div>
          </div>
          <div className="text-center text-xs text-slate-600 pt-8 border-t border-white/5">
            © {new Date().getFullYear()} VPN.net Platform. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
