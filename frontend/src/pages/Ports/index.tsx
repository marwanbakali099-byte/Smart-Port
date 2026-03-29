import { useQuery } from '@tanstack/react-query';
import { getPortStatus, getPortCongestionIA } from '../../api/analytics';
import { PageHeader, StatusBadge, LoadingSkeleton } from '../../components/ui/SharedUI';
import { formatETA } from '../../utils/formatters';
import { Anchor, Brain, Ship, Clock, Activity, ChevronRight, LayoutGrid } from 'lucide-react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import { getPorts } from '../../api/ports';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { GlassCard } from '../../components/ui/SharedUI';

function MapFlyTo({ coords }: { coords: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(coords, 13, { duration: 2 });
  }, [coords, map]);
  return null;
}

export default function Ports() {
  const [selectedPortId, setSelectedPortId] = useState<number>(7); // Default to Tanger Med

  const { data: ports, isLoading: portsLoading } = useQuery({
    queryKey: ['ports'],
    queryFn: getPorts,
  });

  const selectedPort = ports?.find(p => p.id === selectedPortId);

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-8 animate-fade-in pb-20">
      <PageHeader 
        title="Maritime Command Center" 
        subtitle="Global logistics surveillance and infrastructure health monitoring" 
      />

      <div className="flex flex-col lg:flex-row gap-8 items-stretch h-[calc(100vh-280px)] min-h-[600px]">
        
        {/* Left Panel: Hub Selector */}
        <div className="w-full lg:w-[400px] flex flex-col gap-4">
          <div className="flex items-center gap-2 mb-2">
            <LayoutGrid className="w-4 h-4 text-accent-primary" />
            <span className="text-[10px] font-black tracking-[0.2em] text-text-muted uppercase">Global Hub Registry</span>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-bg-border">
            {portsLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <LoadingSkeleton key={i} className="h-28 w-full rounded-lg" />
              ))
            ) : ports?.map((port) => (
              <PortSelectionCard
                key={port.id}
                portId={port.id}
                portName={port.name}
                isSelected={selectedPortId === port.id}
                onSelect={() => setSelectedPortId(port.id)}
              />
            ))}
          </div>
        </div>

        {/* Right Panel: Hub Deep-Dive */}
        <div className="flex-1 flex flex-col gap-6">
          <AnimatePresence mode="wait">
             {selectedPort ? (
               <motion.div 
                 key={selectedPort.id}
                 initial={{ opacity: 0, x: 20 }}
                 animate={{ opacity: 1, x: 0 }}
                 exit={{ opacity: 0, x: -20 }}
                 className="flex flex-col gap-6 h-full"
               >
                 {/* Hub Header Block */}
                 <GlassCard index={0} enableTilt={false} className="p-6 relative overflow-hidden group">
                 <div>
                   <div className="absolute top-0 right-0 p-8 opacity-5">
                      <Anchor className="w-32 h-32" />
                   </div>
                   <div className="flex justify-between items-start relative z-10">
                     <div className="space-y-2">
                       <h2 className="text-3xl font-black text-text-primary tracking-tighter uppercase font-display">
                        {selectedPort.name}
                       </h2>
                       <div className="flex items-center gap-4 text-text-muted font-mono text-[10px] font-bold">
                         <span className="flex items-center gap-1.5 px-2 py-0.5 bg-bg-base rounded border border-bg-border">
                           ID: <span className="text-accent-primary">{selectedPort.id}</span>
                         </span>
                         <span className="flex items-center gap-1.5 px-2 py-0.5 bg-bg-base rounded border border-bg-border">
                           GEO: <span className="text-text-primary">{selectedPort.lat.toFixed(4)}, {selectedPort.lon.toFixed(4)}</span>
                         </span>
                       </div>
                     </div>
                     <div className="px-4 py-2 bg-accent-glow border border-accent-primary/20 rounded-lg">
                        <span className="text-[9px] font-black text-accent-primary tracking-widest uppercase">Operational Stream Active</span>
                     </div>
                   </div>
                 </div>
                 </GlassCard>

                 {/* Hub Metrics Grid */}
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <HubMetric portId={selectedPort.id} type="boats" />
                    <HubMetric portId={selectedPort.id} type="congestion" />
                    <HubMetric portId={selectedPort.id} type="eta" />
                    <HubMetric portId={selectedPort.id} type="prediction" />
                 </div>

                 {/* Hub Satellite View (Map) */}
                 <GlassCard index={2} enableTilt={false} className="flex-1 overflow-hidden relative min-h-[300px]">
                 <div className="h-full">
                    <div className="absolute top-4 left-4 z-[1000] flex flex-col gap-2">
                      <div className="glass-panel px-3 py-1.5 border-accent-primary/20 flex items-center gap-2">
                         <div className="w-1.5 h-1.5 rounded-full bg-accent-primary animate-pulse" />
                         <span className="text-[9px] font-black text-text-primary tracking-widest uppercase">Visual Uplink: Satellite_04</span>
                      </div>
                    </div>
                    
                    <MapContainer 
                      center={[selectedPort.lat, selectedPort.lon]} 
                      zoom={14} 
                      className="w-full h-full grayscale-[0.8] contrast-[1.2] invert-[0.05]"
                      zoomControl={false}
                    >
                      <TileLayer
                        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                      />
                      <MapFlyTo coords={[selectedPort.lat, selectedPort.lon]} />
                      <CircleMarker
                        center={[selectedPort.lat, selectedPort.lon]}
                        radius={100}
                        pathOptions={{
                          fillColor: '#00d4ff',
                          fillOpacity: 0.1,
                          color: '#00d4ff',
                          weight: 1,
                          dashArray: '5, 5'
                        }}
                      />
                      <CircleMarker
                        center={[selectedPort.lat, selectedPort.lon]}
                        radius={12}
                        pathOptions={{
                          fillColor: '#00d4ff',
                          fillOpacity: 0.8,
                          color: '#fff',
                          weight: 2,
                        }}
                      >
                         <Popup className="glass-popup">
                            <div className="p-2 font-mono text-[10px]">
                               <p className="font-bold uppercase text-accent-primary">{selectedPort.name}</p>
                               <p className="mt-1 text-text-muted">READY_FOR_BERTHING</p>
                            </div>
                         </Popup>
                      </CircleMarker>
                    </MapContainer>
                 </div>
                 </GlassCard>
               </motion.div>
             ) : (
               <div className="flex-1 flex items-center justify-center glass-panel border-dashed border-2 opacity-50">
                  <p className="text-text-muted font-mono text-sm tracking-widest uppercase font-black">SELECT_HUB_FOR_UPLINK</p>
               </div>
             )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function PortSelectionCard({ portId, portName, isSelected, onSelect }: {
  portId: number;
  portName: string;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const { data: status } = useQuery({
    queryKey: ['port-status', portId],
    queryFn: () => getPortStatus(portId),
    refetchInterval: 60000,
  });

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      onClick={onSelect}
      className={clsx(
        "p-5 rounded border transition-all cursor-pointer relative overflow-hidden group shadow-lg",
        isSelected 
          ? "bg-bg-elevated border-accent-primary/50 shadow-accent-primary/10" 
          : "bg-bg-surface border-bg-border hover:border-text-muted"
      )}
    >
      {isSelected && (
        <div className="absolute top-0 left-0 w-1 h-full bg-accent-primary animate-pulse" />
      )}
      
      <div className="flex justify-between items-start mb-4">
        <div className="space-y-1">
          <h3 className={clsx(
            "text-base font-black tracking-tight uppercase font-display",
            isSelected ? "text-accent-primary" : "text-text-primary"
          )}>
            {portName}
          </h3>
          <p className="text-[10px] font-mono text-text-muted font-bold">HUB_NODE_{portId.toString().padStart(3, '0')}</p>
        </div>
        {status && <StatusBadge status={status.congestion} size="sm" />}
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-bg-border/30">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <Ship className="w-3 h-3 text-text-muted" />
            <span className="text-[11px] font-mono font-black text-text-primary">{status?.boats_in_port ?? '—'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-3 h-3 text-text-muted" />
            <span className="text-[11px] font-mono font-black text-text-primary">
               {status?.avg_eta_minutes ? formatETA(status.avg_eta_minutes) : '—'}
            </span>
          </div>
        </div>
        <ChevronRight className={clsx(
          "w-4 h-4 transition-transform",
          isSelected ? "text-accent-primary translate-x-1" : "text-text-muted group-hover:text-text-primary"
        )} />
      </div>
    </motion.div>
  );
}

function HubMetric({ portId, type }: { portId: number; type: 'boats' | 'congestion' | 'eta' | 'prediction' }) {
  const { data: status, isLoading: statusLoading } = useQuery({
    queryKey: ['port-status', portId],
    queryFn: () => getPortStatus(portId),
  });

  const { data: congestion, isLoading: congestionLoading } = useQuery({
    queryKey: ['congestion-ia', portId],
    queryFn: () => getPortCongestionIA(portId),
  });

  if (statusLoading || congestionLoading) return <LoadingSkeleton className="h-24 w-full" />;

  const configs = {
    boats: {
      label: "Live Asset Count",
      value: status?.boats_in_port ?? '—',
      icon: Ship,
      color: "text-accent-primary",
      suffix: "UNITS"
    },
    congestion: {
      label: "Hub Grid State",
      value: status?.congestion ?? '—',
      icon: Activity,
      color: "text-status-safe", // dynamic?
      suffix: "STATUS"
    },
    eta: {
      label: "Logistics Vector",
      value: status?.avg_eta_minutes ? formatETA(status.avg_eta_minutes) : 'N/A',
      icon: Clock,
      color: "text-status-warn",
      suffix: "TIME"
    },
    prediction: {
      label: "XGBoost Forecast",
      value: congestion?.congestion_predictive_ia ?? '—',
      icon: Brain,
      color: "text-accent-primary",
      suffix: "AI MODEL"
    }
  };

  const config = configs[type];
  const Icon = config.icon;

  return (
    <div className="glass-panel glow-border p-4 flex flex-col gap-2 border-bg-border bg-bg-surface/50 hover:shadow-[0_0_20px_rgba(0,212,255,0.06)] transition-shadow duration-500">
      <div className="flex items-center gap-2">
         <Icon className={clsx("w-3.5 h-3.5", config.color)} />
         <span className="text-[9px] font-black text-text-muted uppercase tracking-[0.15em]">{config.label}</span>
      </div>
      <div className="flex items-baseline gap-2">
         <span className="text-xl font-black font-mono text-text-primary tracking-tighter uppercase whitespace-nowrap overflow-hidden text-ellipsis">
            {config.value}
         </span>
         <span className="text-[8px] font-black text-text-muted tracking-widest">{config.suffix}</span>
      </div>
    </div>
  );
}
