import { clsx } from 'clsx';
import { animate, motion } from 'framer-motion';
import { useEffect, useRef, useCallback, useState } from 'react';
import { useTilt3D, useRipple } from '../../hooks/useInteractions';

interface StatusBadgeProps {
  status: 'LOW' | 'MEDIUM' | 'HIGH' | 'UNKNOWN' | 'AIS' | 'SATELLITE' | string;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  const colors: Record<string, string> = {
    LOW: 'text-status-safe border-status-safe/30 bg-status-safe/10 dark:bg-status-safe/5',
    MEDIUM: 'text-status-warn border-status-warn/30 bg-status-warn/10 dark:bg-status-warn/5',
    HIGH: 'text-status-danger border-status-danger/30 bg-status-danger/10 dark:bg-status-danger/5',
    AIS: 'text-accent-primary border-accent-primary/30 bg-accent-glow',
    SATELLITE: 'text-status-info border-status-info/30 bg-status-info/10 dark:bg-status-info/5',
    UNKNOWN: 'text-text-muted border-bg-border bg-bg-base/50',
  };

  const displayMap: Record<string, string> = {
    HIGH: 'ÉLEVÉ',
    MEDIUM: 'MODÉRÉ',
    LOW: 'FAIBLE',
  };
  const label = displayMap[status] || status;

  return (
    <span
      className={clsx(
        'inline-flex items-center font-bold border uppercase tracking-widest font-display',
        colors[status] || colors.UNKNOWN,
        size === 'sm' ? 'px-2 py-0.5 text-[9px]' : 'px-3 py-1 text-[10px]'
      )}
    >
      <span
        className={clsx(
          'w-1 h-1 rounded-full mr-1.5',
          status === 'LOW' && 'bg-status-safe shadow-[0_0_5px_rgba(0,255,136,0.6)] animate-pulse',
          status === 'MEDIUM' && 'bg-status-warn shadow-[0_0_5px_rgba(255,170,0,0.6)]',
          status === 'HIGH' && 'bg-status-danger shadow-[0_0_5px_rgba(255,51,102,0.6)] animate-pulse',
          status === 'AIS' && 'bg-accent-primary shadow-[0_0_5px_rgba(0,212,255,0.6)]',
          status === 'SATELLITE' && 'bg-status-info shadow-[0_0_5px_rgba(124,58,237,0.6)]',
          !colors[status] && 'bg-text-muted'
        )}
      />
      {label}
    </span>
  );
}

function CountUp({ value }: { value: number | string }) {
  const nodeRef = useRef<HTMLSpanElement>(null);
  const prevValue = useRef<number>(0);

  useEffect(() => {
    if (typeof value !== 'number') return;
    const node = nodeRef.current;
    if (!node) return;

    const from = prevValue.current;
    prevValue.current = value;

    const controls = animate(from, value, {
      duration: 1.8,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (latest) => {
        node.textContent = Math.round(latest).toLocaleString();
      },
    });

    return () => controls.stop();
  }, [value]);

  if (typeof value !== 'number') return <span>{value}</span>;
  return <span ref={nodeRef} className="data-value">0</span>;
}

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  color?: 'accent' | 'warn' | 'danger' | 'default';
  pulse?: boolean;
  customColor?: string;
  index?: number;
}

export function KPICard({ title, value, subtitle, icon, color = 'default', pulse, customColor, index = 0 }: KPICardProps) {
  const { ref: tiltRef, style: tiltStyle } = useTilt3D(8);
  const glowRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const el = glowRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty('--glow-x', `${e.clientX - rect.left}px`);
    el.style.setProperty('--glow-y', `${e.clientY - rect.top}px`);
  }, []);

  const borderColorMap = {
    accent: 'border-accent-primary/20 after:bg-accent-primary',
    warn: 'border-status-warn/20 after:bg-status-warn',
    danger: 'border-status-danger/20 after:bg-status-danger',
    default: 'border-bg-border after:bg-bg-border',
  };

  const iconColorMap = {
    accent: 'text-accent-primary bg-accent-primary/10',
    warn: 'text-status-warn bg-status-warn/10',
    danger: 'text-status-danger bg-status-danger/10',
    default: 'text-text-muted bg-bg-elevated',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, rotateX: -15 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ duration: 0.6, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
      style={{ perspective: '800px' }}
    >
      <div
        ref={(el) => {
          (tiltRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
          (glowRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
        }}
        onMouseMove={handleMouseMove}
        style={{ ...tiltStyle, ...(customColor ? { borderColor: `${customColor}33`, boxShadow: pulse ? `0 0 25px ${customColor}18` : undefined } : {}) }}
        className={clsx(
          'relative rounded-lg border bg-bg-surface/80 p-5 overflow-hidden group glow-border',
          'after:absolute after:top-0 after:left-0 after:right-0 after:h-[2px] after:opacity-40 after:transition-opacity hover:after:opacity-100',
          'backdrop-blur-xl transition-shadow duration-500',
          'hover:shadow-[0_8px_40px_rgba(0,212,255,0.08)]',
          !customColor && borderColorMap[color],
          pulse && 'animate-pulse border-opacity-60'
        )}
      >
        {/* Ambient glow on hover */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-br from-accent-primary/[0.03] to-transparent" />
        </div>

        {/* Background decoration dots */}
        <div className="absolute top-2 right-2 w-12 h-12 opacity-[0.03] text-accent-primary">
          <svg viewBox="0 0 100 100" fill="currentColor">
            <circle cx="10" cy="10" r="2" />
            <circle cx="30" cy="10" r="2" />
            <circle cx="50" cy="10" r="2" />
            <circle cx="10" cy="30" r="2" />
            <circle cx="30" cy="30" r="2" />
            <circle cx="50" cy="30" r="2" />
          </svg>
        </div>

        <div className="flex items-start justify-between mb-4 relative z-10">
          <span className={clsx(
            'p-2.5 rounded-lg border border-white/5 transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-lg',
            iconColorMap[color]
          )}>
            {icon}
          </span>
        </div>

        <div className="mb-1 text-2xl font-black font-mono text-text-primary tracking-tighter relative z-10">
          <CountUp value={value} />
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.15em] text-text-muted font-display relative z-10">{title}</p>
        {subtitle && <p className="text-[10px] text-text-muted mt-1 font-mono relative z-10">{subtitle}</p>}
      </div>
    </motion.div>
  );
}

export function LoadingSkeleton({ className = '' }: { className?: string }) {
  return <div className={clsx('skeleton', className)} />;
}

export function EmptyState({ message, icon }: { message: string; icon?: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-20 text-text-muted"
    >
      {icon && <div className="mb-4 text-bg-border">{icon}</div>}
      <p className="text-xs uppercase tracking-widest font-bold">{message}</p>
    </motion.div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-status-danger">
      <p className="text-xs font-bold uppercase tracking-widest mb-4">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="neon-btn neon-btn-danger px-4 py-2 text-[10px] font-bold uppercase tracking-widest rounded border border-status-danger/30 bg-status-danger/5 hover:bg-status-danger/10 transition-colors"
        >
          Retry System
        </button>
      )}
    </div>
  );
}

export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-8 scanline">
      <motion.h1
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="text-3xl font-black text-text-primary uppercase tracking-[0.1em] font-display"
      >
        {title}
      </motion.h1>
      {subtitle && (
        <motion.p
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="text-xs text-text-muted mt-2 font-medium tracking-wide"
        >
          {subtitle}
        </motion.p>
      )}
    </div>
  );
}

/**
 * Magnetic Button — pulls towards cursor on hover, ripple on click, neon glow
 */
export function MagneticButton({
  children,
  onClick,
  className = '',
  variant = 'primary',
  disabled = false,
  id,
  type = 'button',
}: {
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent) => void;
  className?: string;
  variant?: 'primary' | 'ghost' | 'danger';
  disabled?: boolean;
  id?: string;
  type?: 'button' | 'submit';
}) {
  const btnRef = useRef<HTMLButtonElement>(null);
  const rippleRef = useRipple();

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const el = btnRef.current;
    if (!el || disabled) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    el.style.transform = `translate(${x * 0.2}px, ${y * 0.2}px)`;
  }, [disabled]);

  const handleMouseLeave = useCallback(() => {
    const el = btnRef.current;
    if (!el) return;
    el.style.transform = 'translate(0, 0)';
  }, []);

  const variants = {
    primary: 'bg-accent-primary text-bg-base hover:shadow-[0_0_25px_rgba(0,212,255,0.4)] neon-btn',
    ghost: 'bg-bg-surface border border-bg-border text-text-muted hover:text-accent-primary hover:border-accent-primary/50 neon-btn',
    danger: 'bg-status-danger/10 border border-status-danger/30 text-status-danger neon-btn neon-btn-danger',
  };

  return (
    <button
      ref={(el) => {
        (btnRef as React.MutableRefObject<HTMLButtonElement | null>).current = el;
        (rippleRef as React.MutableRefObject<HTMLElement | null>).current = el;
      }}
      type={type}
      id={id}
      disabled={disabled}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={clsx(
        'relative rounded font-black text-[10px] uppercase tracking-[0.2em] transition-all duration-300 overflow-hidden cursor-pointer',
        disabled && 'opacity-50 cursor-not-allowed',
        variants[variant],
        className
      )}
      style={{ transition: 'transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94), box-shadow 0.3s ease, background 0.3s ease' }}
    >
      {children}
    </button>
  );
}

/**
 * Glass Card — glass panel with 3D tilt + glow border
 */
export function GlassCard({
  children,
  className = '',
  index = 0,
  enableTilt = true,
}: {
  children: React.ReactNode;
  className?: string;
  index?: number;
  enableTilt?: boolean;
}) {
  const { ref: tiltRef, style: tiltStyle } = useTilt3D(enableTilt ? 6 : 0);
  const glowRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const el = glowRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty('--glow-x', `${e.clientX - rect.left}px`);
    el.style.setProperty('--glow-y', `${e.clientY - rect.top}px`);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 40, rotateX: -10 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ duration: 0.7, delay: index * 0.08, ease: [0.16, 1, 0.3, 1] }}
      style={{ perspective: '1000px' }}
    >
      <div
        ref={(el) => {
          (tiltRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
          (glowRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
        }}
        onMouseMove={handleMouseMove}
        style={enableTilt ? tiltStyle : undefined}
        className={clsx('glass-panel glow-border rounded-lg', className)}
      >
        {children}
      </div>
    </motion.div>
  );
}

/**
 * Neon Input — glowing border on focus, smooth transitions
 */
export function NeonInput({
  icon,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { icon?: React.ReactNode }) {
  const [focused, setFocused] = useState(false);

  return (
    <div className={clsx(
      'relative group/input transition-all duration-300 rounded',
      focused && 'shadow-[0_0_20px_rgba(0,212,255,0.1)]'
    )}>
      {icon && (
        <div className={clsx(
          'absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-300',
          focused ? 'text-accent-primary' : 'text-text-muted'
        )}>
          {icon}
        </div>
      )}
      <input
        {...props}
        onFocus={(e) => { setFocused(true); props.onFocus?.(e); }}
        onBlur={(e) => { setFocused(false); props.onBlur?.(e); }}
        className={clsx(
          'w-full bg-bg-base border rounded py-3 pr-4 text-xs font-mono text-text-primary placeholder:text-text-muted/30 outline-none transition-all duration-300',
          icon ? 'pl-10' : 'pl-4',
          focused
            ? 'border-accent-primary/50 shadow-[inset_0_0_15px_rgba(0,212,255,0.03)]'
            : 'border-bg-border',
          props.className
        )}
      />
      {/* Animated bottom glow line */}
      <div className={clsx(
        'absolute bottom-0 left-1/2 -translate-x-1/2 h-[2px] bg-accent-primary rounded-full transition-all duration-500',
        focused ? 'w-full opacity-60' : 'w-0 opacity-0'
      )} />
    </div>
  );
}
