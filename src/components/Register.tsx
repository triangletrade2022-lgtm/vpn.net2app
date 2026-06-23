import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Radio, Mail, Lock, Building2, User, Phone, Globe, ArrowRight, Check, AlertCircle, Loader } from 'lucide-react';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '', confirmPassword: '', company: '', name: '', phone: '', country: '' });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.email || !form.password) { setError('Email and password are required'); return; }
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (form.password !== form.confirmPassword) { setError('Passwords do not match'); return; }

    setStatus('loading');
    const result = await register({
      email: form.email,
      password: form.password,
      company: form.company || form.email.split('@')[0],
      name: form.name || form.email.split('@')[0],
      phone: form.phone,
      country: form.country,
    });

    if (result.success) {
      setStatus('success');
      setTimeout(() => navigate('/login'), 2000);
    } else {
      setStatus('error');
      setError(result.error || 'Registration failed');
    }
  };

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-emerald-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-3">Account Created!</h1>
          <p className="text-slate-400 mb-2">Welcome to VPN.net — you've received <span className="text-emerald-400 font-semibold">$10 free credit</span>.</p>
          <p className="text-slate-500 text-sm mb-6">Redirecting you to login...</p>
          <div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
              <Radio className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">VPN.net</span>
          </Link>
          <h1 className="text-2xl font-bold text-white mt-6 mb-2">Create Your Account</h1>
          <p className="text-slate-400 text-sm">Get $10 free credit to try the platform</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label className="text-sm text-slate-300 mb-1.5 block">Email Address *</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all"
                placeholder="you@company.com" required />
            </div>
          </div>

          {/* Name */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-slate-300 mb-1.5 block">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input type="text" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 transition-all"
                  placeholder="John Doe" />
              </div>
            </div>
            <div>
              <label className="text-sm text-slate-300 mb-1.5 block">Company</label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input type="text" value={form.company} onChange={e => setForm(p => ({ ...p, company: e.target.value }))}
                  className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 transition-all"
                  placeholder="My Company" />
              </div>
            </div>
          </div>

          {/* Phone + Country */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-slate-300 mb-1.5 block">Phone</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input type="tel" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                  className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 transition-all"
                  placeholder="+88017..." />
              </div>
            </div>
            <div>
              <label className="text-sm text-slate-300 mb-1.5 block">Country</label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <select value={form.country} onChange={e => setForm(p => ({ ...p, country: e.target.value }))}
                  className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-cyan-500/50 transition-all appearance-none">
                  <option value="" className="bg-slate-900">Select country</option>
                  <option value="bangladesh" className="bg-slate-900">🇧🇩 Bangladesh</option>
                  <option value="india" className="bg-slate-900">🇮🇳 India</option>
                  <option value="pakistan" className="bg-slate-900">🇵🇰 Pakistan</option>
                  <option value="world" className="bg-slate-900">🌍 Other</option>
                </select>
              </div>
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="text-sm text-slate-300 mb-1.5 block">Password *</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all"
                placeholder="Min 6 characters" required minLength={6} />
            </div>
          </div>

          <div>
            <label className="text-sm text-slate-300 mb-1.5 block">Confirm Password *</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input type="password" value={form.confirmPassword} onChange={e => setForm(p => ({ ...p, confirmPassword: e.target.value }))}
                className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all"
                placeholder="Repeat password" required />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <button type="submit" disabled={status === 'loading'}
            className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 rounded-xl font-semibold transition-all shadow-lg shadow-cyan-500/25">
            {status === 'loading' ? (
              <><Loader className="w-5 h-5 animate-spin" /> Creating Account...</>
            ) : (
              <><ArrowRight className="w-5 h-5" /> Create Free Account — Get $10 Credit</>
            )}
          </button>

          <p className="text-center text-sm text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="text-cyan-400 hover:text-cyan-300 transition-colors">Sign In</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
