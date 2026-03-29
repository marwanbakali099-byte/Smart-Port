import { useQuery } from '@tanstack/react-query';
import { getDetections } from '../../api/detections';
import { PageHeader, LoadingSkeleton, EmptyState, StatusBadge } from '../../components/ui/SharedUI';
import { formatTimeAgo, formatCoordinates } from '../../utils/formatters';
import { Ship, Search, Download, ChevronRight, ArrowUpDown, Database } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import type { DetectionFeature } from '../../types/models';
import { GlassCard, MagneticButton } from '../../components/ui/SharedUI';

interface VesselRow {
  mmsi: string;
  source: string;
  lat: number;
  lon: number;
  speed: number;
  timestamp: string;
  eta_minutes: number | null;
  status: string;
  detectionCount: number;
}

export default function Vessels() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<keyof VesselRow>('timestamp');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 15;

  const { data, isLoading } = useQuery({
    queryKey: ['detections'],
    queryFn: getDetections,
    refetchInterval: 5000,
  });

  const vessels = useMemo(() => {
    if (!data?.features) return [];
    const map = new Map<string, VesselRow>();
    data.features.forEach((f: DetectionFeature) => {
      const props = f.properties || {};
      const { source, speed, timestamp, eta_minutes } = props;
      const mmsi = props.mmsi || f.id;
      const [lon, lat] = f.geometry?.coordinates || [0, 0];
      const mmsiStr = String(mmsi || '');
      const existing = map.get(mmsiStr);
      
      // Determine status based on speed
      let status = 'MOUILLÉ';
      if ((speed ?? 0) > 5) status = 'EN ROUTE';
      else if ((speed ?? 0) > 0.5) status = 'MANOEUVRE';
      else if (mmsiStr.endsWith('1')) status = 'À QUAI'; // mock some at dock

      const validTimestamp = timestamp || new Date().toISOString();
      if (!existing || new Date(validTimestamp) > new Date(existing.timestamp)) {
        map.set(mmsiStr, {
          mmsi: mmsiStr,
          source: source || 'unknown',
          lat: lat || 0,
          lon: lon || 0,
          speed: speed ?? 0,
          timestamp: timestamp || new Date().toISOString(),
          eta_minutes: eta_minutes ?? null,
          status,
          detectionCount: (existing?.detectionCount || 0) + 1,
        });
      } else {
        map.set(mmsiStr, { ...existing, detectionCount: existing.detectionCount + 1 });
      }
    });
    return Array.from(map.values());
  }, [data]);

  const filteredVessels = useMemo(() => {
    let result = vessels;
    if (search) {
      result = result.filter((v) => v.mmsi.toLowerCase().includes(search.toLowerCase()));
    }
    if (statusFilter !== 'all') {
      result = result.filter((v) => v.status === statusFilter);
    }
    // Sort
    result.sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;
      const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return result;
  }, [vessels, search, statusFilter, sortField, sortDir]);

  const totalPages = Math.ceil(filteredVessels.length / perPage);
  const paginatedVessels = filteredVessels.slice((currentPage - 1) * perPage, currentPage * perPage);

  const handleSort = (field: keyof VesselRow) => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const handleExport = () => {
    const csv = [
      'MMSI,Source,Latitude,Longitude,Speed,Status,Timestamp,ETA_Minutes',
      ...filteredVessels.map((v) =>
        `${v.mmsi},${v.source},${v.lat},${v.lon},${v.speed},${v.status},${v.timestamp},${v.eta_minutes || ''}`
      ),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'vessels.csv';
    a.click();
  };

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-8 animate-fade-in pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <PageHeader 
          title="Maritime Asset Registry" 
          subtitle={`Operational overview of ${vessels.length} tracked entities in sector`} 
        />
        
        <MagneticButton variant="ghost" onClick={handleExport} className="px-4 py-2.5">
          <div className="flex items-center gap-2">
            <Download className="w-3.5 h-3.5" />
            [EXPORT_MANIFEST]
          </div>
        </MagneticButton>
      </div>

      {/* Advanced Controls Bar */}
      <GlassCard index={0} enableTilt={false} className="p-4">
      <div className="flex flex-col lg:flex-row lg:items-center gap-4 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-accent-primary opacity-50" />
        
        {/* Omni-Search */}
        <div className="relative group flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted group-focus-within:text-accent-primary transition-colors" />
          <input
            type="text"
            placeholder="OMNI-SEARCH: MMSI / CALLSIGN / IMO"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            className="w-full bg-bg-base border border-bg-border rounded py-2.5 pl-10 pr-4 text-xs font-mono text-text-primary placeholder:text-text-muted/50 focus:border-accent-primary/50 outline-none transition-all"
          />
        </div>

        {/* Dynamic Status Filters */}
        <div className="flex flex-wrap gap-2">
          {['all', 'EN ROUTE', 'MOUILLÉ', 'À QUAI'].map((s) => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setCurrentPage(1); }}
              className={clsx(
                "px-3 py-1.5 rounded text-[9px] font-bold uppercase tracking-widest transition-all border",
                statusFilter === s
                  ? "bg-accent-primary/10 border-accent-primary text-accent-primary"
                  : "bg-bg-base border-bg-border text-text-muted hover:border-text-primary hover:text-text-primary"
              )}
            >
              {s === 'all' ? 'FULL FLEET' : s}
            </button>
          ))}
        </div>

        <div className="lg:ml-auto flex items-center gap-4">
           <div className="flex items-center gap-2 px-3 py-1.5 bg-bg-base rounded border border-bg-border">
              <Database className="w-3.5 h-3.5 text-accent-primary" />
              <span className="text-[9px] font-mono font-bold text-text-muted tracking-tighter uppercase">Source: STRATEGIC_LINK_01</span>
           </div>
        </div>
      </div>
      </GlassCard>

      {/* Table Section */}
      <GlassCard index={1} enableTilt={false} className="overflow-hidden select-none">
      <div>
        {isLoading ? (
          <div className="p-8 space-y-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <LoadingSkeleton key={i} className="h-12 w-full opacity-50" />
            ))}
          </div>
        ) : paginatedVessels.length === 0 ? (
          <EmptyState message="NO ASSETS DETECTED IN CURRENT SECTOR" icon={<Ship className="w-12 h-12 text-accent-primary/20" />} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-bg-elevated/50">
                  {[
                    { key: 'mmsi', label: 'Asset Identifier', width: '20%' },
                    { key: 'source', label: 'Sensor Optic', width: '12%' },
                    { key: 'status', label: 'Kinetic State', width: '15%' },
                    { key: 'speed', label: 'Velocity', width: '12%' },
                    { key: 'lat', label: 'Nav Coordinates', width: '20%' },
                    { key: 'timestamp', label: 'Temporal Sync', width: '15%' },
                  ].map((col) => (
                    <th
                      key={col.key}
                      onClick={() => handleSort(col.key as keyof VesselRow)}
                      style={{ width: col.width }}
                      className="text-left px-5 py-4 text-[9px] font-black text-text-muted uppercase tracking-[0.2em] cursor-pointer hover:bg-bg-elevated transition-colors border-b border-bg-border group"
                    >
                      <div className="flex items-center gap-2">
                        {col.label}
                        <ArrowUpDown className={clsx(
                          "w-3 h-3 transition-colors",
                          sortField === col.key ? "text-accent-primary" : "text-text-muted/30 group-hover:text-text-muted"
                        )} />
                      </div>
                    </th>
                  ))}
                  <th className="w-12 border-b border-bg-border" />
                </tr>
              </thead>
              <tbody className="divide-y divide-bg-border/30">
                <AnimatePresence mode="popLayout">
                  {paginatedVessels.map((vessel, i) => (
                    <motion.tr
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2, delay: i * 0.02 }}
                      key={vessel.mmsi}
                      onClick={() => navigate(`/vessels/${vessel.mmsi}`)}
                      className="group hover:bg-bg-elevated/40 cursor-pointer transition-all relative"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                           <div className="w-2 h-2 rounded-full bg-accent-primary animate-pulse opacity-0 group-hover:opacity-100 transition-opacity" />
                           <span className="text-sm font-black font-mono text-text-primary tracking-tight group-hover:text-accent-primary transition-colors">
                            {vessel.mmsi}
                           </span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                         <span className={clsx(
                           "text-[9px] font-black px-2 py-1 rounded border tracking-widest",
                           vessel.source === 'ais' 
                            ? "bg-accent-primary/5 border-accent-primary/20 text-accent-primary" 
                            : "bg-status-danger/5 border-status-danger/20 text-status-danger"
                         )}>
                           {vessel.source.toUpperCase()}
                         </span>
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge status={vessel.status} size="sm" />
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-xs font-mono font-bold text-text-primary">
                          {vessel.speed.toFixed(1)} <span className="text-text-muted text-[10px]">KN</span>
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-[10px] font-mono text-text-muted leading-tight block">
                          {formatCoordinates(vessel.lat, vessel.lon)}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-[10px] font-bold text-text-muted uppercase">
                          {formatTimeAgo(vessel.timestamp)}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                         <ChevronRight className="w-4 h-4 text-text-muted group-hover:text-accent-primary group-hover:translate-x-1 transition-all" />
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
      </div>
      </GlassCard>

      {/* Sophisticated Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between p-4 bg-bg-surface/30 border border-bg-border rounded-lg">
          <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">
            Showing <span className="text-accent-primary">{(currentPage - 1) * perPage + 1}–{Math.min(currentPage * perPage, filteredVessels.length)}</span> of <span className="text-text-primary">{filteredVessels.length}</span> Assets
          </p>
          <div className="flex gap-1.5">
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={clsx(
                  "w-8 h-8 rounded text-[10px] font-black transition-all border",
                  currentPage === page
                    ? "bg-accent-primary/20 border-accent-primary text-accent-primary shadow-[0_0_10px_rgba(0,212,255,0.2)]"
                    : "bg-bg-base border-bg-border text-text-muted hover:border-text-primary hover:text-text-primary"
                )}
              >
                {page.toString().padStart(2, '0')}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
