import { useQuery } from '@tanstack/react-query';
import { getPortStatus } from '../../api/analytics';
import { LoadingSkeleton, StatusBadge } from '../ui/SharedUI';
import { Ship, X, Clock, MapPin, Activity } from 'lucide-react';
import type { PortStatusResponse } from '../../types/models';

interface PortStatusPanelProps {
  portId: number;
  onClose: () => void;
}

export function PortStatusPanel({ portId, onClose }: PortStatusPanelProps) {
  const { data, isLoading, error } = useQuery<PortStatusResponse>({
    queryKey: ['port-status', portId],
    queryFn: () => getPortStatus(portId),
    staleTime: 30000,
  });

  return (
    <div className="fixed right-0 top-16 bottom-0 w-[420px] glass-panel z-[1020] animate-slide-in-right overflow-y-auto shadow-2xl">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div className="space-y-1">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-1.5 h-1.5 rounded-full bg-accent-primary animate-pulse" />
              <span className="text-[10px] font-black tracking-[0.2em] text-accent-primary uppercase font-display">Hub Intelligence</span>
            </div>
            <h3 className="text-2xl font-black text-text-primary tracking-tight font-mono">{data?.port_name || `Hub #${portId}`}</h3>
            <div className="flex items-center gap-2 mt-2">
              <MapPin className="w-3 h-3 text-text-muted" />
              <span className="text-[10px] font-mono text-text-muted">
                {data?.coordinates ? `${data.coordinates[1].toFixed(4)}, ${data.coordinates[0].toFixed(4)}` : '—'}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded border border-bg-border bg-bg-base/50 text-text-muted hover:text-text-primary transition-all hover:border-accent-primary/50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {isLoading && (
          <div className="space-y-6">
            <LoadingSkeleton className="h-24 w-full" />
            <LoadingSkeleton className="h-40 w-full" />
            <LoadingSkeleton className="h-40 w-full" />
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center justify-center h-64 text-center p-8 bg-status-danger/5 border border-status-danger/20 rounded">
            <Activity className="w-8 h-8 text-status-danger mb-4 opacity-50" />
            <p className="text-xs font-bold uppercase tracking-widest text-status-danger">Intelligence Link Failed</p>
          </div>
        )}

        {data && (
          <div className="space-y-8 animate-fade-in">
            {/* KPI Summary */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded border border-bg-border bg-bg-surface">
                <p className="text-[9px] text-text-muted font-bold uppercase mb-2">Occupancy</p>
                <p className="text-2xl font-black font-mono text-text-primary leading-tight">
                  {data.boats_in_port}
                </p>
                <div className="mt-2">
                   <StatusBadge status={data.congestion} size="sm" />
                </div>
              </div>
              <div className="p-4 rounded border border-bg-border bg-bg-surface">
                <p className="text-[9px] text-text-muted font-bold uppercase mb-2">Avg Wait</p>
                <p className="text-2xl font-black font-mono text-text-primary leading-tight">
                  {data.avg_eta_minutes}<span className="text-xs font-sans text-text-muted ml-1">min</span>
                </p>
                <p className="text-[8px] text-status-warn font-bold mt-2 uppercase">Congestion Predictive</p>
              </div>
            </div>

            {/* Vessel Manifest — works with real (boats: string[]) or mock (vessels_list) */}
            {(() => {
              const mmsiList: string[] = data.vessels_list
                ? data.vessels_list.map((v) => v.mmsi)
                : data.boats ?? [];
              if (mmsiList.length === 0) return null;
              return (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Ship className="w-4 h-4 text-accent-primary" />
                      <span className="text-[10px] font-bold text-text-primary uppercase tracking-widest">Active Manifest</span>
                    </div>
                    <span className="text-[9px] font-mono text-text-muted">{mmsiList.length} TARGETS</span>
                  </div>
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                    {mmsiList.map((mmsi) => (
                      <div key={mmsi} className="flex items-center justify-between p-3 rounded border border-bg-border bg-bg-base/30 hover:border-accent-primary/30 transition-colors group">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded bg-bg-elevated flex items-center justify-center text-accent-primary group-hover:bg-accent-glow transition-colors">
                            <Ship className="w-4 h-4" />
                          </div>
                          <p className="text-xs font-bold text-text-primary font-mono">{mmsi}</p>
                        </div>
                        <span className="text-[9px] font-black text-accent-primary uppercase">BERTHED</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Arrival Timeline — optional in real backend */}
            {(data.arrival_timeline?.length ?? 0) > 0 && (
              <div className="space-y-4 pt-4 border-t border-bg-border">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-text-muted" />
                  <span className="text-[10px] font-bold text-text-primary uppercase tracking-widest">Operations Timeline</span>
                </div>
                <div className="space-y-4 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-px before:bg-bg-border">
                  {data.arrival_timeline!.map((event, i) => (
                    <div key={i} className="relative pl-8">
                      <div className={`absolute left-0 top-1 w-4 h-4 rounded-full border-2 border-bg-base flex items-center justify-center z-10 ${event.type === 'ARRIVÉE' ? 'bg-status-safe' : 'bg-accent-dim'}`}>
                        <div className="w-1.5 h-1.5 bg-white rounded-full" />
                      </div>
                      <div className="p-3 rounded bg-bg-surface/50 border border-bg-border/50">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[10px] font-black text-text-primary">{event.vessel}</span>
                          <span className="text-[9px] font-mono text-accent-primary">{event.time}</span>
                        </div>
                        <p className={`text-[8px] font-bold uppercase tracking-widest ${event.type === 'ARRIVÉE' ? 'text-status-safe' : 'text-accent-primary'}`}>
                          {event.type}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
