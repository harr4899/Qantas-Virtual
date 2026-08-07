import React, { useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plane, Radio, ArrowRight, Clock, Gauge, Navigation } from 'lucide-react';
import { motion } from 'framer-motion';
import Navbar from '@/components/public/Navbar';
import Footer from '@/components/public/Footer';

const LIVE_CONFIG_KEY = 'live_tracking_config';

const statusColors = {
  preflight: 'bg-slate-100 text-slate-700 border-slate-200',
  enroute: 'bg-blue-100 text-blue-800 border-blue-200',
  approach: 'bg-amber-100 text-amber-800 border-amber-200',
  landed: 'bg-green-100 text-green-800 border-green-200',
};

const statusIcons = { preflight: '🅿️', enroute: '✈️', approach: '🛬', landed: '✅' };

export default function PublicLive() {
  const { data: flights = [], isLoading } = useQuery({
    queryKey: ['public-live-flights'],
    queryFn: () => base44.entities.LiveFlight.list('-created_date', 50),
    refetchInterval: 30000,
  });

  const { data: configRows = [] } = useQuery({
    queryKey: ['live-config-public'],
    queryFn: () => base44.entities.SiteSettings.filter({ key: LIVE_CONFIG_KEY }),
  });

  const config = useMemo(() => {
    if (!configRows.length) return { title: 'Live Flight Tracker', subtitle: "See who's flying right now" };
    try { return JSON.parse(configRows[0].value || '{}'); } catch { return {}; }
  }, [configRows]);

  const activeFlights = flights.filter(f => f.active === true && f.status !== 'landed');
  const landedFlights = flights.filter(f => f.status === 'landed');

  if (!isLoading && config.public_enabled === false) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Radio className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">Live tracking is not available right now.</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      {/* Header */}
      <div className="bg-sidebar py-14 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-4 left-8 text-6xl">✈️</div>
          <div className="absolute bottom-4 right-8 text-4xl">🌏</div>
        </div>
        <div className="relative">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-xs font-semibold uppercase tracking-widest text-green-400">Live</span>
          </div>
          <h1 className="font-heading text-4xl font-bold text-sidebar-foreground mb-2">{config.title || 'Live Flight Tracker'}</h1>
          <p className="text-sidebar-foreground/60 text-sm">{config.subtitle || "See who's flying right now"}</p>
          {activeFlights.length > 0 && (
            <div className="mt-4 inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 text-sm text-sidebar-foreground">
              <Plane className="w-4 h-4 text-primary" />
              <span>{activeFlights.length} aircraft in the air</span>
            </div>
          )}
        </div>
      </div>

      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-12">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          </div>
        ) : activeFlights.length === 0 && landedFlights.length === 0 ? (
          <div className="text-center py-20">
            <Radio className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground font-medium">No flights currently active</p>
            <p className="text-sm text-muted-foreground mt-1">Check back soon when pilots are flying!</p>
          </div>
        ) : (
          <div className="space-y-8">
            {activeFlights.length > 0 && (
              <div>
                <h2 className="font-heading font-bold text-foreground mb-4 flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  Currently Airborne
                </h2>
                <div className="space-y-4">
                  {activeFlights.map((flight, i) => (
                    <motion.div key={flight.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                      <Card className="overflow-hidden border-l-4 border-l-primary">
                        {/* Top bar */}
                        <div className="bg-sidebar px-6 py-4 flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                              <Plane className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-heading font-bold text-white text-lg">{flight.flight_number}</span>
                                <Badge className={`text-xs ${statusColors[flight.status]}`}>{flight.status}</Badge>
                              </div>
                              <p className="text-white/60 text-xs">{flight.pilot_name || flight.pilot_email}</p>
                            </div>
                          </div>
                          <div className="text-right text-sm text-white/70">
                            {flight.aircraft && <p className="font-semibold text-white">{flight.aircraft}</p>}
                            {flight.departure_time && <p className="text-xs">ETD {flight.departure_time}Z</p>}
                            {flight.eta && <p className="text-xs">ETA {flight.eta}Z</p>}
                          </div>
                        </div>

                        {/* Route + progress */}
                        <div className="px-6 py-5">
                          <div className="flex items-center justify-between mb-4">
                            <div className="text-center">
                              <p className="font-heading text-2xl font-bold text-foreground">{flight.origin}</p>
                              {flight.origin_name && <p className="text-xs text-muted-foreground max-w-[100px] text-center">{flight.origin_name}</p>}
                            </div>
                            <div className="flex-1 px-4">
                              <div className="relative flex items-center">
                                <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-primary rounded-full transition-all duration-500"
                                    style={{ width: `${flight.progress_pct || 0}%` }}
                                  />
                                </div>
                                <Plane
                                  className="w-5 h-5 text-primary absolute -translate-y-1/2 top-1/2"
                                  style={{ left: `calc(${flight.progress_pct || 0}% - 10px)` }}
                                />
                              </div>
                              <p className="text-center text-xs text-muted-foreground mt-2">{flight.progress_pct || 0}% complete</p>
                            </div>
                            <div className="text-center">
                              <p className="font-heading text-2xl font-bold text-foreground">{flight.destination}</p>
                              {flight.destination_name && <p className="text-xs text-muted-foreground max-w-[100px] text-center">{flight.destination_name}</p>}
                            </div>
                          </div>

                          {/* Stats row */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {flight.altitude && (
                              <div className="bg-muted/50 rounded-lg px-3 py-2">
                                <p className="text-xs text-muted-foreground">Altitude</p>
                                <p className="font-semibold text-sm text-foreground">{flight.altitude}</p>
                              </div>
                            )}
                            {flight.speed && (
                              <div className="bg-muted/50 rounded-lg px-3 py-2">
                                <p className="text-xs text-muted-foreground">Speed</p>
                                <p className="font-semibold text-sm text-foreground">{flight.speed}</p>
                              </div>
                            )}
                            {flight.departure_time && (
                              <div className="bg-muted/50 rounded-lg px-3 py-2">
                                <p className="text-xs text-muted-foreground">Departed</p>
                                <p className="font-semibold text-sm text-foreground">{flight.departure_time}Z</p>
                              </div>
                            )}
                            {flight.eta && (
                              <div className="bg-muted/50 rounded-lg px-3 py-2">
                                <p className="text-xs text-muted-foreground">Arriving</p>
                                <p className="font-semibold text-sm text-foreground">{flight.eta}Z</p>
                              </div>
                            )}
                          </div>

                          {flight.remarks && (
                            <p className="text-xs text-muted-foreground mt-3 italic">"{flight.remarks}"</p>
                          )}
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {landedFlights.length > 0 && (
              <div>
                <h2 className="font-heading font-bold text-foreground mb-4 flex items-center gap-2 text-muted-foreground">
                  Recently Landed
                </h2>
                <div className="grid sm:grid-cols-2 gap-3">
                  {landedFlights.map(flight => (
                    <Card key={flight.id} className="p-4 opacity-70 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
                        <Plane className="w-4 h-4 text-green-700" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground text-sm">{flight.flight_number}</span>
                          <span className="text-xs text-muted-foreground">{flight.origin} → {flight.destination}</span>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{flight.pilot_name || flight.pilot_email}</p>
                      </div>
                      <Badge className="bg-green-100 text-green-800 border-green-200 text-xs shrink-0">Landed</Badge>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}