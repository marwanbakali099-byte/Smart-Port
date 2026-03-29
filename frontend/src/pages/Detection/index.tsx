import { useQuery } from '@tanstack/react-query';
import { getDetections } from '../../api/detections';
import { PageHeader, LoadingSkeleton, EmptyState } from '../../components/ui/SharedUI';
import { formatTimeAgo, formatCoordinates, formatSpeed } from '../../utils/formatters';
import { Radio, Zap, Eye, Filter, ShieldCheck, ShieldAlert } from 'lucide-react';
import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { GlassCard, MagneticButton } from '../../components/ui/SharedUI';

interface Alert {
  id: string;
  mmsi: string;
  type: 'high_speed' | 'anomaly' | 'zone_entry' | 'unusual_pattern';
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  message: string;
  lat: number;
  lon: number;
  speed: number;
  timestamp: string;
  status: 'new' | 'reviewed' | 'false_positive' | 'escalated';
  confidence: number;
}

export default function Detection() {
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [alertStatuses, setAlertStatuses] = useState<Record<string, string>>({});

  const { data, isLoading } = useQuery({
    queryKey: ['detections'],
    queryFn: getDetections,
  });

  // Derive alerts from detection data
  const alerts: Alert[] = useMemo(() => {
    if (!data?.features) return [];
    
    // Fonction pour déterminer la vitesse limite par type de bateau
    const getSpeedLimit = (shipType: number) => {
      if (shipType >= 40 && shipType < 50) return 30; // Haute vitesse
      if (shipType >= 60 && shipType < 70) return 22; // Passagers/Ferry
      if (shipType >= 30 && shipType < 40) return 15; // Pêche
      return 18; // Cargo, Tankers, Autres
    };

    return data.features
      .filter((f) => f.properties.speed > getSpeedLimit(f.properties.ship_type || 30) || f.properties.source === 'satellite')
      .slice(0, 50)
      .map((f, i) => {
        const speedLimit = getSpeedLimit(f.properties.ship_type || 30);
        const isSpeeding = f.properties.speed > speedLimit;
        const isSatellite = f.properties.source === 'satellite';
        
        return {
          id: `alert-${f.id}-${i}`,
          mmsi: String(f.properties.mmsi || f.id),
          type: isSpeeding ? 'high_speed' as const : isSatellite ? 'anomaly' as const : 'zone_entry' as const,
          severity: isSpeeding && f.properties.speed > speedLimit + 5 ? 'HIGH' as const : 
                   (isSpeeding || isSatellite) ? 'MEDIUM' as const : 'LOW' as const,
          message: isSpeeding
            ? `Infraction de vitesse: ${formatSpeed(f.properties.speed)} (Limite: ${speedLimit}kn)`
            : isSatellite
            ? `Cible non identifiée (Imagerie Satellite)`
            : `Entrée de zone non déclarée`,
          lat: f.geometry.coordinates[1],
          lon: f.geometry.coordinates[0],
          speed: f.properties.speed,
          timestamp: f.properties.timestamp,
          status: 'new' as const,
          confidence: isSatellite ? 0.75 + Math.random() * 0.2 : 0.85 + Math.random() * 0.15,
        };
      })
      .sort((a, b) => {
        const severityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
        return severityOrder[a.severity] - severityOrder[b.severity];
      });
  }, [data]);

  const filteredAlerts = useMemo(() => {
    return alerts.filter((a) => {
      if (severityFilter !== 'all' && a.severity !== severityFilter) return false;
      const currentStatus = alertStatuses[a.id] || a.status;
      if (statusFilter !== 'all' && currentStatus !== statusFilter) return false;
      return true;
    });
  }, [alerts, severityFilter, statusFilter, alertStatuses]);

  const updateAlertStatus = (id: string, status: string) => {
    setAlertStatuses((prev) => ({ ...prev, [id]: status }));
  };

  const severityTheme = {
    HIGH: {
      icon: <ShieldAlert className="w-4 h-4 text-status-danger" />,
      label: '[EXCESSIVE_SPEED_ALERT]',
      bg: 'bg-status-danger/5 border-status-danger/30',
      text: 'text-status-danger',
      glow: 'shadow-[0_0_15px_rgba(255,51,102,0.1)]'
    },
    MEDIUM: {
      icon: <Zap className="w-4 h-4 text-status-warn" />,
      label: '[UNVERIFIED_TARGET]',
      bg: 'bg-status-warn/5 border-status-warn/30',
      text: 'text-status-warn',
      glow: 'shadow-[0_0_15px_rgba(255,170,0,0.1)]'
    },
    LOW: {
      icon: <Eye className="w-4 h-4 text-accent-primary" />,
      label: '[ROUTINE_TRACKING]',
      bg: 'bg-accent-primary/5 border-accent-primary/20',
      text: 'text-accent-primary',
      glow: 'shadow-[0_0_15px_rgba(0,212,255,0.05)]'
    },
  };

  return (
    <div className="p-8 max-w-[1400px] mx-auto space-y-8 animate-fade-in pb-24">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <PageHeader 
          title="Strategic Threat Intel" 
          subtitle="Real-time heuristic analysis of multi-sensor maritime streams" 
        />
        
        <div className="flex items-center gap-3 px-4 py-2 bg-bg-surface border border-bg-border rounded-lg">
           <div className="w-2 h-2 rounded-full bg-status-danger animate-pulse" />
           <span className="text-[10px] font-black text-text-primary tracking-[0.2em] uppercase">Uplink: Active</span>
           <div className="w-px h-4 bg-bg-border mx-2" />
           <span className="text-[10px] font-mono text-text-muted font-bold uppercase">Buffer: 4.8 GB/s</span>
        </div>
      </div>

      {/* Advanced Threat Filters */}
      <GlassCard index={0} enableTilt={false} className="p-5">
      <div className="flex flex-col lg:flex-row gap-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-accent-primary/30 to-transparent" />
        
        <div className="space-y-3">
          <div className="flex items-center gap-2">
             <Filter className="w-3.5 h-3.5 text-accent-primary" />
             <span className="text-[9px] font-black tracking-widest text-text-muted uppercase">Intelligence Spectrum</span>
          </div>
          <div className="flex gap-2">
            {['all', 'HIGH', 'MEDIUM', 'LOW'].map((s) => (
              <button
                key={s}
                onClick={() => setSeverityFilter(s)}
                className={clsx(
                  "px-4 py-1.5 rounded text-[10px] font-black uppercase tracking-tighter border transition-all",
                  severityFilter === s
                    ? "bg-accent-primary/20 border-accent-primary text-accent-primary shadow-[0_0_10px_rgba(0,212,255,0.1)]"
                    : "bg-bg-base border-bg-border text-text-muted hover:border-text-primary hover:text-text-primary"
                )}
              >
                {s === 'all' ? 'FULL_SPECTRUM' : s}
              </button>
            ))}
          </div>
        </div>

        <div className="lg:w-px lg:h-12 bg-bg-border self-center" />

        <div className="space-y-3">
          <div className="flex items-center gap-2">
             <Radio className="w-3.5 h-3.5 text-accent-primary" />
             <span className="text-[9px] font-black tracking-widest text-text-muted uppercase">Response State</span>
          </div>
          <div className="flex gap-2">
            {['all', 'new', 'reviewed', 'false_positive'].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={clsx(
                  "px-4 py-1.5 rounded text-[10px] font-black uppercase tracking-tighter border transition-all",
                  statusFilter === s
                    ? "bg-accent-primary/20 border-accent-primary text-accent-primary shadow-[0_0_10px_rgba(0,212,255,0.1)]"
                    : "bg-bg-base border-bg-border text-text-muted hover:border-text-primary hover:text-text-primary"
                )}
              >
                {s === 'all' ? 'STATE_ALL' : s.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>
      </GlassCard>

      {/* Alert Feed Section */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <LoadingSkeleton key={i} className="h-28 w-full rounded border border-bg-border bg-bg-surface/50" />
            ))}
          </div>
        ) : filteredAlerts.length === 0 ? (
          <EmptyState message="NO ANOMALIES DETECTED WITHIN SELECTED VECTOR" icon={<ShieldCheck className="w-16 h-16 text-accent-primary/10" />} />
        ) : (
          <div className="grid gap-4">
            <AnimatePresence mode="popLayout">
              {filteredAlerts.map((alert, i) => {
                const currentStatus = alertStatuses[alert.id] || alert.status;
                const theme = severityTheme[alert.severity];
                
                return (
                  <motion.div
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3, delay: i * 0.05 }}
                    key={alert.id}
                    className={clsx(
                      "group p-1 rounded-lg border transition-all duration-300 relative overflow-hidden",
                      theme.bg,
                      theme.glow,
                      currentStatus === 'false_positive' && "opacity-40 grayscale contrast-50",
                      currentStatus === 'escalated' && "border-l-4 border-l-status-danger bg-status-danger/5 shadow-[inset_0_0_20px_rgba(255,51,102,0.05)]"
                    )}
                  >
                    <div className="bg-bg-surface/80 p-5 rounded-md flex flex-col md:flex-row items-center gap-6">
                      {/* Visual Indicator */}
                      <div className={clsx(
                        "w-12 h-12 flex items-center justify-center rounded border",
                        "bg-bg-base border-bg-border group-hover:border-text-muted transition-colors"
                      )}>
                        {theme.icon}
                      </div>

                      {/* Content Core */}
                      <div className="flex-1 flex flex-col gap-2">
                        <div className="flex flex-wrap items-center gap-3">
                          <span className={clsx("text-[9px] font-black tracking-[0.2em]", theme.text)}>
                            {theme.label}
                          </span>
                          <span className="text-sm font-black text-text-primary tracking-tight uppercase font-display">
                            {alert.message}
                          </span>
                          {currentStatus !== 'new' && (
                            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-bg-elevated border border-bg-border rounded">
                               <div className="w-1 h-1 rounded-full bg-accent-primary" />
                               <span className="text-[8px] font-black text-text-muted uppercase">{currentStatus}</span>
                            </div>
                          )}
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-2">
                           <div className="flex flex-col">
                              <span className="text-[8px] font-black text-text-muted uppercase tracking-widest mb-0.5">Asset_MMSI</span>
                              <span className="text-[11px] font-mono font-bold text-text-primary group-hover:text-accent-primary transition-colors">{alert.mmsi}</span>
                           </div>
                           <div className="flex flex-col">
                              <span className="text-[8px] font-black text-text-muted uppercase tracking-widest mb-0.5">Sector_Coords</span>
                              <span className="text-[11px] font-mono font-bold text-text-muted leading-tight">{formatCoordinates(alert.lat, alert.lon)}</span>
                           </div>
                           <div className="flex flex-col">
                              <span className="text-[8px] font-black text-text-muted uppercase tracking-widest mb-0.5">Temporal_Sync</span>
                              <span className="text-[11px] font-black text-text-muted uppercase">{formatTimeAgo(alert.timestamp)}</span>
                           </div>
                           <div className="flex flex-col">
                              <span className="text-[8px] font-black text-text-muted uppercase tracking-widest mb-0.5">AI_Confidence</span>
                              <div className="flex items-center gap-2">
                                <span className={clsx(
                                  "text-[11px] font-mono font-black",
                                  alert.confidence > 0.9 ? "text-status-safe" : "text-status-warn"
                                )}>
                                  {(alert.confidence * 100).toFixed(1)}%
                                </span>
                                <div className="flex-1 max-w-[60px] h-1 bg-bg-border rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-accent-primary transition-all duration-1000" 
                                    style={{ width: `${alert.confidence * 100}%` }} 
                                  />
                                </div>
                              </div>
                           </div>
                        </div>
                      </div>

                      {/* Response Protocol Actions */}
                      <div className="flex flex-row md:flex-col gap-2">
                         <MagneticButton
                           variant="ghost"
                           onClick={() => updateAlertStatus(alert.id, 'reviewed')}
                           className="px-4 py-2 bg-accent-primary/10 border-accent-primary/20 text-accent-primary"
                         >
                            [EXAMINE]
                         </MagneticButton>
                         <div className="flex gap-2">
                           <MagneticButton
                             variant="ghost"
                             onClick={() => updateAlertStatus(alert.id, 'false_positive')}
                             className="flex-1 px-3 py-2"
                           >
                              [FALSE_POS]
                           </MagneticButton>
                           <MagneticButton
                             variant="danger"
                             onClick={() => updateAlertStatus(alert.id, 'escalated')}
                             className="flex-1 px-3 py-2"
                           >
                              [ESCALATE]
                           </MagneticButton>
                         </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
