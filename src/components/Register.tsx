declare global { interface Window { google?: any } }

import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Radio, Mail, Lock, Building2, User, Phone, Globe, ArrowRight, Check, AlertCircle, Loader } from 'lucide-react';

const GOOGLE_CLIENT_ID = ''; // Set your Google OAuth Client ID here

export default function Register() {
  const { register, googleLogin } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '', confirmPassword: '', company: '', name: '', phone: '', country: '' });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);
  const googleBtnRef = useRef<HTMLDivElement>(null);

  // Load Google Identity Services
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.google && googleBtnRef.current) {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleResponse,
        });
        window.google.accounts.id.renderButton(googleBtnRef.current, {
          theme: 'outline',
          size: 'large',
          width: 350,
          text: 'signup_with',
          shape: 'rectangular',
        });
      }
    };
    document.head.appendChild(script);
    return () => { document.head.removeChild(script); };
  }, []);

  const handleGoogleResponse = async (response: any) => {
    setGoogleLoading(true);
    try {
      const role = await googleLogin(response.credential);
      if (role === 'client') {
        setStatus('success');
        setTimeout(() => navigate('/portal'), 1500);
      } else {
        setError('Google sign-up failed');
      }
    } catch {
      setError('Google sign-up failed');
    }
    setGoogleLoading(false);
  };

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

          {/* Google Sign-Up */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5" /></div>
            <div className="relative flex justify-center"><span className="px-4 text-xs text-slate-600 bg-slate-950">or sign up with</span></div>
          </div>

          {GOOGLE_CLIENT_ID ? (
            <div ref={googleBtnRef} className="flex justify-center"></div>
          ) : (
            <button type="button" onClick={() => window.open('https://console.cloud.google.com/apis/credentials', '_blank')}
              className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-white hover:bg-white/90 rounded-xl text-slate-900 font-medium transition-all">
              <svg viewBox="0 0 48 48" className="w-5 h-5"><path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/><path fill="#FF3D00" d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/><path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/><path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/></svg>
              Sign up with Google
            </button>
          )}
          {googleLoading && (
            <div className="flex items-center justify-center gap-2 text-sm text-slate-400">
              <Loader className="w-4 h-4 animate-spin" /> Authenticating with Google...
            </div>
          )}

          <p className="text-center text-sm text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="text-cyan-400 hover:text-cyan-300 transition-colors">Sign In</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
