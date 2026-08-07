import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { MapPin, FileText, Search, ExternalLink, FolderOpen } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const categoryColors = {
  SID: 'bg-blue-100 text-blue-800',
  STAR: 'bg-purple-100 text-purple-800',
  APP: 'bg-amber-100 text-amber-800',
  GROUND: 'bg-green-100 text-green-800',
  TAXI: 'bg-green-100 text-green-800',
  OTHER: 'bg-slate-100 text-slate-700',
};

export default function AirportChartsTab() {
  const [search, setSearch] = useState('');
  const [selectedAirport, setSelectedAirport] = useState(null);

  const { data: airports = [], isLoading } = useQuery({
    queryKey: ['airports-charts'],
    queryFn: () => base44.entities.Airport.filter({ active: true }),
  });

  // Only show airports that have charts uploaded
  const airportsWithCharts = airports.filter(a => a.charts && a.charts.length > 0);

  const filtered = airportsWithCharts.filter(a => {
    const q = search.toLowerCase();
    return (
      a.icao?.toLowerCase().includes(q) ||
      a.iata?.toLowerCase().includes(q) ||
      a.name?.toLowerCase().includes(q) ||
      a.city?.toLowerCase().includes(q)
    );
  });

  const current = selectedAirport
    ? airportsWithCharts.find(a => a.id === selectedAirport)
    : filtered[0];

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-6 h-6 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (airportsWithCharts.length === 0) {
    return (
      <div className="text-center py-16">
        <FolderOpen className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
        <p className="font-semibold text-foreground">No airport charts uploaded yet</p>
        <p className="text-sm text-muted-foreground mt-1">Admins can upload charts via the Airport Manager in the admin panel.</p>
      </div>
    );
  }

  return (
    <div className="flex gap-4 h-[500px]">
      {/* Left: airport list */}
      <div className="w-56 shrink-0 flex flex-col gap-2">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-8 h-8 text-sm"
            placeholder="Search airports…"
            value={search}
            onChange={e => { setSearch(e.target.value); setSelectedAirport(null); }}
          />
        </div>
        <div className="flex-1 overflow-y-auto space-y-1 pr-1">
          {filtered.map(airport => {
            const isActive = current?.id === airport.id;
            return (
              <button
                key={airport.id}
                onClick={() => setSelectedAirport(airport.id)}
                className={`w-full text-left px-3 py-2.5 rounded-xl border text-sm transition-all ${
                  isActive
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background border-border hover:border-primary/50 hover:bg-muted/40'
                }`}
              >
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 shrink-0 opacity-70" />
                  <span className="font-bold">{airport.icao}</span>
                  {airport.iata && <span className="opacity-60 text-xs">{airport.iata}</span>}
                </div>
                <p className={`text-xs mt-0.5 truncate ${isActive ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                  {airport.name}
                </p>
                <p className={`text-xs mt-0.5 ${isActive ? 'text-primary-foreground/60' : 'text-muted-foreground/60'}`}>
                  {airport.charts?.length || 0} chart{airport.charts?.length !== 1 ? 's' : ''}
                </p>
              </button>
            );
          })}
          {filtered.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-6">No airports found</p>
          )}
        </div>
      </div>

      {/* Right: charts for selected airport */}
      <div className="flex-1 overflow-y-auto">
        {current ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3 pb-2 border-b border-border">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <MapPin className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-heading font-bold text-foreground">
                  {current.icao} {current.iata ? `/ ${current.iata}` : ''}
                </h3>
                <p className="text-sm text-muted-foreground">{current.name}{current.city ? ` — ${current.city}` : ''}</p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-2">
              {current.charts?.map((chart, i) => (
                <a
                  key={i}
                  href={chart.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-xl border border-border hover:border-primary/50 hover:bg-primary/5 transition-all group"
                >
                  <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
                    <FileText className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{chart.name}</p>
                    {chart.category && (
                      <Badge className={`mt-0.5 text-xs ${categoryColors[chart.category?.toUpperCase()] || categoryColors.OTHER}`}>
                        {chart.category}
                      </Badge>
                    )}
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-muted-foreground/50 group-hover:text-primary shrink-0" />
                </a>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <MapPin className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Select an airport to view charts</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
