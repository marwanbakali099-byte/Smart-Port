import { NavLink } from 'react-router-dom';
import {
  Map,
  BarChart3,
  Ship,
  Anchor,
  AlertTriangle,
  Calendar,
  Satellite,
  ChevronLeft,
  ChevronRight,
  Settings,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';

const navItems = [
  { to: '/', icon: Map, label: 'Overview', id: 'nav-map' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics', id: 'nav-analytics' },
  { to: '/vessels', icon: Ship, label: 'Vessels', id: 'nav-vessels' },
  { to: '/ports', icon: Anchor, label: 'Ports', id: 'nav-ports' },
  { to: '/detection', icon: AlertTriangle, label: 'Alerts', id: 'nav-detection' },
  { to: '/events', icon: Calendar, label: 'Events', id: 'nav-events' },
  { to: '/satellite', icon: Satellite, label: 'Satellite', id: 'nav-satellite' },
];

interface SidebarProps {
  isExpanded: boolean;
  onToggle: () => void;
}

export default function Sidebar({ isExpanded, onToggle }: SidebarProps) {
  return (
    <aside
      className={clsx(
        "fixed left-0 top-0 h-screen z-[1002] transition-all duration-300 flex flex-col border-r border-bg-border bg-bg-surface/95 backdrop-blur-xl",
        isExpanded ? "w-[240px]" : "w-[72px]"
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-bg-border relative overflow-hidden group">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded bg-accent-glow flex items-center justify-center flex-shrink-0 animate-pulse-glow">
            <Ship className="w-5 h-5 text-accent-primary" />
          </div>
          {isExpanded && (
            <div className="animate-fade-in whitespace-nowrap">
              <h1 className="text-sm font-black tracking-[0.15em] text-accent-primary uppercase font-display">
                SmartPort
              </h1>
              <p className="text-[9px] text-text-muted font-bold tracking-[0.2em] uppercase">
                Intelligence
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Toggle Button */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-bg-elevated border border-bg-border flex items-center justify-center text-text-muted hover:text-accent-primary transition-colors z-50 shadow-lg"
      >
        {isExpanded ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
      </button>

      {/* Navigation */}
      <nav className="flex-1 py-6 px-3 space-y-2 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            id={item.id}
            end={item.to === '/'}
            className={({ isActive }) =>
              clsx(
                "flex items-center gap-4 px-3 py-2.5 rounded transition-all duration-200 group relative",
                isActive
                  ? "bg-accent-primary/10 text-accent-primary dark:bg-accent-glow/5"
                  : "text-text-secondary hover:bg-bg-elevated hover:text-text-primary"
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute left-0 top-1.5 bottom-1.5 w-[3.5px] bg-accent-primary rounded-r shadow-[0_0_10px_rgba(0,212,255,0.5)]"
                  />
                )}
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {isExpanded && (
                  <span className="text-xs font-semibold tracking-wide animate-fade-in uppercase">
                    {item.label}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
        
        <div className="pt-6 mt-6 border-t border-bg-border">
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              clsx(
                "flex items-center gap-4 px-3 py-2.5 rounded transition-all duration-200 group text-text-muted hover:text-text-primary",
                isActive && "text-accent-primary"
              )
            }
          >
            <Settings className="w-5 h-5 flex-shrink-0" />
            {isExpanded && (
              <span className="text-xs font-semibold tracking-wide animate-fade-in uppercase">
                Settings
              </span>
            )}
          </NavLink>
        </div>
      </nav>

      {/* User Avatar & Status */}
      <div className="p-4 border-t border-bg-border">
        <div className={clsx(
          "flex items-center gap-3 p-2 rounded bg-bg-base/50 border border-bg-border/30 overflow-hidden",
          !isExpanded && "justify-center"
        )}>
          <div className="relative flex-shrink-0">
            <div className="w-8 h-8 rounded bg-bg-elevated border border-bg-border flex items-center justify-center text-accent-primary font-bold text-xs">
              JD
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-status-safe border-2 border-bg-surface animate-pulse" />
          </div>
          {isExpanded && (
            <div className="animate-fade-in min-w-0">
              <p className="text-[11px] font-bold text-text-primary truncate uppercase">John Doe</p>
              <p className="text-[9px] text-text-muted font-medium truncate">ADMINISTRATOR</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
