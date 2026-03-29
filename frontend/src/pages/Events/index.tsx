import { useQuery } from '@tanstack/react-query';
import { getEvents } from '../../api/events';
import { PageHeader, LoadingSkeleton, EmptyState } from '../../components/ui/SharedUI';
import { formatTimeAgo } from '../../utils/formatters';
import { Ship, Download, LogIn, LogOut, Radio, Filter, Database } from 'lucide-react';
import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { GlassCard, MagneticButton } from '../../components/ui/SharedUI';

export default function Events() {
  const [typeFilter, setTypeFilter] = useState('all');
  const { data: events, isLoading } = useQuery({ queryKey: ['events'], queryFn: getEvents });

  const filtered = useMemo(() => {
    if (!events) return [];
    return typeFilter === 'all' ? events : events.filter(e => e.event_type === typeFilter);
  }, [events, typeFilter]);

  const handleExport = () => {
    const csv = ['Timestamp,MMSI,Vessel Name,Type,Port', ...filtered.map(e => `${e.timestamp},${e.boat_mmsi || ''},${e.boat_name || ''},${e.event_type},${e.port_name || ''}`)].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'events.csv'; a.click();
  };

  return (
    <div className="p-8 max-w-[1200px] mx-auto space-y-8 animate-fade-in pb-24">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <PageHeader 
          title="Strategic Asset Feed" 
          subtitle="Real-time chronological log of harbor logistics and sector transitions" 
        />
        
        <div className="flex items-center gap-3 px-4 py-2 bg-bg-surface border border-bg-border rounded-lg shadow-xl relative overflow-hidden">
           <div className="absolute top-0 left-0 w-1 h-full bg-accent-primary animate-pulse" />
           <Radio className="w-3.5 h-3.5 text-accent-primary" />
           <span className="text-[10px] font-black text-text-primary tracking-[0.2em] uppercase">Live_Stream: 104.2 MB/s</span>
        </div>
      </div>

      <GlassCard index={0} enableTilt={false} className="p-4">
      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
        <div className="flex items-center gap-2">
           <Filter className="w-3.5 h-3.5 text-accent-primary" />
           <span className="text-[9px] font-black tracking-widest text-text-muted uppercase">Vector Filter</span>
        </div>
        
        <div className="flex gap-2">
          {['all', 'entry', 'exit'].map(t => (
            <button 
              key={t} 
              onClick={() => setTypeFilter(t)} 
              className={clsx(
                "px-4 py-1.5 rounded text-[10px] font-black uppercase tracking-tighter border transition-all",
                typeFilter === t
                  ? "bg-accent-primary/20 border-accent-primary text-accent-primary shadow-[0_0_10px_rgba(0,212,255,0.1)]"
                  : "bg-bg-base border-bg-border text-text-muted hover:border-text-primary hover:text-text-primary"
              )}
            >
              {t === 'all' ? 'FULL_CHRONICLE' : `${t.toUpperCase()}_DETECTED`}
            </button>
          ))}
        </div>

        <div className="lg:ml-auto flex items-center gap-4">
           <div className="flex items-center gap-2 px-3 py-1.5 bg-bg-base rounded border border-bg-border">
              <Database className="w-3.5 h-3.5 text-accent-primary" />
              <span className="text-[9px] font-mono font-bold text-text-muted tracking-tighter uppercase">Source: LOGISTICS_FEED_B</span>
           </div>
           
           <MagneticButton variant="ghost" onClick={handleExport} className="px-4 py-2">
             <div className="flex items-center gap-2">
               <Download className="w-3.5 h-3.5" />
               [EXPORT_MANIFEST]
             </div>
           </MagneticButton>
        </div>
      </div>
      </GlassCard>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 10 }).map((_, i) => (
            <LoadingSkeleton key={i} className="h-16 w-full rounded border border-bg-border bg-bg-surface/30" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState message="NO LOGISTICS VECTORS DETECTED IN CURRENT WINDOW" icon={<Ship className="w-12 h-12 text-accent-primary/10" />} />
      ) : (
        <div className="space-y-3 relative">
          <div className="absolute left-[20px] top-0 bottom-0 w-px bg-bg-border/30 z-0" />
          
          <AnimatePresence mode="popLayout">
            {filtered.map((event, i) => (
              <motion.div 
                layout
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2, delay: i * 0.02 }}
                key={event.id} 
                className={clsx(
                  "flex items-center gap-6 px-6 py-4 rounded-lg bg-bg-surface/50 border border-bg-border hover:bg-bg-elevated/50 transition-all relative z-10 group",
                  event.event_type === 'entry' ? "border-l-status-safe bg-status-safe/[0.02]" : "border-l-status-warn bg-status-warn/[0.02]"
                )}
              >
                <div className={clsx(
                  "w-10 h-10 flex items-center justify-center rounded-full border group-hover:scale-110 transition-transform",
                  event.event_type === 'entry' ? "bg-status-safe/10 border-status-safe/30" : "bg-status-warn/10 border-status-warn/30"
                )}>
                  {event.event_type === 'entry' ? <LogIn className="w-4 h-4 text-status-safe" /> : <LogOut className="w-4 h-4 text-status-warn" />}
                </div>

                <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                  <div className="space-y-1">
                    <p className="text-xs font-black text-text-primary tracking-tight uppercase group-hover:text-accent-primary transition-colors">
                      {event.boat_name || 'IDENT_UNKNOWN'}
                    </p>
                    <p className="text-[10px] font-mono font-bold text-text-muted">{event.boat_mmsi}</p>
                  </div>
                  
                  <div className="flex justify-start md:justify-center">
                    <span className={clsx(
                       "text-[9px] font-black px-2 py-1 rounded border tracking-widest",
                       event.event_type === 'entry' ? "bg-status-safe/5 border-status-safe/20 text-status-safe" : "bg-status-warn/5 border-status-warn/20 text-status-warn"
                    )}>
                      {event.event_type === 'entry' ? 'SECTOR_ENTRY' : 'SECTOR_EXIT'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-text-muted">
                    <Database className="w-3 h-3" />
                    <span className="text-[10px] font-black tracking-widest uppercase">{event.port_name}</span>
                  </div>

                  <div className="flex flex-col items-end">
                    <span className="text-[10px] font-black text-text-primary uppercase">{formatTimeAgo(event.timestamp)}</span>
                    <span className="text-[8px] font-mono font-bold text-text-muted">UTC_LINK_SYNC</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
