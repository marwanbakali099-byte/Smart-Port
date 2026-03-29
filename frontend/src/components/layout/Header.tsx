import { useEffect, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { 
  Search, 
  Bell, 
  Clock as ClockIcon, 
  ChevronRight,
  LogOut,
  Activity,
  Sun,
  Moon,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useNavigate } from 'react-router-dom';

export default function Header() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/') return 'Live Map';
    const segment = path.split('/')[1];
    return segment.charAt(0).toUpperCase() + segment.slice(1);
  };

  return (
    <header className="h-14 border-b border-bg-border bg-bg-surface/95 backdrop-blur-xl flex items-center justify-between px-6 sticky top-0 z-[1001] shadow-sm dark:shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
      {/* Visual Glitch/Top Line */}
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-accent-primary/20 to-transparent" />

      {/* Left side — Tactical Breadcrumbs */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-bg-base border border-bg-border rounded text-[9px] font-black text-accent-primary uppercase tracking-[0.2em] shadow-inner">
           NODE_01
        </div>
        <div className="flex items-center gap-2 text-[10px] font-black tracking-widest text-text-muted uppercase font-display">
          <Link to="/" className="hover:text-accent-primary transition-colors">ROOT</Link>
          <ChevronRight className="w-3 h-3 text-bg-border" />
          <span className="text-text-primary">{getPageTitle()}</span>
        </div>
      </div>

      {/* Center — Tactical Command Search */}
      <div className="hidden md:flex flex-1 max-w-lg mx-12">
        <div className="relative w-full group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted group-focus-within:text-accent-primary transition-colors" />
          <input
            type="text"
            placeholder="COMMAND_EXECUTE: SEARCH_OBJECTIVE..."
            className="w-full bg-bg-base border border-bg-border rounded-md py-1.5 pl-10 pr-12 text-[11px] font-mono text-text-primary placeholder:text-text-muted/40 focus:outline-none focus:border-accent-primary/50 transition-all shadow-inner"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 bg-bg-elevated border border-bg-border rounded text-[9px] text-text-muted font-mono font-bold tracking-tighter">
            ⌘K
          </div>
        </div>
      </div>

      {/* Right side — System Telemetry & Operator */}
      <div className="flex items-center gap-8">
        {/* System Health Pulse */}
        <div className="hidden xl:flex items-center gap-5 border-r border-bg-border pr-8">
           <div className="flex items-center gap-2">
              <div className="relative">
                <div className="w-1.5 h-1.5 rounded-full bg-status-safe animate-pulse" />
                <div className="absolute inset-0 w-1.5 h-1.5 rounded-full bg-status-safe animate-ping" />
              </div>
              <div className="flex flex-col">
                <span className="text-[8px] font-black text-text-muted leading-none uppercase tracking-widest">Network</span>
                <span className="text-[10px] font-mono font-bold text-status-safe leading-tight">OPTIMAL</span>
              </div>
           </div>
           
           <div className="flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-accent-primary opacity-50" />
              <div className="flex flex-col">
                <span className="text-[8px] font-black text-text-muted leading-none uppercase tracking-widest">Latency</span>
                <span className="text-[10px] font-mono font-bold text-text-primary leading-tight">14ms</span>
              </div>
           </div>
        </div>

        {/* Live Clock Telemetry */}
        <div className="flex items-center gap-2 px-3 py-1 bg-bg-base border border-bg-border rounded shadow-inner">
          <ClockIcon className="w-3.5 h-3.5 text-accent-primary" />
          <span className="text-[11px] font-mono font-black text-text-primary tracking-tighter w-16 text-center">
            {time.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
        </div>

        {/* Notifications & User */}
        <div className="flex items-center gap-4">
          <button 
            onClick={toggleTheme}
            className="p-1.5 text-text-muted hover:text-accent-primary transition-all group"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <button className="relative p-1.5 text-text-muted hover:text-accent-primary transition-all group hover:shadow-[0_0_10px_rgba(0,212,255,0.2)]">
            <Bell className="w-4 h-4 group-hover:rotate-12 transition-transform" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-status-danger rounded-full border border-bg-surface animate-bounce" />
          </button>

          <div className="w-px h-8 bg-bg-border" />

          <div className="flex items-center gap-3">
            <div className="flex flex-col items-end">
               <span className="text-[10px] font-black text-text-primary uppercase tracking-tight leading-none group-hover:text-accent-primary transition-colors">
                 {user?.username || 'OP_ALPHA'}
               </span>
               <span className="text-[8px] font-bold text-text-muted uppercase tracking-widest">Authenticated</span>
            </div>
            
            <button
              onClick={handleLogout}
              className="group w-9 h-9 rounded bg-bg-elevated border border-bg-border flex items-center justify-center text-text-muted hover:text-status-danger hover:border-status-danger/30 transition-all hover:bg-status-danger/5 hover:shadow-[0_0_12px_rgba(255,51,102,0.2)]"
            >
              <LogOut className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
