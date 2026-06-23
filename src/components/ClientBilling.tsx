import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  CreditCard, Wallet, DollarSign,
  Clock, Check, Copy,
  Loader, Banknote, Bitcoin
} from 'lucide-react';

// ── USDT TRC20 Wallet — Configured by Admin ──
const USDT_WALLET = 'TRn9FNxxYUCwLv7WYvnsxwyicbxx6tTH4R';
const USDT_NETWORK = 'TRC20';

export default function ClientBilling() {
  const { user } = useAuth();
  const [amount, setAmount] = useState(25);
  const [topUpStatus, setTopUpStatus] = useState<'idle' | 'processing' | 'success'>('idle');
  const [copied, setCopied] = useState<string | null>(null);
  const [payMethod, setPayMethod] = useState<'paypal' | 'usdt'>('paypal');

  const presets = [10, 25, 50, 100, 250, 500];
  const hourly = 0.083;
  const ports = 32;
  const dailyCost = (ports * hourly * 24).toFixed(2);
  const monthlyCost = (ports * hourly * 24 * 30).toFixed(2);

  const transactions = [
    { date: '2026-06-22', desc: 'PayPal Deposit', amount: 50, status: 'completed' as const },
    { date: '2026-06-20', desc: 'Usage: 32 ports x 24h', amount: -63.74, status: 'completed' as const },
    { date: '2026-06-18', desc: 'Usage: 16 ports x 12h', amount: -15.94, status: 'completed' as const },
    { date: '2026-06-15', desc: 'Welcome Bonus', amount: 10, status: 'completed' as const },
  ];

  const handleTopUp = () => {
    setTopUpStatus('processing');
    setTimeout(() => setTopUpStatus('success'), 1500);
    setTimeout(() => setTopUpStatus('idle'), 3000);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Billing</h1>
        <p className="text-slate-400 mt-1">Manage your account balance and view transactions.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Balance */}
        <div className="lg:col-span-2 space-y-6">
          {/* Current Balance */}
          <div className="bg-gradient-to-br from-emerald-600/20 to-teal-600/10 border border-emerald-500/20 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">Available Balance</p>
                  <p className="text-3xl font-bold text-white">${user?.balance?.toFixed(2) || '0.00'}</p>
                </div>
              </div>
              <div className="px-3 py-1 bg-emerald-500/10 rounded-full text-xs text-emerald-400">Active</div>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Clock className="w-3 h-3" />
              Billed hourly — Pay As You Go
            </div>
          </div>

          {/* Top Up */}
          <div className="bg-white/5 border border-white/5 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-400" />
              Add Credit
            </h3>

            <div className="flex flex-wrap gap-2 mb-4">
              {presets.map(p => (
                <button key={p} onClick={() => setAmount(p)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    amount === p
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-white/5 text-slate-400 border border-white/5 hover:bg-white/10'
                  }`}>
                  ${p}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3 mb-4">
              <span className="text-slate-400 text-sm">Custom:</span>
              <div className="relative flex-1 max-w-xs">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                <input type="number" value={amount} min={5} max={10000}
                  onChange={e => setAmount(Number(e.target.value))}
                  className="w-full pl-8 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500/50 transition-all" />
              </div>
            </div>

            <div className="space-y-2 mb-4 text-sm">
              <div className="flex justify-between text-slate-400">
                <span>Amount</span>
                <span className="text-white font-mono">${amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Payment Method</span>
                <span className="text-white">PayPal / Credit Card</span>
              </div>
            </div>

            {/* ── Payment Method Toggle ── */}
            <div className="flex gap-2 p-1 bg-white/5 rounded-xl">
              <button onClick={() => setPayMethod('paypal')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  payMethod === 'paypal'
                    ? 'bg-emerald-600 text-white shadow-lg'
                    : 'text-slate-400 hover:text-white'
                }`}>
                <CreditCard className="w-4 h-4" /> PayPal
              </button>
              <button onClick={() => setPayMethod('usdt')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  payMethod === 'usdt'
                    ? 'bg-emerald-600 text-white shadow-lg'
                    : 'text-slate-400 hover:text-white'
                }`}>
                <Bitcoin className="w-4 h-4" /> USDT (TRC20)
              </button>
            </div>

            {/* ── PayPal Payment ── */}
            {payMethod === 'paypal' && (
              <>
                <div className="space-y-2 mb-4 text-sm">
                  <div className="flex justify-between text-slate-400">
                    <span>Amount</span>
                    <span className="text-white font-mono">${amount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Payment Method</span>
                    <span className="text-white">PayPal / Credit Card</span>
                  </div>
                </div>
                <button onClick={handleTopUp}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 rounded-xl font-medium transition-all shadow-lg shadow-emerald-500/25">
                  {topUpStatus === 'processing' ? (
                    <><Loader className="w-4 h-4 animate-spin" /> Processing...</>
                  ) : topUpStatus === 'success' ? (
                    <><Check className="w-4 h-4" /> Credit Added!</>
                  ) : (
                    <><CreditCard className="w-4 h-4" /> Add ${amount} Credit via PayPal</>
                  )}
                </button>
                <p className="text-xs text-slate-500 mt-3 text-center">
                  Secure payment processed by PayPal. Credit card accepted via guest checkout.
                </p>
              </>
            )}

            {/* ── USDT (TRC20) Payment ── */}
            {payMethod === 'usdt' && (
              <>
                <div className="bg-gradient-to-br from-orange-600/10 to-yellow-600/10 border border-orange-500/20 rounded-xl p-5 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
                      <Bitcoin className="w-5 h-5 text-orange-400" />
                    </div>
                    <div>
                      <p className="text-white font-semibold">USDT ({USDT_NETWORK})</p>
                      <p className="text-xs text-slate-400">Send USDT to the wallet below. Credit updates within minutes after confirmation.</p>
                    </div>
                  </div>

                  <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                    <p className="text-xs text-slate-500 mb-2">Wallet Address ({USDT_NETWORK})</p>
                    <div className="flex items-center gap-2 bg-slate-900 rounded-lg p-3 border border-white/5">
                      <code className="flex-1 text-sm font-mono text-orange-300 break-all">
                        {USDT_WALLET}
                      </code>
                      <button onClick={() => {navigator.clipboard.writeText(USDT_WALLET); setCopied('usdt'); setTimeout(() => setCopied(null), 2000);}}
                        className="flex-shrink-0 p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-all">
                        {copied === 'usdt' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs text-slate-400">
                    <div className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-[10px] flex-shrink-0">1</span>
                      Copy the wallet address above
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-[10px] flex-shrink-0">2</span>
                      Send <span className="text-white font-mono">${amount.toFixed(2)} USDT</span> to this address on <span className="text-orange-300">{USDT_NETWORK}</span> network
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-[10px] flex-shrink-0">3</span>
                      Contact us with your TXID to get instant credit
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-[10px] flex-shrink-0">4</span>
                      ⚠️ Only send <span className="text-orange-300">USDT on {USDT_NETWORK}</span> network. Other networks will be lost!
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-4 p-3 bg-white/5 rounded-xl">
                    <button onClick={() => {navigator.clipboard.writeText(USDT_WALLET); setCopied('usdt'); setTimeout(() => setCopied(null), 2000);}}
                      className="flex items-center gap-2 px-5 py-2.5 bg-orange-600 hover:bg-orange-700 rounded-xl text-sm font-medium transition-all shadow-lg shadow-orange-500/25">
                      {copied === 'usdt' ? <><Check className="w-4 h-4" /> Copied!</> : <><Copy className="w-4 h-4" /> Copy Wallet</>}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-600 text-center">ℹ️ Once payment is confirmed, email your TXID to billing@vpn.net for instant credit</p>
                </div>
              </>
            )}
          </div>

          {/* Bank Transfer Info */}
          <div className="bg-white/5 border border-white/5 rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <Banknote className="w-4 h-4 text-slate-400" />
              Bank Transfer
            </h3>
            <p className="text-xs text-slate-500 mb-3">
              For bank transfers, please email our billing team. Include your account email and payment receipt.
            </p>
            <button onClick={() => {navigator.clipboard.writeText('billing@vpn.net'); setCopied('email'); setTimeout(() => setCopied(null), 2000);}}
              className="flex items-center gap-2 text-xs text-cyan-400 hover:text-cyan-300 transition-colors">
              {copied === 'email' ? <><Check className="w-3 h-3" /> Copied!</> : <><Copy className="w-3 h-3" /> billing@vpn.net</>}
            </button>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Cost Estimate */}
          <div className="bg-white/5 border border-white/5 rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-white mb-4">Estimated Cost</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b border-white/5">
                <span className="text-slate-400">Ports</span>
                <span className="text-white font-mono">{ports}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/5">
                <span className="text-slate-400">Hourly Rate</span>
                <span className="text-white font-mono">${hourly.toFixed(3)}/port</span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/5">
                <span className="text-slate-400">Daily (24h)</span>
                <span className="text-white font-mono">${dailyCost}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-slate-400">Monthly (30d)</span>
                <span className="text-emerald-400 font-bold font-mono">${monthlyCost}</span>
              </div>
            </div>
          </div>

          {/* Transactions */}
          <div className="bg-white/5 border border-white/5 rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-white mb-4">Recent Transactions</h3>
            <div className="space-y-3">
              {transactions.map((tx, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                  <div>
                    <p className="text-sm text-white">{tx.desc}</p>
                    <p className="text-xs text-slate-500">{tx.date}</p>
                  </div>
                  <div className={`text-right ${tx.amount > 0 ? 'text-emerald-400' : 'text-slate-400'}`}>
                    <p className="text-sm font-mono">{tx.amount > 0 ? '+' : ''}{tx.amount.toFixed(2)}</p>
                    <p className="text-[10px] uppercase tracking-wider text-emerald-500/70">{tx.status}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
