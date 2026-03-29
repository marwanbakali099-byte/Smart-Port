import { useQuery, useMutation } from '@tanstack/react-query';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { getSatelliteDetections, runSatelliteDetect } from '../../api/satellite';
import { getVideoStats, getVideoStreamUrl } from '../../api/video';
import { PageHeader, LoadingSkeleton, EmptyState } from '../../components/ui/SharedUI';
import { formatTimeAgo, formatCoordinates } from '../../utils/formatters';
import {
  Satellite as SatIcon,
  Eye,
  MapPin,
  Maximize2,
  Radio,
  Target,
  ShieldAlert,
  Video,
  Activity,
  Zap,
} from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';

function MapClickHandler({ onLocationSelect }: { onLocationSelect: (lat: number, lon: number) => void }) {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

const pickerIcon = L.divIcon({
  html: `<div class="relative"><div class="absolute inset-[-4px] animate-pulse-ring rounded-full" style="background: #00d4ff22"></div><svg width="20" height="20" viewBox="0 0 20 20" class="relative drop-shadow-[0_0_8px_#00d4ff]"><circle cx="10" cy="10" r="5" fill="#00d4ff" stroke="white" stroke-width="2"/></svg></div>`,
  className: 'bg-transparent border-none',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

export default function SatelliteView() {
  const [selectedId, setSelectedId] = useState<number | null>(null);

  // ─── AIS/Satellite detection gallery ───────────────────────────────────────
  const { data: satDetections = [], isLoading } = useQuery({
    queryKey: ['satellite'],
    queryFn: getSatelliteDetections,
  });

  // ─── Video stats from live CCTV pipeline ───────────────────────────────────
  const { data: videoStats } = useQuery({
    queryKey: ['video-stats'],
    queryFn: getVideoStats,
    refetchInterval: 5000,
  });

  // ─── Satellite zone detect (POST) ──────────────────────────────────────────
  const [lat, setLat] = useState('35.794');
  const [lon, setLon] = useState('-5.804');

  const detectMutation = useMutation({
    mutationFn: () => runSatelliteDetect(parseFloat(lat), parseFloat(lon)),
  });

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-10 animate-fade-in pb-24">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <PageHeader
          title="Satellite Reconnaissance"
          subtitle={`${satDetections.length} orbital detection feeds across maritime surveillance grid`}
        />
        <div className="flex items-center gap-3 px-4 py-2 bg-bg-surface border border-bg-border rounded-lg shadow-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-status-danger animate-pulse" />
          <Radio className="w-3.5 h-3.5 text-status-danger" />
          <span className="text-[10px] font-black text-text-primary tracking-[0.2em] uppercase">Orbital_Feed: Active</span>
          <div className="w-px h-4 bg-bg-border mx-1" />
          <span className="text-[10px] font-mono text-text-muted font-bold uppercase">SAT-4A / SAT-7B</span>
        </div>
      </div>

      {/* ── Stats Bar ──────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-6 p-4 bg-bg-surface/50 border border-bg-border rounded-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded bg-status-danger/10 border border-status-danger/20 flex items-center justify-center">
            <Target className="w-5 h-5 text-status-danger" />
          </div>
          <div>
            <p className="text-[9px] font-black text-text-muted uppercase tracking-widest">Total Detections</p>
            <p className="text-lg font-black font-mono text-text-primary">{satDetections.length}</p>
          </div>
        </div>
        <div className="w-px h-10 bg-bg-border" />
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded bg-accent-glow border border-accent-primary/20 flex items-center justify-center">
            <SatIcon className="w-5 h-5 text-accent-primary" />
          </div>
          <div>
            <p className="text-[9px] font-black text-text-muted uppercase tracking-widest">Sensor Mode</p>
            <p className="text-xs font-black text-accent-primary uppercase tracking-wider">Multi-Spectral Imaging</p>
          </div>
        </div>
        <div className="w-px h-10 bg-bg-border" />
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded bg-status-safe/10 border border-status-safe/20 flex items-center justify-center">
            <Eye className="w-5 h-5 text-status-safe" />
          </div>
          <div>
            <p className="text-[9px] font-black text-text-muted uppercase tracking-widest">Resolution</p>
            <p className="text-xs font-black text-status-safe uppercase tracking-wider">0.5m GSD</p>
          </div>
        </div>
        {videoStats && (
          <>
            <div className="w-px h-10 bg-bg-border" />
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded bg-status-warn/10 border border-status-warn/20 flex items-center justify-center">
                <Activity className="w-5 h-5 text-status-warn" />
              </div>
              <div>
                <p className="text-[9px] font-black text-text-muted uppercase tracking-widest">CCTV Records</p>
                <p className="text-lg font-black font-mono text-text-primary">{videoStats.total_records}</p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          SECTION 1 — Zone Satellite Detection (POST)
      ══════════════════════════════════════════════════════════════════════ */}
      <div className="glass-panel rounded-xl border border-bg-border overflow-hidden">
        <div className="p-6 border-b border-bg-border/50 bg-gradient-to-r from-accent-primary/5 to-transparent flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-accent-primary/10 border border-accent-primary/20 flex items-center justify-center">
              <SatIcon className="w-4 h-4 text-accent-primary" />
            </div>
            <div>
              <h2 className="text-sm font-black text-text-primary tracking-tight uppercase">Zone Satellite Detection</h2>
              <p className="text-[10px] text-text-muted font-bold tracking-wider uppercase">Mapbox + Roboflow AI</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-1 bg-status-safe/10 border border-status-safe/20 rounded-md">
            <div className="w-1.5 h-1.5 rounded-full bg-status-safe animate-pulse" />
            <span className="text-[8px] font-black text-status-safe tracking-widest uppercase">Live</span>
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Input form */}
            <div className="space-y-5">
              {/* Interactive Map Picker */}
              <div className="h-[200px] w-full rounded-lg overflow-hidden border border-bg-border relative z-0">
                <MapContainer 
                  center={[parseFloat(lat) || 35.794, parseFloat(lon) || -5.804]} 
                  zoom={12} 
                  className="w-full h-full"
                >
                  <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" attribution='&copy; CARTO' />
                  <MapClickHandler onLocationSelect={(newLat, newLon) => {
                    setLat(newLat.toFixed(4));
                    setLon(newLon.toFixed(4));
                  }} />
                  <Marker position={[parseFloat(lat) || 35.794, parseFloat(lon) || -5.804]} icon={pickerIcon} />
                </MapContainer>
                <div className="absolute top-2 left-2 z-[400] px-2 py-1 bg-bg-base/80 border border-bg-border backdrop-blur-sm rounded text-[9px] font-black text-text-muted uppercase tracking-widest pointer-events-none">
                  Click map to select target zone
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-text-muted uppercase tracking-widest">Latitude</label>
                <input
                  type="number"
                  step="0.001"
                  value={lat}
                  onChange={(e) => setLat(e.target.value)}
                  className="w-full px-3 py-2.5 bg-bg-base border border-bg-border rounded-lg text-sm font-mono text-text-primary focus:border-accent-primary/50 focus:outline-none focus:ring-1 focus:ring-accent-primary/20 transition-all"
                  placeholder="35.794"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-text-muted uppercase tracking-widest">Longitude</label>
                <input
                  type="number"
                  step="0.001"
                  value={lon}
                  onChange={(e) => setLon(e.target.value)}
                  className="w-full px-3 py-2.5 bg-bg-base border border-bg-border rounded-lg text-sm font-mono text-text-primary focus:border-accent-primary/50 focus:outline-none focus:ring-1 focus:ring-accent-primary/20 transition-all"
                  placeholder="-5.804"
                />
              </div>
            </div>

            <button
              onClick={() => detectMutation.mutate()}
              disabled={detectMutation.isPending}
              className="w-full py-3 bg-accent-primary/10 hover:bg-accent-primary/20 border border-accent-primary/30 hover:border-accent-primary/60 rounded-lg text-[11px] font-black text-accent-primary uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(0,212,255,0)] hover:shadow-[0_0_20px_rgba(0,212,255,0.15)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              {detectMutation.isPending ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-accent-primary/30 border-t-accent-primary rounded-full animate-spin" />
                  Scanning...
                </>
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5" />
                  [RUN_DETECTION]
                </>
              )}
            </button>

            {detectMutation.isError && (
              <p className="text-[10px] text-status-danger font-bold text-center">
                Detection failed — check backend connection
              </p>
            )}

            {/* Detection results list */}
            {detectMutation.data && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3"
              >
                <div className="flex items-center justify-between">
                  <p className="text-[9px] font-black text-text-muted uppercase tracking-widest">Detections Found</p>
                  <span className="text-[9px] font-mono font-black text-accent-primary">{detectMutation.data.count} vessels</span>
                </div>
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {detectMutation.data.detections.map((d, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between px-4 py-3 bg-bg-base border border-bg-border/50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 bg-accent-primary/10 border border-accent-primary/20 rounded flex items-center justify-center">
                          <span className="text-[9px] font-black text-accent-primary">{i + 1}</span>
                        </div>
                        <span className="text-[10px] font-mono text-text-muted">
                          [{d.xmin},{d.ymin}] → [{d.xmax},{d.ymax}]
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div
                          className="h-1.5 w-16 bg-bg-border rounded-full overflow-hidden"
                        >
                          <div
                            className="h-full bg-accent-primary rounded-full"
                            style={{ width: `${d.conf * 100}%` }}
                          />
                        </div>
                        <span className={clsx(
                          'text-[10px] font-black font-mono',
                          d.conf > 0.6 ? 'text-status-safe' : d.conf > 0.4 ? 'text-status-warn' : 'text-status-danger'
                        )}>
                          {(d.conf * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-[9px] font-mono text-text-muted text-center">
                  Source: {detectMutation.data.source}
                </p>
              </motion.div>
            )}
          </div>

          {/* Satellite image result */}
          <div className="flex flex-col items-center justify-center">
            {detectMutation.data?.image_url ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative w-full"
              >
                <img
                  src={detectMutation.data.image_url.replace('http://localhost:8000', '')}
                  alt="Satellite detection overlay"
                  className="w-full rounded-lg border border-accent-primary/20 shadow-[0_0_30px_rgba(0,212,255,0.1)]"
                />
                <div className="absolute top-2 left-2 px-2 py-1 bg-bg-base/80 border border-accent-primary/30 rounded text-[9px] font-black text-accent-primary tracking-widest uppercase backdrop-blur-sm">
                  Lat {detectMutation.data.coordinates.lat} · Lon {detectMutation.data.coordinates.lon}
                </div>
              </motion.div>
            ) : (
              <div className="w-full h-56 flex flex-col items-center justify-center rounded-lg border border-dashed border-bg-border bg-bg-base/30 gap-4">
                <SatIcon className="w-12 h-12 text-accent-primary/10" />
                <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">
                  Enter coordinates and run detection
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          SECTION 2 — Live CCTV Video Detection
      ══════════════════════════════════════════════════════════════════════ */}
      <div className="glass-panel rounded-xl border border-bg-border overflow-hidden">
        <div className="p-6 border-b border-bg-border/50 bg-gradient-to-r from-status-danger/5 to-transparent flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-status-danger/10 border border-status-danger/20 flex items-center justify-center">
              <Video className="w-4 h-4 text-status-danger" />
            </div>
            <div>
              <h2 className="text-sm font-black text-text-primary tracking-tight uppercase">Live CCTV Detection</h2>
              <p className="text-[10px] text-text-muted font-bold tracking-wider uppercase">Real-time vessel speed tracking</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-1 bg-status-danger/10 border border-status-danger/20 rounded-md">
            <div className="w-1.5 h-1.5 rounded-full bg-status-danger animate-pulse" />
            <span className="text-[8px] font-black text-status-danger tracking-widest uppercase">Recording</span>
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* MJPEG Stream */}
          <div className="space-y-3">
            <p className="text-[9px] font-black text-text-muted uppercase tracking-widest">Live Feed</p>
            <div className="relative rounded-lg overflow-hidden border border-status-danger/20 bg-bg-base">
              <img
                src={getVideoStreamUrl()}
                alt="Live CCTV vessel detection stream"
                className="w-full"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
              {/* Fallback overlay if stream unavailable */}
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-bg-base/90" id="stream-fallback" style={{ display: 'none' }}>
                <Video className="w-10 h-10 text-status-danger/20" />
                <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">Stream Unavailable</p>
              </div>
              <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2 py-1 bg-bg-base/80 border border-status-danger/30 rounded backdrop-blur-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-status-danger animate-pulse" />
                <span className="text-[9px] font-black text-status-danger uppercase tracking-widest">LIVE</span>
              </div>
            </div>
          </div>

          {/* Recent detection records */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-[9px] font-black text-text-muted uppercase tracking-widest">Recent Detections</p>
              {videoStats && (
                <span className="text-[9px] font-mono font-black text-accent-primary">{videoStats.total_records} total records</span>
              )}
            </div>

            {videoStats ? (
              <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
                {videoStats.last_detections.map((rec, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="flex items-center gap-4 px-4 py-3 bg-bg-base border border-bg-border/50 rounded-lg hover:border-accent-primary/20 transition-colors group"
                  >
                    <div className="w-8 h-8 bg-status-danger/10 border border-status-danger/20 rounded flex items-center justify-center flex-shrink-0">
                      <span className="text-[9px] font-black text-status-danger font-mono">#{rec.id}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-mono font-black text-text-muted">{rec.heure}</span>
                        <span className={clsx(
                          'text-[10px] font-black font-mono',
                          rec.vitesse > 5 ? 'text-status-danger' : rec.vitesse > 2 ? 'text-status-warn' : 'text-status-safe'
                        )}>
                          {rec.vitesse.toFixed(2)} kn
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 h-1 bg-bg-border rounded-full overflow-hidden">
                          <div
                            className="h-full bg-accent-primary rounded-full transition-all"
                            style={{ width: `${rec.confiance}%` }}
                          />
                        </div>
                        <span className="text-[9px] font-mono text-text-muted">{rec.confiance.toFixed(1)}%</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="h-48 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-accent-primary/30 border-t-accent-primary rounded-full animate-spin" />
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
