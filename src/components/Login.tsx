import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Radio, Mail, Lock, ArrowRight, AlertCircle, Loader, Shield } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const role = await login(email, password);
      if (role === 'admin') navigate('/admin');
      else if (role === 'client') navigate('/portal');
      else setError('Invalid email or password');
    } catch {
      setError('Login failed. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
              <Radio className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">VPN.net</span>
          </Link>
          <h1 className="text-2xl font-bold text-white mt-6 mb-2">Welcome Back</h1>
          <p className="text-slate-400 text-sm">Sign in to manage your services</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-slate-300 mb-1.5 block">Email / Username</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input type="text" value={email} onChange={e => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all"
                placeholder="you@company.com" required />
            </div>
          </div>
          <div>
            <label className="text-sm text-slate-300 mb-1.5 block">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all"
                placeholder="Enter your password" required />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <button type="submit" disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 rounded-xl font-semibold transition-all shadow-lg shadow-cyan-500/25">
            {loading ? (
              <><Loader className="w-5 h-5 animate-spin" /> Signing In...</>
            ) : (
              <><ArrowRight className="w-5 h-5" /> Sign In</>
            )}
          </button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5" /></div>
            <div className="relative flex justify-center"><span className="px-4 text-xs text-slate-600 bg-slate-950">Test Accounts</span></div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button type="button" onClick={() => { setEmail('superadmin'); setPassword('admin123'); }}
              className="flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-slate-400 hover:text-white hover:bg-white/10 transition-all">
              <Shield className="w-3 h-3 text-cyan-400" />
              Admin: superadmin
            </button>
            <button type="button" onClick={() => { setEmail('admin'); setPassword('admin123'); }}
              className="flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-slate-400 hover:text-white hover:bg-white/10 transition-all">
              <Shield className="w-3 h-3 text-cyan-400" />
              Admin: admin
            </button>
          </div>

          <p className="text-center text-sm text-slate-500 pt-2">
            Don't have an account?{' '}
            <Link to="/register" className="text-cyan-400 hover:text-cyan-300 transition-colors font-medium">Create Account</Link>
          </p>
          <p className="text-center text-xs text-slate-600">
            <Link to="/" className="hover:text-slate-400 transition-colors">← Back to Home</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
