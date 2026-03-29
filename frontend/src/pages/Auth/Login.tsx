import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { Lock, User, Terminal, ChevronRight, ShieldCheck, Activity } from 'lucide-react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { NeonInput, MagneticButton } from '../../components/ui/SharedUI';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!email.trim()) {
      setError('Email is required');
      setLoading(false);
      return;
    }

    await new Promise((r) => setTimeout(r, 800));

    const success = login(email, password);
    if (success) {
      navigate('/');
    } else {
      setError('Invalid credentials');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-base relative overflow-hidden font-sans">
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 left-0 w-full h-full opacity-[0.03] pointer-events-none bg-[radial-gradient(#00d4ff_1px,transparent_1px)] [background-size:32px_32px]" />
        <div className="scanline" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent-primary/5 rounded-full blur-[120px]" />
        <div className="absolute top-1/4 right-1/4 w-[300px] h-[300px] bg-status-info/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 left-1/4 w-[250px] h-[250px] bg-status-danger/3 rounded-full blur-[80px]" />
        {/* Floating particles */}
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-accent-primary/30"
            style={{
              left: `${15 + i * 15}%`,
              top: `${20 + (i * 11) % 60}%`,
              animation: `float-particle ${4 + i * 0.7}s ease-in-out infinite`,
              animationDelay: `${i * 0.5}s`,
            }}
          />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30, rotateX: -5 }}
        animate={{ opacity: 1, y: 0, rotateX: 0 }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-[420px] mx-4 z-10"
        style={{ perspective: '1000px' }}
      >
        {/* System Header */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-center mb-10 text-center space-y-4"
        >
          <div className="relative group">
            <div className="absolute -inset-6 bg-accent-primary/15 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
            <div className="w-20 h-20 rounded-xl bg-bg-surface border border-accent-primary/50 flex items-center justify-center relative shadow-[0_0_40px_rgba(0,212,255,0.2)] overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-accent-primary/10 to-transparent" />
              <Terminal className="w-10 h-10 text-accent-primary relative z-10" />
            </div>
          </div>

          <div className="space-y-1">
            <h1 className="text-3xl font-black text-text-primary tracking-tighter uppercase font-display leading-none">
              <span className="holo-text">SmartPort</span>
              <span className="block text-sm tracking-[0.4em] font-black opacity-80 mt-1 text-text-primary">Intelligence</span>
            </h1>
          </div>
        </motion.div>

        {/* Tactical Authorization Panel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="glass-premium p-8 rounded-xl relative shadow-2xl overflow-hidden group"
        >
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity duration-700">
            <ShieldCheck className="w-24 h-24" />
          </div>

          <div className="flex items-center gap-3 mb-8 border-b border-bg-border/30 pb-4">
            <div className="w-1.5 h-1.5 rounded-full bg-accent-primary animate-pulse" />
            <span className="text-[10px] font-black text-text-muted tracking-[0.2em] uppercase">Security_Core: Auth_Pending</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <motion.div
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5, duration: 0.4 }}
              className="space-y-2"
            >
              <label className="text-[9px] font-black text-text-muted uppercase tracking-widest pl-1 block">Operator_ID</label>
              <NeonInput
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="EX: ROOT@SMARTPORT.INTERNAL"
                id="login-email"
                icon={<User className="w-4 h-4" />}
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6, duration: 0.4 }}
              className="space-y-2"
            >
              <label className="text-[9px] font-black text-text-muted uppercase tracking-widest pl-1 block">Access_Crypt</label>
              <NeonInput
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                id="login-password"
                icon={<Lock className="w-4 h-4" />}
              />
            </motion.div>

            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, x: -10 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                className="p-3 bg-status-danger/5 border border-status-danger/20 rounded-md flex items-center gap-2"
              >
                <Activity className="w-3.5 h-3.5 text-status-danger" />
                <span className="text-[9px] font-black text-status-danger uppercase tracking-tighter">ERROR: {error}</span>
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.4 }}
            >
              <MagneticButton
                type="submit"
                id="login-submit"
                disabled={loading}
                variant="primary"
                className={clsx(
                  "w-full py-4",
                  loading && "opacity-60"
                )}
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-bg-base/30 border-t-bg-base rounded-full animate-spin" />
                ) : (
                  <div className="flex items-center justify-center gap-3">
                    <span>Authorize_Access</span>
                    <ChevronRight className="w-4 h-4 animate-bounce-x" />
                  </div>
                )}
                {/* Sweep shimmer */}
                {!loading && (
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/15 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                )}
              </MagneticButton>
            </motion.div>
          </form>

          <div className="mt-8 pt-6 border-t border-bg-border/30 flex flex-col items-center gap-3">
            <div className="flex items-center gap-4">
              <div className="w-12 h-px bg-bg-border" />
              <span className="text-[10px] font-bold text-text-muted uppercase font-mono">Terminal v4.0.8</span>
              <div className="w-12 h-px bg-bg-border" />
            </div>
            <p className="text-[8px] font-black text-text-muted tracking-widest text-center leading-relaxed">
              SECURE DATA LINK ESTABLISHED. UNAUTHORIZED ACCESS ATTEMPTS ARE LOGGED BY CENTRAL INTELLIGENCE.
            </p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
