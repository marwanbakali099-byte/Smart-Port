import { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, Circle, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { useQuery } from '@tanstack/react-query';
import { getDetections } from '../../api/detections';
import { getBoatETA } from '../../api/analytics';
import { useVesselStore } from '../../store/vesselStore';
import { LoadingSkeleton } from '../../components/ui/SharedUI';
import type { DetectionFeature, BoatETAResponse } from '../../types/models';
import { Ship, X, AlertTriangle, Anchor, Target, Camera, Activity, ShieldAlert, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { MagneticButton } from '../../components/ui/SharedUI';
import { PortStatusPanel } from '../../components/port/PortStatusPanel';
import { useNavigate } from 'react-router-dom';

const getVesselStatus = (speed: number, isInPort: boolean) => {
  if (speed > 5) return { label: 'EN MOUVEMENT', color: '#00ff88', icon: '●' };
  if (speed > 0 && speed <= 5) return { label: 'LENT', color: '#ffaa00', icon: '●' };
  if (speed === 0 && !isInPort) return { label: 'SUSPECT', color: '#ff3366', icon: '⚠' };
  if (speed === 0 && isInPort) return { label: 'À QUAI', color: '#00d4ff', icon: '■' };
  return { label: 'INCONNU', color: '#94a3b8', icon: '?' };
};

const getShipTypeInfo = (shipType: number | undefined) => {
  if (!shipType) return { name: 'Unknown', color: '#94a3b8', shape: 'M10 2 L18 10 L10 18 L2 10 Z' }; // Diamond
  if (shipType >= 30 && shipType < 40) return { name: 'Fishing', color: '#fbbf24', shape: 'M4 8 L16 8 L10 18 Z' }; // Triangle pointing down
  if (shipType >= 40 && shipType < 50) return { name: 'High-Speed', color: '#f472b6', shape: 'M10 2 L14 18 L6 18 Z' }; // Narrow Triangle
  if (shipType >= 60 && shipType < 70) return { name: 'Passenger', color: '#34d399', shape: 'M4 6 L16 6 L16 14 L4 14 Z' }; // Rectangle
  if (shipType >= 70 && shipType < 80) return { name: 'Cargo', color: '#00d4ff', shape: 'M10 2 L18 10 L10 18 L2 10 Z' }; // Diamond
  if (shipType >= 80 && shipType < 90) return { name: 'Tanker', color: '#f87171', shape: 'M4 10 A6 6 0 1 1 16 10 A6 6 0 1 1 4 10' }; // Circle-ish
  return { name: 'Other', color: '#a78bfa', shape: 'M10 2 L18 10 L10 18 L2 10 Z' };
};

const getMarkerSize = (importance: number): number => {
  if (importance > 40) return 28;
  if (importance > 20) return 20;
  return 14;
};

const calculateImportance = (feature: DetectionFeature) => {
  const props = feature.properties || {};
  const speed = props.speed ?? 0;
  const ship_type = props.ship_type;
  const isCargo = ship_type === 70;
  const mmsiStr = String(props.mmsi || '');
  const isSuspect = speed === 0 && !mmsiStr.startsWith('242');
  return (speed ?? 0) * 0.3 + (isCargo ? 20 : 0) + (isSuspect ? 30 : 0);
};

const timeAgo = (isoDate: string): string => {
  const diff = Date.now() - new Date(isoDate).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "à l'instant";
  if (mins < 60) return `il y a ${mins} min`;
  const hrs = Math.floor(mins / 60);
  return `il y a ${hrs}h ${mins % 60}m`;
};

function MapStateTracker({ onMove }: { onMove: (center: [number, number], zoom: number) => void }) {
  useMapEvents({
    moveend: (e) => {
      const map = e.target;
      onMove([map.getCenter().lat, map.getCenter().lng], map.getZoom());
    },
  });
  return null;
}

function VesselMarker({ feature, onClick, isSelected }: { feature: DetectionFeature; onClick: (mmsi: string) => void; isSelected: boolean }) {
  const props = feature.properties || {};
  const mmsi = String(props.mmsi || feature.id || '');
  const source = props.source || 'unknown';
  const speed = props.speed ?? 0;
  const timestamp = props.timestamp || new Date().toISOString();
  const [lon, lat] = feature.geometry?.coordinates || [0, 0];
  
  const { data: etaData } = useQuery({
    queryKey: ['vessel-eta-bg', mmsi],
    queryFn: () => getBoatETA(mmsi),
    staleTime: 30000,
  });

  const isInPort = speed === 0 && (Math.abs(lat - 35.89) < 0.02 || Math.abs(lat - 35.78) < 0.02);
  const status = getVesselStatus(speed, isInPort);
  const importance = calculateImportance(feature);
  const size = getMarkerSize(importance);

  const shipTypeInfo = getShipTypeInfo(props.ship_type);

  const icon = useMemo(() => {
    // If satellite detection, we can still use red, or just use the shipType color but maybe strobe it differently.
    // Let's use the shipType color for AIS, and red for raw satellite anomalies.
    const color = source === 'ais' ? shipTypeInfo.color : '#ff3366';
    const shapePath = source === 'ais' ? shipTypeInfo.shape : 'M10 2 L19 18 L1 18 Z';

    const svg = `<div class="relative">
        <div class="absolute inset-[-4px] animate-pulse-ring rounded-full" style="background: ${color}22"></div>
        <svg width="${size}" height="${size}" viewBox="0 0 20 20" class="relative drop-shadow-[0_0_8px_${color}]">
          <path d="${shapePath}" fill="${color}" stroke="white" stroke-width="1.5"/>
          ${isSelected ? '<circle cx="10" cy="10" r="12" fill="none" stroke="white" stroke-width="2" stroke-dasharray="4 2"/>' : ''}
        </svg>
      </div>`;

    return L.divIcon({
      html: svg,
      className: 'bg-transparent border-none',
      iconSize: [size, size],
      iconAnchor: [size/2, size/2],
    });
  }, [source, isSelected, size, shipTypeInfo]);

  const [displayTime, setDisplayTime] = useState(timeAgo(timestamp));

  useEffect(() => {
    const timer = setInterval(() => {
      setDisplayTime(timeAgo(timestamp));
    }, 30000);
    return () => clearInterval(timer);
  }, [timestamp]);

  return (
    <Marker
      position={[lat, lon]}
      icon={icon}
      eventHandlers={{ click: () => onClick(mmsi) }}
    >
      <Popup className="premium-popup">
        <div className="min-w-[220px] p-2">
          <div className="flex items-center justify-between mb-2 text-primary">
            <span className="text-[9px] font-bold uppercase tracking-[0.2em]" style={{ color: shipTypeInfo.color }}>
              {source === 'ais' ? `AIS: ${shipTypeInfo.name}` : 'Satellite Anomaly'}
            </span>
            <span className="text-[9px] font-mono text-text-muted">{displayTime}</span>
          </div>
          <p className="text-lg font-black font-mono text-text-primary mb-1 tracking-tight">{mmsi}</p>
          {etaData && <p className="text-[10px] text-accent-primary/80 font-bold uppercase mb-2">Destination: {etaData.port_destination}</p>}
          <div className="grid grid-cols-2 gap-2 mt-2 border-t border-bg-border pt-2">
            <div>
              <p className="text-[8px] text-text-muted uppercase font-bold">Vitesse</p>
              <p className="text-xs font-mono text-text-primary">{speed} kn</p>
            </div>
            <div>
              <p className="text-[8px] text-text-muted uppercase font-bold">Statut Intelligence</p>
              <div className="flex items-center gap-1 text-primary">
                <span style={{ color: status.color }}>{status.icon}</span>
                <span className="text-[9px] font-black" style={{ color: status.color }}>{status.label}</span>
              </div>
            </div>
          </div>
        </div>
      </Popup>
    </Marker>
  );
}

function VesselDetailPanel({ mmsi, onClose }: { mmsi: string; onClose: () => void }) {
  const { data, isLoading, error } = useQuery<BoatETAResponse>({
    queryKey: ['vessel-eta', mmsi],
    queryFn: () => getBoatETA(mmsi),
    retry: 1,
  });

  return (
    <div className="fixed right-0 top-16 bottom-0 w-[400px] glass-panel z-[1010] animate-slide-in-right overflow-y-auto shadow-2xl">
      <div className="p-6">
        <div className="flex items-start justify-between mb-8 group overflow-hidden">
          <div className="space-y-1">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-1.5 h-1.5 rounded-full bg-accent-primary animate-pulse" />
              <span className="text-[10px] font-black tracking-[0.2em] text-accent-primary uppercase font-display">Tracking Active</span>
            </div>
            <h3 className="text-2xl font-black text-text-primary tracking-tight font-mono">{mmsi}</h3>
            <span className="inline-flex px-2 py-0.5 rounded-sm bg-accent-glow border border-accent-primary/20 text-[9px] font-bold text-accent-primary uppercase tracking-widest mt-1">Multi-Sensor Feed</span>
          </div>
          <button onClick={onClose} className="p-2 rounded border border-bg-border bg-bg-base/50 text-text-muted hover:text-text-primary transition-all hover:border-accent-primary/50">
            <X className="w-4 h-4" />
          </button>
        </div>

        {isLoading && (
          <div className="space-y-6">
            <LoadingSkeleton className="h-24 w-full" />
            <LoadingSkeleton className="h-40 w-full" />
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center justify-center h-64 text-center p-8 bg-status-danger/5 border border-status-danger/20 rounded">
            <AlertTriangle className="w-8 h-8 text-status-danger mb-4 opacity-50" />
            <p className="text-xs font-bold uppercase tracking-widest text-status-danger">Data Interruption</p>
          </div>
        )}

        {data && (
          <div className="space-y-8 animate-fade-in">
            <div className="relative p-5 rounded border border-bg-border bg-bg-base/30 overflow-hidden group">
              <div className="absolute top-0 left-0 w-1 h-full bg-accent-primary opacity-50" />
              <div className="flex items-center gap-3 mb-4">
                <Ship className="w-4 h-4 text-accent-primary" />
                <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Mission Profile</span>
              </div>
              <h4 className="text-xl font-bold text-text-primary uppercase tracking-tight mb-1">{data.nom}</h4>
              {data.type_bateau && (
                <p className="text-[10px] font-mono text-accent-primary/70">{data.type_bateau}</p>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-accent-primary" />
                  <span className="text-[10px] font-bold text-text-primary uppercase tracking-widest">AI Prediction Layer</span>
                </div>
                <span className="text-[10px] font-mono text-status-safe font-bold">{((data.confidence_score ?? 0) * 100).toFixed(1)}% CONF</span>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded border border-bg-border bg-bg-surface">
                  <p className="text-[9px] text-text-muted font-bold uppercase mb-2">ETA (PREDICTED)</p>
                  <p className="text-2xl font-black font-mono text-text-primary leading-tight">
                    {data.eta_predite_minutes}<span className="text-xs font-sans text-text-muted ml-1">min</span>
                  </p>
                </div>
                <div className="p-4 rounded border border-bg-border bg-bg-surface">
                  <p className="text-[9px] text-text-muted font-bold uppercase mb-2">TELEMETRY SPEED</p>
                  <p className="text-2xl font-black font-mono text-text-primary leading-tight">
                    {data.vitesse_actuelle}<span className="text-xs font-sans text-text-muted ml-1">kn</span>
                  </p>
                </div>
              </div>
            </div>

            <div className="p-5 rounded border border-bg-border bg-bg-surface">
              <div className="flex items-center gap-2 mb-4 text-text-muted">
                <Anchor className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Logistics Feed</span>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-bg-border/50">
                  <span className="text-[10px] text-text-muted uppercase font-bold">Destination</span>
                  <span className="text-xs font-bold text-text-primary">{data.port_destination}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-bg-border/50">
                  <span className="text-[10px] text-text-muted uppercase font-bold">Dernière position</span>
                  <span className="text-xs font-mono text-accent-primary">{timeAgo(data.last_seen ?? data.timestamp_actuel)}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-[10px] text-text-muted uppercase font-bold">Uplink Status</span>
                  <span className="text-xs font-bold text-status-safe">EN LIGNE</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { selectedMmsi, selectVessel, clearSelection, sidebarOpen } = useVesselStore();
  const [selectedPortId, setSelectedPortId] = useState<number | null>(null);
  const [sourceFilter, setSourceFilter] = useState<'all' | 'ais' | 'satellite'>('all');
  const [heatmapEnabled, setHeatmapEnabled] = useState(false);
  const [activeAlert, setActiveAlert] = useState<{ mmsi: string, title: string, desc: string, severity: 'danger' | 'warn' } | null>(null);

  const [mapCenter, setMapCenter] = useState<[number, number]>([35.84, -5.65]);
  const [mapZoom, setMapZoom] = useState(10);
  const [time, setTime] = useState(new Date());
  const mapRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const { data } = useQuery({
    queryKey: ['detections'],
    queryFn: getDetections,
    refetchInterval: 30000,
  });

  const filteredFeatures = useMemo(() => {
    if (!data?.features) return [];
    if (sourceFilter === 'all') return data.features;
    return data.features.filter((f) => f.properties.source === sourceFilter);
  }, [data, sourceFilter]);

  const uniqueVessels = useMemo(() => {
    const map = new Map<string, DetectionFeature>();
    filteredFeatures.forEach((f) => {
      const props = f.properties || {};
      const mmsiKey = String(props.mmsi || f.id || '');
      const existing = map.get(mmsiKey);
      const timestamp = props.timestamp || new Date().toISOString();
      if (!existing || new Date(timestamp) > new Date((existing.properties || {}).timestamp || 0)) {
        map.set(mmsiKey, JSON.parse(JSON.stringify(f)));
      }
    });
    
    return Array.from(map.values());
  }, [filteredFeatures]);

  useEffect(() => {
    if (uniqueVessels.length > 0 && !activeAlert) {
      let alertTriggered = false;
      
      for (const v of uniqueVessels) {
        const props = v.properties || {};
        const speed = props.speed ?? 0;
        const mmsi = String(props.mmsi || '');
        const source = props.source || 'ais';
        const [lon, lat] = v.geometry?.coordinates || [0, 0];
        const isInPortApproach = (Math.abs(lat - 35.89) < 0.05 || Math.abs(lat - 35.78) < 0.05) && (Math.abs(lon - -5.50) < 0.05 || Math.abs(lon - -5.80) < 0.05);

        // THREAT 1: Dark Vessel (Satellite Detection uncorrelated with AIS)
        if (source === 'satellite') {
           setActiveAlert({ 
             mmsi: mmsi,
             title: 'CRITICAL: DARK VESSEL DETECTED',
             desc: 'Cible satellite non-corrélée avec le flux AIS. Navire fantôme potentiel.',
             severity: 'danger'
           });
           alertTriggered = true;
           break;
        }

        // THREAT 2: Severe Speeding in Port Approach
        if (isInPortApproach && speed > 22 && source === 'ais') {
           setActiveAlert({ 
             mmsi: mmsi,
             title: 'WARNING: EXCESSIVE APPROACH SPEED',
             desc: `Navire évoluant à ${speed} kn dans la zone d'approche portuaire nord. Risque de collision élevé.`,
             severity: 'warn'
           });
           alertTriggered = true;
           break;
        }
      }

      if (alertTriggered) {
         setTimeout(() => setActiveAlert(null), 12000);
      }
    }
  }, [uniqueVessels, activeAlert]);

  const aisCount = uniqueVessels.filter((v) => (v.properties?.source) === 'ais').length;
  const satCount = uniqueVessels.filter((v) => (v.properties?.source) === 'satellite').length;

  return (
    <div className="relative h-[calc(100vh-64px)] overflow-hidden bg-bg-base">
      <MapContainer 
        center={mapCenter} 
        zoom={mapZoom} 
        className="w-full h-full" 
        ref={mapRef} 
        zoomControl={false}
      >
        <MapStateTracker onMove={(c, z) => { setMapCenter(c); setMapZoom(z); }} />
        <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" attribution='&copy; CARTO' />
        
        {heatmapEnabled && uniqueVessels.map((f, i) => (
          f.geometry?.coordinates ? (
          <CircleMarker
            key={`heat-${i}`}
            center={[f.geometry.coordinates[1], f.geometry.coordinates[0]]}
            radius={40}
            pathOptions={{
              fillColor: '#ffaa00',
              fillOpacity: 0.05,
              stroke: false
            }}
          />
          ) : null
        ))}

        {uniqueVessels.map((f) => (
          <VesselMarker key={f.properties?.mmsi || f.id} feature={f} onClick={selectVessel} isSelected={selectedMmsi === (f.properties?.mmsi || f.id)} />
        ))}
        {[
          { pos: [35.788, -5.808], name: "Tanger Ville", id: 6 },
          { pos: [35.890, -5.500], name: "Tanger Med", id: 7 },
        ].map(port => (
          <Circle key={port.id} center={port.pos as [number, number]} radius={3500} pathOptions={{ fillColor: '#00d4ff', fillOpacity: 0.1, color: '#00d4ff', weight: 1, dashArray: '5, 5' }} eventHandlers={{ click: () => setSelectedPortId(port.id) }}>
            <Popup className="premium-popup">
              <div className="p-1">
                <span className="text-[10px] font-bold text-accent-primary uppercase tracking-widest">Strategic Port Hub</span>
                <p className="text-sm font-black text-text-primary mt-1 uppercase font-display">{port.name}</p>
                <div className="h-px bg-bg-border my-2" />
                <button onClick={() => setSelectedPortId(port.id)} className="w-full py-1.5 bg-accent-primary/10 border border-accent-primary/30 text-[9px] font-black uppercase text-accent-primary hover:bg-accent-primary transition-all">Intel Summary</button>
              </div>
            </Popup>
          </Circle>
        ))}
      </MapContainer>

      <div className="absolute top-6 right-6 z-[1000] space-y-3 pointer-events-none">
        <div className="glass-panel glow-border p-4 pointer-events-auto bg-bg-surface/90 border-accent-primary/30 shadow-[0_0_20px_rgba(0,212,255,0.08)]">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1.5 h-1.5 rounded-full bg-status-safe animate-pulse" />
            <span className="text-[9px] font-black text-accent-primary uppercase tracking-[0.2em]">System Status</span>
          </div>
          <div className="space-y-1.5 font-mono text-[10px]">
            <div className="flex justify-between gap-6">
              <span className="text-text-muted">Source</span>
              <span className="text-accent-primary font-bold">Multi-Sensor (AIS + SAT)</span>
            </div>
            <div className="flex justify-between gap-6">
              <span className="text-text-muted">Precision</span>
              <span className="text-status-safe font-bold">96.64%</span>
            </div>
            <div className="flex justify-between gap-6">
              <span className="text-text-muted">Mode</span>
              <span className="text-text-primary font-bold">REAL-TIME</span>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-2 pointer-events-auto">
          <MagneticButton
            onClick={() => setHeatmapEnabled(!heatmapEnabled)}
            variant={heatmapEnabled ? "primary" : "ghost"}
            className="w-full p-3 flex items-center justify-center gap-2"
          >
            <Layers className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Heatmap</span>
          </MagneticButton>
          <MagneticButton variant="danger" className="w-full p-3" onClick={() => navigate('/satellite')}>
            <div className="flex items-center justify-center gap-2">
              <Target className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Recon Satellite</span>
            </div>
          </MagneticButton>
          <MagneticButton variant="ghost" className="w-full p-3 bg-accent-glow text-accent-primary" onClick={() => navigate('/satellite')}>
            <div className="flex items-center justify-center gap-2">
              <Camera className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">CCTV Feed</span>
            </div>
          </MagneticButton>
        </div>
      </div>

      <div className="absolute top-6 left-6 z-[1000] glass-panel glow-border p-4 w-60 pointer-events-auto">
        <div className="flex items-center justify-between mb-4"><span className="text-[10px] font-black text-text-primary uppercase tracking-widest">Intelligence Hub</span><Activity className="w-3 h-3 text-status-safe animate-pulse" /></div>
        <div className="space-y-2">
          <div className="flex justify-between items-baseline"><span className="text-[10px] text-text-muted font-bold">AIS Targets</span><span className="text-sm font-black text-accent-primary">{aisCount}</span></div>
          <div className="flex justify-between items-baseline"><span className="text-[10px] text-text-muted font-bold">Visual Detects</span><span className="text-sm font-black text-status-danger">{satCount}</span></div>
        </div>
        <div className="mt-4 pt-3 border-t border-bg-border/30 text-[9px] font-mono text-text-muted text-right">{time.toLocaleTimeString()}</div>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[1000] flex gap-2">
        <div className="glass-panel flex items-center p-1.5 gap-1 bg-bg-surface/90">
          {(['all', 'ais', 'satellite'] as const).map((f) => (
            <button key={f} onClick={() => setSourceFilter(f)} className={clsx("px-4 py-1.5 rounded text-[10px] font-black uppercase tracking-widest transition-all", sourceFilter === f ? "bg-accent-primary text-bg-base" : "text-text-muted hover:text-text-primary hover:bg-bg-elevated")}>{f}</button>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {sidebarOpen && selectedMmsi && !selectedPortId && <VesselDetailPanel mmsi={selectedMmsi} onClose={clearSelection} />}
        {selectedPortId && <PortStatusPanel portId={selectedPortId} onClose={() => setSelectedPortId(null)} />}
      </AnimatePresence>

      <AnimatePresence>
        {activeAlert && (
          <motion.div initial={{ y: 100, x: '-50%', opacity: 0 }} animate={{ y: 0, x: '-50%', opacity: 1 }} exit={{ y: 100, x: '-50%', opacity: 0 }} 
            className={clsx(
              "fixed bottom-24 left-1/2 z-[2500] w-[400px] glass-panel p-4 shadow-2xl",
              activeAlert.severity === 'danger' ? "bg-status-danger/10 border-status-danger/50" : "bg-status-warn/10 border-status-warn/50"
            )}>
            <div className="flex gap-4">
              <div className={clsx(
                "w-10 h-10 rounded flex items-center justify-center animate-pulse",
                activeAlert.severity === 'danger' ? "bg-status-danger" : "bg-status-warn"
              )}><ShieldAlert className="w-6 h-6 text-white" /></div>
              <div className="flex-1">
                <p className={clsx(
                  "text-[10px] font-black tracking-widest uppercase mb-1",
                   activeAlert.severity === 'danger' ? "text-status-danger" : "text-status-warn"
                )}>{activeAlert.title}</p>
                <p className="text-sm font-black text-text-primary font-mono">ID / MMSI : {activeAlert.mmsi}</p>
                <p className="text-[9px] font-mono mt-1 text-text-muted">{activeAlert.desc}</p>
                <div className="mt-4 flex gap-2">
                  <MagneticButton variant={activeAlert.severity === 'danger' ? "danger" : "primary"} onClick={() => { selectVessel(activeAlert.mmsi); setActiveAlert(null); }} className="flex-1 py-1.5 text-[10px]">VERROUILLER LA CIBLE</MagneticButton>
                  <MagneticButton variant="ghost" onClick={() => setActiveAlert(null)} className="px-3 py-1.5 text-[10px]">Quittance (Dismiss)</MagneticButton>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
