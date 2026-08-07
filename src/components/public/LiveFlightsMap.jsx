import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { Card } from '@/components/ui/card';
import { Plane, Navigation } from 'lucide-react';

const statusConfig = {
  preflight: { label: 'Pre-flight', badge: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500', line: '#3b82f6' },
  enroute: { label: 'En Route', badge: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500', line: '#10b981' },
  approach: { label: 'Approach', badge: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500', line: '#f59e0b' },
  landed: { label: 'Landed', badge: 'bg-slate-100 text-slate-700', dot: 'bg-slate-500', line: '#64748b' },
};

export default function LiveFlightsMap() {
  const { settings } = useSiteSettings();
  const mapImageUrl = settings.map_image_url || null;

  const { data: flights = [], isLoading } = useQuery({
    queryKey: ['home-live-flights'],
    queryFn: () => base44.entities.LiveFlight.filter({ active: true }),
    refetchInterval: 15000,
  });

  const { data: locations = [] } = useQuery({
    queryKey: ['map-locations-home-live'],
    queryFn: () => base44.entities.MapLocation.filter({ active: true }),
  });

  if (!isLoading && flights.length === 0) return null;

  const findLocation = (code, name) => locations.find(loc =>
    (code && loc.name?.toUpperCase() === code.toUpperCase()) ||
    (code && loc.name?.toUpperCase().includes(code.toUpperCase())) ||
    (code && code.toUpperCase().includes(loc.name?.toUpperCase())) ||
    (name && loc.name?.toUpperCase() === name.toUpperCase())
  );

  const mapFlights = flights.map(f => ({
    ...f,
    originLoc: findLocation(f.origin, f.origin_name),
    destLoc: findLocation(f.destination, f.destination_name),
  })).filter(f => f.originLoc && f.destLoc && mapImageUrl);

  return (
    <section className="py-20 bg-foreground text-background">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/15 mb-4">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-semibold uppercase tracking-widest text-emerald-400">Live Now</span>
          </div>
          <h2 className="font-heading text-4xl font-bold mb-3">Pilots in the Air</h2>
          <p className="text-background/60 max-w-xl mx-auto">Real-time tracking of our pilots currently flying across the network.</p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-background/20 border-t-background rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid lg:grid-cols-[2fr_1fr] gap-6">
            {/* Map */}
            {mapImageUrl && mapFlights.length > 0 ? (
              <div className="relative rounded-2xl overflow-hidden border border-background/10 shadow-2xl" style={{ aspectRatio: '16/9' }}>
                <img src={mapImageUrl} alt="Live Flight Map" className="w-full h-full object-cover opacity-70" />
                <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
                  {mapFlights.map(f => {
                    const cfg = statusConfig[f.status] || statusConfig.enroute;
                    const prog = (f.progress_pct || 0) / 100;
                    const x = f.originLoc.x + (f.destLoc.x - f.originLoc.x) * prog;
                    const y = f.originLoc.y + (f.destLoc.y - f.originLoc.y) * prog;
                    return (
                      <g key={f.id}>
                        <line x1={f.originLoc.x} y1={f.originLoc.y} x2={f.destLoc.x} y2={f.destLoc.y}
                          stroke={cfg.line} strokeWidth="0.4" strokeDasharray="1.5 1" opacity="0.5" />
                        <circle cx={x} cy={y} r="0.8" fill={cfg.line} opacity="0.8" />
                      </g>
                    );
                  })}
                </svg>
                {mapFlights.map(f => {
                  const cfg = statusConfig[f.status] || statusConfig.enroute;
                  const prog = (f.progress_pct || 0) / 100;
                  const x = f.originLoc.x + (f.destLoc.x - f.originLoc.x) * prog;
                  const y = f.originLoc.y + (f.destLoc.y - f.originLoc.y) * prog;
                  return (
                    <div key={f.id} className="absolute -translate-x-1/2 -translate-y-1/2 group" style={{ left: `${x}%`, top: `${y}%` }}>
                      <div className={`w-7 h-7 rounded-full ${cfg.dot} flex items-center justify-center shadow-lg ring-2 ring-white/30 transition-transform group-hover:scale-125`}>
                        <Plane className="w-3.5 h-3.5 text-white" />
                      </div>
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-10 whitespace-nowrap">
                        <div className="bg-background text-foreground text-xs rounded-lg px-2.5 py-1 shadow-xl">
                          {f.pilot_name || f.pilot_email} · {f.flight_number}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-2xl border-2 border-dashed border-background/15 bg-background/5 flex items-center justify-center min-h-[300px]">
                <div className="text-center">
                  <Navigation className="w-10 h-10 mx-auto mb-2 text-background/30" />
                  <p className="text-sm text-background/50">{mapImageUrl ? 'No flights to plot on map right now' : 'No map configured — showing flight list only'}</p>
                </div>
              </div>
            )}

            {/* Flight list */}
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {flights.map(f => {
                const cfg = statusConfig[f.status] || statusConfig.enroute;
                return (
                  <Card key={f.id} className="p-4 bg-background/5 border-background/10 text-background">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-sm text-background">{f.pilot_name || f.pilot_email}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.badge}`}>{cfg.label}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-background/80">
                      <span className="font-bold">{f.origin}</span>
                      <Plane className="w-3 h-3 text-background/40" />
                      <span className="font-bold">{f.destination}</span>
                    </div>
                    <div className="mt-2">
                      <div className="flex justify-between text-xs text-background/40 mb-1">
                        <span>{f.flight_number}{f.aircraft ? ` · ${f.aircraft}` : ''}</span>
                        <span>{f.progress_pct || 0}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-background/10 overflow-hidden">
                        <div className={`h-full rounded-full ${cfg.dot} transition-all`} style={{ width: `${f.progress_pct || 0}%` }} />
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}