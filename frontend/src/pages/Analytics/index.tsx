import { useQuery } from '@tanstack/react-query';
import { getPortStatus, getPortCongestionIA, getPortAnalytics } from '../../api/analytics';
import { getDetections } from '../../api/detections';
import { KPICard, StatusBadge, LoadingSkeleton, ErrorState, GlassCard } from '../../components/ui/SharedUI';
import { formatETA } from '../../utils/formatters';
import { Ship, Anchor, Brain, Activity, Target, Clock, Zap, TrendingUp, Gauge, Waves, Radar } from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { PortStatusResponse, PortCongestionIAResponse, PortAnalyticsResponse } from '../../types/models';

const PORTS = [
  { id: 6, name: 'Tanger Ville' },
  { id: 7, name: 'Tanger Med' },
];

const getCongestionColor = (level: string) => {
  switch (level) {
    case 'LOW': return 'var(--status-safe)';
    case 'MEDIUM': return 'var(--status-warn)';
    case 'HIGH': return 'var(--status-danger)';
    default: return 'var(--text-muted)';
  }
};

export default function Analytics() {
  const [selectedPort, setSelectedPort] = useState(7);

  const { data: detections } = useQuery({
    queryKey: ['detections'],
    queryFn: getDetections,
  });

  const { data: portStatus, isLoading: statusLoading } = useQuery<PortStatusResponse>({
    queryKey: ['port-status', selectedPort],
    queryFn: () => getPortStatus(selectedPort),
  });

  const { data: portAnalytics } = useQuery<PortAnalyticsResponse>({
    queryKey: ['port-analytics', selectedPort],
    queryFn: () => getPortAnalytics(selectedPort),
  });

  const { data: congestionIA, isLoading: congestionLoading } = useQuery<PortCongestionIAResponse>({
    queryKey: ['congestion-ia', selectedPort],
    queryFn: () => getPortCongestionIA(selectedPort),
  });

  const vesselStats = useMemo(() => {
    if (!detections?.features) return { total: 0, ais: 0, sat: 0, bySource: [] };
    const mmsis = new Set<string>();
    let ais = 0, sat = 0;
    detections.features.forEach((f) => {
      if (!mmsis.has(f.properties.mmsi)) {
        mmsis.add(f.properties.mmsi);
        if (f.properties.source === 'ais') ais++;
        else sat++;
      }
    });
    return {
      total: mmsis.size,
      ais,
      sat,
      bySource: [
        { name: 'AIS', value: ais, color: 'var(--accent-primary)' },
        { name: 'Satellite', value: sat, color: 'var(--status-danger)' },
      ],
    };
  }, [detections]);

  useEffect(() => {
    if (portAnalytics && portAnalytics.historical_data) {
      const key = `port_history_${selectedPort}`;
      const existing = JSON.parse(localStorage.getItem(key) || '[]');
      const lastPoint = portAnalytics.historical_data[portAnalytics.historical_data.length - 1];
      if (existing.length === 0 || existing[existing.length - 1].time !== lastPoint.time) {
        const updated = [...existing, { ...lastPoint, savedAt: new Date().toISOString() }].slice(-48);
        localStorage.setItem(key, JSON.stringify(updated));
      }
    }
  }, [portAnalytics, selectedPort]);

  const trafficData = useMemo(() => {
    if (portAnalytics?.historical_data) return portAnalytics.historical_data;
    return [];
  }, [portAnalytics]);

  const congestionColor = useMemo(() =>
    getCongestionColor(portStatus?.congestion || 'UNKNOWN'),
  [portStatus]);

  const confidencePercent = congestionIA?.confidence_score ? (congestionIA.confidence_score * 100).toFixed(2) : '96.64';

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-8 animate-fade-in pb-20">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-bg-surface via-bg-surface to-bg-elevated border border-bg-border p-8">
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#00d4ff_1px,transparent_1px)] [background-size:24px_24px]" />
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-accent-primary/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-1/3 w-[200px] h-[200px] bg-status-info/5 rounded-full blur-[80px]" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="space-y-3">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-lg bg-accent-primary/10 border border-accent-primary/30 flex items-center justify-center">
                <Radar className="w-5 h-5 text-accent-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-black text-text-primary uppercase tracking-tight font-display">
                  Strategic Intelligence
                </h1>
                <p className="text-xs text-text-muted font-medium tracking-wide mt-0.5">
                  Real-time multi-sensor analytics & predictive port operations
                </p>
              </div>
            </motion.div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-bg-base/50 rounded-md border border-bg-border">
                <div className="w-1.5 h-1.5 rounded-full bg-status-safe animate-pulse" />
                <span className="text-[9px] font-black text-text-muted tracking-widest uppercase">All systems nominal</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-bg-base/50 rounded-md border border-bg-border">
                <Zap className="w-3 h-3 text-accent-primary" />
                <span className="text-[9px] font-black text-text-muted tracking-widest uppercase">Refresh: 30s</span>
              </div>
            </div>
          </div>

          {/* Port Selector */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex bg-bg-base/80 backdrop-blur-xl border border-bg-border rounded-lg p-1 gap-1 shadow-lg"
          >
            {PORTS.map((port) => (
              <button
                key={port.id}
                onClick={() => setSelectedPort(port.id)}
                className={clsx(
                  "px-5 py-2.5 rounded-md text-[10px] font-black uppercase tracking-[0.15em] transition-all relative overflow-hidden",
                  selectedPort === port.id
                    ? "bg-accent-primary text-bg-base shadow-[0_0_20px_rgba(0,212,255,0.3)]"
                    : "text-text-muted hover:text-text-primary hover:bg-bg-elevated/50"
                )}
              >
                {selectedPort === port.id && (
                  <motion.div
                    layoutId="port-selector"
                    className="absolute inset-0 bg-accent-primary rounded-md"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    style={{ zIndex: -1 }}
                  />
                )}
                <span className="relative z-10">{port.name}</span>
              </button>
            ))}
          </motion.div>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <KPICard
          title="Global Asset Count"
          value={vesselStats.total}
          subtitle={`${vesselStats.ais} AIS · ${vesselStats.sat} VISUAL`}
          icon={<Target className="w-5 h-5" />}
          color="accent"
          index={0}
        />
        <KPICard
          title="Vessels in Hub"
          value={portStatus?.boats_in_port ?? '—'}
          subtitle={portStatus ? `AT ${PORTS.find(p => p.id === selectedPort)?.name}` : 'AWAITING...'}
          icon={<Ship className="w-5 h-5" />}
          color="default"
          customColor={congestionColor}
          pulse={portStatus?.congestion === 'HIGH'}
          index={1}
        />
        <KPICard
          title="Congestion State"
          value={portStatus?.congestion ?? '—'}
          subtitle="REAL-TIME SATURATION"
          icon={<Activity className="w-5 h-5" />}
          customColor={congestionColor}
          pulse={portStatus?.congestion === 'HIGH'}
          index={2}
        />
        <KPICard
          title="Mean Arrival Vector"
          value={portStatus?.avg_eta_minutes ? `${portStatus.avg_eta_minutes} min` : 'N/A'}
          subtitle="AI PREDICTED HUB ETA"
          icon={<Clock className="w-5 h-5" />}
          color="warn"
          index={3}
        />
        <KPICard
          title="Predictive Reliability"
          value={`${confidencePercent}%`}
          subtitle={congestionIA ? `MODEL: ${(congestionIA.model_info ?? 'XGBoost').split('—')[0]}` : 'ANALYZING...'}
          icon={<Brain className="w-5 h-5" />}
          color="accent"
          index={4}
        />
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Traffic Chart — Large */}
        <GlassCard className="p-0 overflow-hidden" index={0} enableTilt={false}>
          <div className="p-6 pb-0">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-accent-primary/10 border border-accent-primary/20 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-accent-primary" />
                </div>
                <div>
                  <h3 className="text-base font-black text-text-primary tracking-tight uppercase">Active Vessel Throughput</h3>
                  <p className="text-[11px] text-text-muted font-bold tracking-wider uppercase">Traffic Analytics</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="px-3 py-1.5 bg-bg-base/50 border border-bg-border rounded-md flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent-primary animate-pulse" />
                  <span className="text-[9px] font-mono font-bold text-accent-primary tracking-tight">AUTO-SYNC: 30s</span>
                </div>
              </div>
            </div>
          </div>
          <div className="h-[420px] px-2 pb-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trafficData}>
                <defs>
                  <linearGradient id="colorVessels" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={congestionColor} stopOpacity={0.3} />
                    <stop offset="50%" stopColor={congestionColor} stopOpacity={0.08} />
                    <stop offset="95%" stopColor={congestionColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--bg-border)" strokeDasharray="3 3" vertical={false} opacity={0.3} />
                <XAxis
                  dataKey="time"
                  tick={{ fontSize: 9, fill: 'var(--text-muted)', fontWeight: 700 }}
                  axisLine={{ stroke: 'var(--bg-border)' }}
                  tickLine={false}
                />
                <YAxis
                   tick={{ fontSize: 9, fill: 'var(--text-muted)', fontWeight: 700 }}
                   axisLine={false}
                   tickLine={false}
                   width={30}
                />
                <Tooltip
                  contentStyle={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--bg-border)',
                    borderRadius: '8px',
                    fontSize: '10px',
                    color: 'var(--text-primary)',
                    fontFamily: 'JetBrains Mono, monospace',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                  }}
                  itemStyle={{ color: 'var(--text-primary)' }}
                  cursor={{ stroke: congestionColor, strokeWidth: 1, strokeDasharray: '4 4' }}
                />
                <Area
                  type="monotone"
                  dataKey="boats"
                  stroke={congestionColor}
                  fillOpacity={1}
                  fill="url(#colorVessels)"
                  strokeWidth={2.5}
                  animationDuration={1500}
                  dot={false}
                  activeDot={{ r: 5, strokeWidth: 2, stroke: 'var(--bg-surface)' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* XGBoost AI Panel */}
        <GlassCard className="p-0 overflow-hidden" index={1}>
          <div className="p-6 border-b border-bg-border/50 bg-gradient-to-r from-accent-primary/5 to-transparent">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-accent-primary/10 border border-accent-primary/20 flex items-center justify-center">
                  <Brain className="w-5 h-5 text-accent-primary" />
                </div>
                <div>
                  <h3 className="text-base font-black text-text-primary tracking-tight uppercase">AI Forecast</h3>
                  <p className="text-[11px] text-text-muted font-bold tracking-wider uppercase">XGBoost Nucleus</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 px-2 py-1 bg-status-safe/10 border border-status-safe/20 rounded-md">
                <div className="w-1.5 h-1.5 rounded-full bg-status-safe animate-pulse" />
                <span className="text-[8px] font-black text-status-safe tracking-widest uppercase">Live</span>
              </div>
            </div>
          </div>

          <div className="p-6">
            {congestionLoading ? (
              <div className="space-y-6">
                <div className="flex justify-center py-4">
                   <div className="w-32 h-32 rounded-full border-4 border-bg-border border-t-accent-primary animate-spin" />
                </div>
                <LoadingSkeleton className="h-20 w-full" />
              </div>
            ) : congestionIA ? (
              <div className="space-y-5">
                {/* Gauge */}
                <div className="relative flex items-center justify-center py-6">
                  <svg viewBox="0 0 100 65" className="w-full max-w-[280px]">
                    <defs>
                      <filter id="glow">
                        <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                        <feMerge>
                          <feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/>
                        </feMerge>
                      </filter>
                      <linearGradient id="arcGradient" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="var(--accent-primary)" />
                        <stop offset="100%" stopColor="var(--status-safe)" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M 10 60 A 40 40 0 0 1 90 60"
                      fill="none"
                      stroke="var(--bg-border)"
                      strokeWidth="7"
                      strokeLinecap="round"
                      opacity="0.3"
                    />
                    <motion.path
                      initial={{ strokeDasharray: "0 126" }}
                      animate={{ strokeDasharray: `${(parseFloat(confidencePercent) / 100) * 126} 126` }}
                      transition={{ duration: 2, ease: "easeOut" }}
                      d="M 10 60 A 40 40 0 0 1 90 60"
                      fill="none"
                      stroke="url(#arcGradient)"
                      strokeWidth="7"
                      strokeLinecap="round"
                      filter="url(#glow)"
                    />
                    <text x="50" y="42" textAnchor="middle" className="font-mono font-black" fontSize="16" style={{ fill: 'var(--text-primary)' }}>
                      {confidencePercent}%
                    </text>
                    <text x="50" y="56" textAnchor="middle" className="font-bold uppercase" fontSize="5.5" style={{ fill: 'var(--text-muted)' }}>
                      Model Confidence
                    </text>
                  </svg>
                </div>

                {/* Prediction Badge */}
                <div className="text-center p-3 rounded-lg bg-bg-base/50 border border-bg-border/50">
                  <div className="mb-1.5">
                    <StatusBadge status={congestionIA.congestion_predictive_ia} size="md" />
                  </div>
                  <p className="text-[9px] text-text-muted font-bold tracking-widest uppercase">
                    {congestionIA.port_name}
                  </p>
                </div>

                {/* Detail Rows */}
                <div className="space-y-1.5">
                  {[
                    { label: "Detected Vessels", val: congestionIA.details.boats_count, icon: Ship },
                    { label: "Fishing Intensity", val: `${congestionIA.details.fishing_hours}h`, icon: Waves },
                    { label: "Temporal Frame", val: `${congestionIA.details.hour}:00`, icon: Clock },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between px-4 py-3.5 bg-bg-elevated/20 rounded-lg border border-bg-border/20 group hover:border-accent-primary/20 transition-colors">
                      <div className="flex items-center gap-3">
                        <item.icon className="w-4 h-4 text-text-muted group-hover:text-accent-primary transition-colors" />
                        <span className="text-[11px] text-text-muted uppercase font-bold tracking-wider">{item.label}</span>
                      </div>
                      <span className="text-sm text-text-primary font-black font-mono">{item.val}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <ErrorState message="Intelligence link disconnected" />
            )}
          </div>
        </GlassCard>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Source Fidelity — Donut */}
        <GlassCard className="p-0 overflow-hidden" index={2}>
          <div className="p-5 border-b border-bg-border/50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-status-info/10 border border-status-info/20 flex items-center justify-center">
                <Gauge className="w-4 h-4 text-status-info" />
              </div>
              <div>
                <h3 className="text-sm font-black text-text-primary tracking-tight uppercase">Source Fidelity</h3>
                <p className="text-[10px] text-text-muted font-bold tracking-wider uppercase">Sensor Distribution</p>
              </div>
            </div>
          </div>
          <div className="p-6">
            {(() => {
              const total = vesselStats.total || 1;
              const aisPercent = (vesselStats.ais / total) * 100;
              const satPercent = (vesselStats.sat / total) * 100;
              const radius = 90;
              const stroke = 18;
              const circumference = 2 * Math.PI * radius;
              const aisArc = (aisPercent / 100) * circumference;
              const satArc = (satPercent / 100) * circumference;
              const gap = 8;

              return (
                <div className="flex flex-col items-center">
                  {/* Custom SVG Donut */}
                  <div className="relative w-[260px] h-[260px]">
                    <svg viewBox="0 0 220 220" className="w-full h-full -rotate-90">
                      <defs>
                        <filter id="donut-glow-ais">
                          <feGaussianBlur stdDeviation="4" result="blur" />
                          <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                          </feMerge>
                        </filter>
                        <filter id="donut-glow-sat">
                          <feGaussianBlur stdDeviation="4" result="blur" />
                          <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                          </feMerge>
                        </filter>
                        <linearGradient id="ais-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#00d4ff" />
                          <stop offset="100%" stopColor="#0099cc" />
                        </linearGradient>
                        <linearGradient id="sat-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#ff3366" />
                          <stop offset="100%" stopColor="#ff6b9d" />
                        </linearGradient>
                      </defs>
                      {/* Background track */}
                      <circle
                        cx="110" cy="110" r={radius}
                        fill="none"
                        stroke="var(--bg-border)"
                        strokeWidth={stroke}
                        opacity="0.15"
                      />
                      {/* AIS arc */}
                      <motion.circle
                        cx="110" cy="110" r={radius}
                        fill="none"
                        stroke="url(#ais-gradient)"
                        strokeWidth={stroke}
                        strokeLinecap="round"
                        strokeDasharray={`${aisArc - gap} ${circumference - aisArc + gap}`}
                        strokeDashoffset="0"
                        filter="url(#donut-glow-ais)"
                        initial={{ strokeDasharray: `0 ${circumference}` }}
                        animate={{ strokeDasharray: `${aisArc - gap} ${circumference - aisArc + gap}` }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                      />
                      {/* Satellite arc */}
                      <motion.circle
                        cx="110" cy="110" r={radius}
                        fill="none"
                        stroke="url(#sat-gradient)"
                        strokeWidth={stroke}
                        strokeLinecap="round"
                        strokeDasharray={`${satArc - gap} ${circumference - satArc + gap}`}
                        strokeDashoffset={`${-aisArc}`}
                        filter="url(#donut-glow-sat)"
                        initial={{ strokeDasharray: `0 ${circumference}` }}
                        animate={{ strokeDasharray: `${satArc - gap} ${circumference - satArc + gap}` }}
                        transition={{ duration: 1.5, ease: "easeOut", delay: 0.3 }}
                      />
                    </svg>
                    {/* Center content */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <motion.span
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8, delay: 0.5 }}
                        className="text-5xl font-black font-mono text-text-primary tracking-tighter"
                      >
                        {vesselStats.total}
                      </motion.span>
                      <span className="text-[10px] font-black text-text-muted uppercase tracking-[0.3em] mt-1">Vessels</span>
                    </div>
                  </div>

                  {/* Legend cards */}
                  <div className="grid grid-cols-2 gap-4 mt-8 w-full">
                    <div className="relative p-4 rounded-xl bg-bg-base/50 border border-accent-primary/20 group hover:border-accent-primary/40 transition-all overflow-hidden">
                      <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-accent-primary to-accent-primary/0" />
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-accent-primary shadow-[0_0_12px_rgba(0,212,255,0.6)] animate-pulse" />
                        <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">AIS Feed</span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black font-mono text-accent-primary">{vesselStats.ais}</span>
                        <span className="text-[10px] font-bold text-text-muted">{total > 0 ? Math.round(aisPercent) : 0}%</span>
                      </div>
                    </div>
                    <div className="relative p-4 rounded-xl bg-bg-base/50 border border-status-danger/20 group hover:border-status-danger/40 transition-all overflow-hidden">
                      <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-status-danger to-status-danger/0" />
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-status-danger shadow-[0_0_12px_rgba(255,51,102,0.6)] animate-pulse" />
                        <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">Satellite</span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black font-mono text-status-danger">{vesselStats.sat}</span>
                        <span className="text-[10px] font-bold text-text-muted">{total > 0 ? Math.round(satPercent) : 0}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </GlassCard>

        {/* Logistics Registry */}
        <GlassCard className="p-0 overflow-hidden" index={3}>
          <div className="p-5 border-b border-bg-border/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-status-warn/10 border border-status-warn/20 flex items-center justify-center">
                  <Anchor className="w-4 h-4 text-status-warn" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-text-primary tracking-tight uppercase">Logistics Registry</h3>
                  <p className="text-[10px] text-text-muted font-bold tracking-wider uppercase">Port Infrastructure</p>
                </div>
              </div>
              {portStatus && <StatusBadge status={portStatus.congestion} size="md" />}
            </div>
          </div>

          <div className="p-5">
            {statusLoading ? (
              <LoadingSkeleton className="h-64 w-full" />
            ) : portStatus ? (
              <div className="space-y-5">
                {/* Port info bar */}
                <div className="flex items-center justify-between p-4 rounded-lg border border-bg-border bg-bg-base/30 group hover:border-accent-primary/20 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-accent-primary/10 border border-accent-primary/20 flex items-center justify-center">
                      <Anchor className="w-5 h-5 text-accent-primary" />
                    </div>
                    <div>
                      <p className="text-base font-black text-text-primary tracking-tight uppercase">
                        {PORTS.find((p) => p.id === selectedPort)?.name}
                      </p>
                      <p className="text-[10px] text-text-muted font-bold">
                        <span className="text-accent-primary font-mono mr-1">{portStatus.boats_in_port}</span> vessels currently at hub
                      </p>
                    </div>
                  </div>
                  {portStatus.avg_eta_minutes && (
                    <div className="text-right">
                      <p className="text-xl font-black font-mono text-text-primary tracking-tighter">
                        {formatETA(portStatus.avg_eta_minutes)}
                      </p>
                      <p className="text-[8px] font-black text-accent-primary tracking-widest uppercase">Avg ETA</p>
                    </div>
                  )}
                </div>

                {/* Vessel manifest */}
                {/* Vessel manifest — works with both real (boats: string[]) and mock (vessels_list) */}
                {(() => {
                  const vesselsMmsi: string[] = portStatus.vessels_list
                    ? portStatus.vessels_list.map((v) => v.mmsi)
                    : portStatus.boats ?? [];
                  if (vesselsMmsi.length === 0) return null;
                  return (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">Active Vessel Manifest</p>
                        <span className="text-[9px] font-mono font-bold text-accent-primary">{vesselsMmsi.length} TRACKED</span>
                      </div>
                      <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                        {vesselsMmsi.slice(0, 6).map((mmsi) => (
                          <div key={mmsi} className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-bg-elevated/20 border border-bg-border/30 text-[11px] font-mono font-bold text-text-primary hover:bg-bg-elevated/40 hover:border-accent-primary/20 transition-all group">
                            <Ship className="w-3 h-3 text-text-muted group-hover:text-accent-primary transition-colors" />
                            {mmsi}
                          </div>
                        ))}
                        {vesselsMmsi.length > 6 && (
                          <div className="flex items-center justify-center p-2.5 text-[9px] font-bold text-text-muted uppercase tracking-widest bg-bg-elevated/10 rounded-lg border border-dashed border-bg-border hover:border-accent-primary/30 transition-colors">
                            + {vesselsMmsi.length - 6} more
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {portStatus.avg_eta_minutes && (
                  <div className="p-4 rounded-lg border border-accent-primary/20 bg-accent-glow flex items-center justify-between">
                    <div className="flex items-center gap-3">
                       <Clock className="w-4 h-4 text-accent-primary" />
                       <span className="text-[10px] font-bold text-accent-primary uppercase tracking-widest">Global Fleet Arrival Vector</span>
                    </div>
                    <p className="text-xl font-black font-mono text-text-primary tracking-tighter">
                      {formatETA(portStatus.avg_eta_minutes)}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <ErrorState message="Logistics link failed" />
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
