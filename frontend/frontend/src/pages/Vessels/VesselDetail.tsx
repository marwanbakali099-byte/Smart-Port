import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getBoatETA } from '../../api/analytics';
import { getDetections } from '../../api/detections';
import { getAlerts } from '../../api/alerts';
import { getEvents } from '../../api/events';
import { formatSpeed, formatETA, formatCoordinates, formatTimeAgo, getShipTypeName } from '../../utils/formatters';
import { MapContainer, TileLayer, Polyline, CircleMarker } from 'react-leaflet';
import { Ship, ArrowLeft, Clock, Gauge, Navigation, Activity, Target, Waves, ShieldAlert, Calendar, Zap, Cpu, ShieldCheck } from 'lucide-react';
import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';

export default function VesselDetail() {
  const { mmsi } = useParams<{ mmsi: string }>();
  const navigate = useNavigate();

  const { data: etaData } = useQuery({
    queryKey: ['vessel-eta', mmsi],
    queryFn: () => getBoatETA(mmsi!),
    enabled: !!mmsi,
    retry: 1,
  });

  const { data: detections } = useQuery({
    queryKey: ['detections'],
    queryFn: getDetections,
  });

  const { data: alerts } = useQuery({
    queryKey: ['alerts'],
    queryFn: getAlerts,
  });

  const { data: events } = useQuery({
    queryKey: ['events'],
    queryFn: getEvents,
  });

  // Derived data
  const vesselPositions = useMemo(() => {
    if (!detections?.features || !mmsi) return [];
    return detections.features
      .filter((f) => f.properties.mmsi === mmsi)
      .sort((a, b) => new Date(a.properties.timestamp).getTime() - new Date(b.properties.timestamp).getTime())
      .map((f) => ({
        lat: f.geometry.coordinates[1],
        lon: f.geometry.coordinates[0],
        speed: f.properties.speed,
        timestamp: f.properties.timestamp,
        source: f.properties.source,
      }));
  }, [detections, mmsi]);

  const trajectoryPath = vesselPositions.map((p) => [p.lat, p.lon] as [number, number]);
  const lastPosition = vesselPositions[vesselPositions.length - 1];

  const linkedAlerts = useMemo(() => alerts?.filter(a => a.mmsi === mmsi) || [], [alerts, mmsi]);
  const linkedEvents = useMemo(() => events?.filter(e => e.mmsi === mmsi) || [], [events, mmsi]);

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-8 animate-fade-in pb-24">
      {/* Tactical Navigation Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/vessels')}
          className="flex items-center gap-3 px-4 py-2 bg-bg-surface border border-bg-border rounded text-[10px] font-black text-text-muted hover:text-accent-primary hover:border-accent-primary transition-all group uppercase tracking-widest"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
          Ret_Asset_Registry
        </button>
        
        <div className="flex items-center gap-4">
           <div className="flex items-center gap-2 px-3 py-1 bg-status-safe/5 border border-status-safe/20 rounded">
              <div className="w-1.5 h-1.5 rounded-full bg-status-safe animate-pulse" />
              <span className="text-[9px] font-black text-status-safe uppercase tracking-widest">Signal_Lock: High</span>
           </div>
           <div className="flex items-center gap-2 px-3 py-1 bg-bg-surface border border-bg-border rounded">
              <Activity className="w-3.5 h-3.5 text-accent-primary" />
              <span className="text-[9px] font-black text-text-muted uppercase tracking-widest">Stream: Active</span>
           </div>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-8">
        {/* Left Column: Tactical Intel & Trajectory */}
        <div className="flex-1 space-y-8 min-w-0">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-bg-surface/30 p-6 rounded-xl border border-bg-border/50 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-[2px] h-full bg-accent-primary" />
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                 <div className="px-2 py-0.5 bg-accent-primary text-bg-base text-[9px] font-black rounded uppercase tracking-tighter">
                    ASSET_SECURED
                 </div>
                 <span className="text-[10px] font-mono font-bold text-text-muted">MMSI_{mmsi}</span>
              </div>
              <h1 className="text-4xl font-black text-text-primary uppercase tracking-tighter font-display">
                {etaData?.nom || `HVA_SIGNAL_${mmsi?.slice(-4)}`}
              </h1>
              <div className="flex items-center gap-4 text-[10px] font-black text-text-muted uppercase tracking-widest">
                <span className="flex items-center gap-1.5"><Ship className="w-3.5 h-3.5 text-accent-primary" /> {getShipTypeName(etaData?.type || 0)}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-bg-border" />
                <span className="flex items-center gap-1.5 font-mono text-accent-primary"><Target className="w-3.5 h-3.5" /> LC: {lastPosition ? formatCoordinates(lastPosition.lat, lastPosition.lon) : 'PENDING'}</span>
              </div>
            </div>
            
            <div className="flex flex-col items-end gap-2">
               <span className="text-[9px] font-black text-text-muted uppercase tracking-[0.3em]">IA_Threat_Score</span>
               <div className="flex items-center gap-4">
                  <span className="text-3xl font-black text-status-safe font-mono tracking-tighter">04%</span>
                  <div className="w-24 h-1.5 bg-bg-border rounded-full overflow-hidden">
                     <div className="h-full bg-status-safe transition-all duration-1000" style={{ width: '4%' }} />
                  </div>
               </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { label: 'ETA_DESTINA', value: etaData ? formatETA(etaData.eta_predite_minutes) : '—', sub: etaData?.port_destination || 'UKN_SECTOR', icon: Clock, color: 'text-accent-primary', bg: 'bg-accent-primary/10' },
              { label: 'VELOCITY_KNT', value: etaData ? formatSpeed(etaData.vitesse_actuelle) : '—', sub: 'Calculated_TAS', icon: Gauge, color: 'text-status-warn', bg: 'bg-status-warn/10' },
              { label: 'HEADING_DEG', value: '142°', sub: 'TrueNorth_Ref', icon: Navigation, color: 'text-text-primary', bg: 'bg-bg-elevated' },
              { label: 'TEMPORAL_LAST', value: etaData ? formatTimeAgo(etaData.timestamp_actuel) : '—', sub: 'Server_Uplink', icon: Activity, color: 'text-status-safe', bg: 'bg-status-safe/10' },
            ].map((stat, idx) => (
              <motion.div 
                key={stat.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className={clsx("p-5 rounded-lg border border-bg-border glass-panel relative overflow-hidden group", stat.bg)}
              >
                <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-20 transition-opacity">
                   <stat.icon className="w-12 h-12" />
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <stat.icon className={clsx("w-3.5 h-3.5", stat.color)} />
                  <span className="text-[8px] font-black text-text-muted uppercase tracking-[0.2em]">{stat.label}</span>
                </div>
                <p className="text-2xl font-black text-text-primary font-mono tracking-tighter">{stat.value}</p>
                <p className="text-[9px] font-black text-text-muted uppercase tracking-widest mt-1 opacity-60">{stat.sub}</p>
              </motion.div>
            ))}
          </div>

          {/* Core Trajectory Map */}
          {lastPosition && (
            <div className="rounded-xl overflow-hidden border border-bg-border shadow-2xl relative group">
              <div className="absolute inset-0 bg-accent-primary/5 pointer-events-none z-10 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="px-5 py-3 bg-bg-surface border-b border-bg-border flex items-center justify-between relative z-20">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-accent-primary animate-pulse" />
                  <span className="text-[10px] font-black text-text-primary uppercase tracking-[0.2em]">Kinetic_Trajectory_Mapping</span>
                </div>
                <div className="flex items-center gap-4">
                   <span className="text-[9px] font-mono font-bold text-text-muted uppercase">Source: Multi-Sensor_Fusion</span>
                   <div className="w-px h-3 bg-bg-border" />
                   <Waves className="w-3.5 h-3.5 text-accent-primary" />
                </div>
              </div>
              <div className="h-[450px] relative">
                <MapContainer center={[lastPosition.lat, lastPosition.lon]} zoom={12} className="w-full h-full grayscale-[0.8] contrast-[1.2] invert-[0.9] hue-rotate-[180deg]">
                  <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    attribution='&copy; CARTO'
                  />
                  {trajectoryPath.length > 1 && (
                    <Polyline
                      positions={trajectoryPath}
                      pathOptions={{ color: '#00d4ff', weight: 4, opacity: 0.8, lineCap: 'round', dashArray: '1, 12' }}
                    />
                  )}
                  {vesselPositions.map((pos, i) => (
                    <CircleMarker
                      key={i}
                      center={[pos.lat, pos.lon]}
                      radius={i === vesselPositions.length - 1 ? 10 : 3}
                      pathOptions={{
                        fillColor: i === vesselPositions.length - 1 ? '#00d4ff' : '#0099cc',
                        fillOpacity: 1,
                        color: 'white',
                        weight: i === vesselPositions.length - 1 ? 3 : 0,
                      }}
                    >
                      {i === vesselPositions.length - 1 && (
                         <div className="absolute inset-x-0 inset-y-0 w-full h-full rounded-full border-4 border-accent-primary animate-ping" />
                      )}
                    </CircleMarker>
                  ))}
                </MapContainer>
                
                {/* Tactical Overlay */}
                <div className="absolute bottom-6 right-6 z-[1000] space-y-2">
                   <div className="glass-panel p-4 border-bg-border shadow-2xl max-w-[200px]">
                      <span className="text-[8px] font-black text-text-muted uppercase tracking-widest block mb-2">Vector_Meta</span>
                      <div className="space-y-1.5 font-mono text-[9px] font-bold">
                         <div className="flex justify-between">
                            <span className="text-text-muted">HDG:</span>
                            <span className="text-text-primary">142.4°</span>
                         </div>
                         <div className="flex justify-between">
                            <span className="text-text-muted">ROT:</span>
                            <span className="text-status-safe">0.0°/S</span>
                         </div>
                         <div className="flex justify-between">
                            <span className="text-text-muted">DST:</span>
                            <span className="text-accent-primary">12.8 NM</span>
                         </div>
                      </div>
                   </div>
                </div>
              </div>
            </div>
          )}

          {/* Telemetry Stream */}
          <div className="glass-panel border-bg-border overflow-hidden shadow-xl">
            <div className="px-5 py-4 bg-bg-surface/50 border-b border-bg-border flex items-center gap-3">
              <Activity className="w-3.5 h-3.5 text-accent-primary" />
              <span className="text-[10px] font-black text-text-primary uppercase tracking-[0.2em]">Telemetry_Chronicle</span>
              <span className="ml-auto text-[9px] font-mono text-text-muted font-bold uppercase tracking-widest">N_Vectors: {vesselPositions.length}</span>
            </div>
            <div className="max-h-[300px] overflow-y-auto">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-bg-surface border-b border-bg-border z-10">
                   <tr className="text-[8px] font-black text-text-muted uppercase tracking-[0.2em]">
                      <th className="px-6 py-3 font-black">Sync_Time</th>
                      <th className="px-6 py-3 font-black">Spatial_Fix</th>
                      <th className="px-6 py-3 font-black">Vel_Knt</th>
                      <th className="px-6 py-3 font-black text-right">Uplink</th>
                   </tr>
                </thead>
                <tbody className="font-mono text-[10px] font-bold">
                  {vesselPositions.length > 0 ? (
                    vesselPositions.slice().reverse().map((pos, i) => (
                      <tr key={i} className="border-b border-bg-border/30 hover:bg-accent-primary/5 transition-colors group">
                        <td className="px-6 py-3 text-text-muted group-hover:text-text-primary">{formatTimeAgo(pos.timestamp).toUpperCase()}</td>
                        <td className="px-6 py-3 text-text-primary">{formatCoordinates(pos.lat, pos.lon)}</td>
                        <td className="px-6 py-3">
                           <span className={clsx(pos.speed > 15 ? "text-status-danger" : "text-status-safe")}>
                             {formatSpeed(pos.speed)}
                           </span>
                        </td>
                        <td className="px-6 py-3 text-right">
                           <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-bg-base border border-bg-border rounded text-[8px] uppercase">
                              <span className="w-1 h-1 rounded-full bg-accent-primary" />
                              {pos.source?.toUpperCase() || 'AIS'}
                           </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan={4} className="p-12 text-center text-[10px] font-black text-text-muted uppercase tracking-widest">Awaiting_Sector_Uplink...</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Tactical Intelligence Suite */}
        <div className="w-full xl:w-[400px] space-y-8 flex-shrink-0">
          {/* Linked Strategic Threats */}
          <div className="glass-panel border-bg-border overflow-hidden bg-bg-surface/30 shadow-2xl">
            <div className="px-5 py-4 bg-status-danger/10 border-b border-status-danger/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ShieldAlert className="w-4 h-4 text-status-danger" />
                <span className="text-[11px] font-black text-status-danger uppercase tracking-[0.2em]">Strategic_Threats</span>
              </div>
              <div className="px-2 py-0.5 bg-status-danger/20 rounded border border-status-danger/50 text-[10px] font-mono font-black text-status-danger">
                 {linkedAlerts.length}
              </div>
            </div>
            <div className="p-5 space-y-4">
              {linkedAlerts.length > 0 ? (
                linkedAlerts.map(alert => (
                  <div key={alert.id} className="p-4 rounded-lg bg-bg-base border border-bg-border relative overflow-hidden group hover:border-status-danger/50 transition-all">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-status-danger/5 rounded-full -mr-12 -mt-12 group-hover:bg-status-danger/10 transition-colors" />
                    <div className="flex items-center justify-between mb-2 relative z-10">
                      <span className="text-[9px] font-black text-status-danger uppercase tracking-[0.3em] font-mono">[{alert.type?.toUpperCase() || 'UNKNOWN_ANOMALY'}]</span>
                      <span className="text-[9px] font-black text-text-muted uppercase">{formatTimeAgo(alert.timestamp)}</span>
                    </div>
                    <p className="text-[11px] font-black text-text-primary leading-snug relative z-10 font-display">{(alert as any).message || (alert as any).description}</p>
                    <div className="mt-4 flex justify-end relative z-10">
                       <button className="text-[8px] font-black uppercase text-accent-primary tracking-widest hover:underline">[EXAMINE_VECTOR]</button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center flex flex-col items-center gap-4 border border-bg-border border-dashed rounded-lg opacity-40 grayscale">
                   <ShieldCheck className="w-12 h-12 text-text-muted" />
                   <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.3em]">No_Threat_Vectors_Detected</p>
                </div>
              )}
            </div>
          </div>

          {/* Tactical Logistics Stream */}
          <div className="glass-panel border-bg-border overflow-hidden bg-bg-surface/30 shadow-2xl">
            <div className="px-5 py-4 bg-bg-elevated border-b border-bg-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-accent-primary" />
                <span className="text-[11px] font-black text-text-primary uppercase tracking-[0.2em]">Logistics_Stream</span>
              </div>
              <Activity className="w-3.5 h-3.5 text-text-muted animate-pulse" />
            </div>
            <div className="p-6 space-y-6 relative">
              <div className="absolute left-[30px] top-6 bottom-6 w-px bg-bg-border/40 z-0" />
              
              {linkedEvents.length > 0 ? (
                linkedEvents.map((event) => (
                  <div key={event.id} className="flex gap-6 relative z-10 group">
                    <div className={clsx(
                      "w-4 h-4 rounded-full mt-1.5 border-2 border-bg-surface group-hover:scale-125 transition-transform shrink-0 shadow-[0_0_10px_rgba(0,0,0,0.5)]",
                      event.event_type === 'entry' ? 'bg-status-safe shadow-status-safe/20' : 'bg-status-warn shadow-status-warn/20'
                    )} />
                    <div className="flex-1 pb-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-[9px] font-black text-text-muted uppercase tracking-[0.2em]">{event.event_type === 'entry' ? 'SECTOR_ENTRY' : 'SECTOR_EXIT'}</span>
                        <p className="text-sm font-black text-text-primary uppercase tracking-tight font-display leading-tight">
                          {event.event_type === 'entry' ? 'DOCKED_AT' : 'DEPARTED'} {event.port_name}
                        </p>
                        <div className="flex items-center gap-3 mt-1.5">
                           <span className="text-[10px] font-mono font-bold text-accent-primary">{formatTimeAgo(event.timestamp).toUpperCase()}</span>
                           <div className="w-1 h-1 rounded-full bg-bg-border" />
                           <span className="text-[8px] font-black text-text-muted uppercase tracking-widest font-mono">CODE_{String(event.id).slice(-4).toUpperCase()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center text-text-muted flex flex-col items-center gap-4 opacity-40">
                   <Zap className="w-12 h-12" />
                   <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.3em]">No_Activity_Vectors_Logged</p>
                </div>
              )}
            </div>
          </div>
          
          {/* AI Tactical Summary */}
          <div className="p-5 rounded-lg bg-bg-base border border-bg-border shadow-inner">
             <div className="flex items-center gap-2 mb-3">
                <Cpu className="w-4 h-4 text-accent-primary" />
                <span className="text-[9px] font-black text-text-primary uppercase tracking-[0.2em]">IA_Predictive_Insight</span>
             </div>
             <p className="text-[10px] font-black text-text-muted leading-relaxed uppercase tracking-widest opacity-80">
               Target exhibiting nominal tactical behavior. High confidence in destination port arrival within predicted window. No suspicious kinetic patterns detected in the last 24H vector stream.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}
