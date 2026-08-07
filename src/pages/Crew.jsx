import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plane, Users, Trophy, Medal, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import Navbar from '@/components/public/Navbar';
import Footer from '@/components/public/Footer';

const podiumColors = ['text-yellow-500', 'text-slate-400', 'text-amber-600'];

export default function Crew() {
  const { data: roster = [], isLoading } = useQuery({
    queryKey: ['public-crew'],
    queryFn: () => base44.entities.PilotRoster.filter({ active: true }),
  });

  const { data: ranks = [] } = useQuery({
    queryKey: ['public-ranks'],
    queryFn: () => base44.entities.PilotRank.list('order'),
  });

  const rankMap = Object.fromEntries(ranks.map(r => [r.name, r]));

  // Sort by flights completed descending
  const sorted = [...roster].sort((a, b) => (b.flights_completed || 0) - (a.flights_completed || 0));
  const maxFlights = sorted[0]?.flights_completed || 1;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      {/* Header */}
      <div className="bg-sidebar py-16 text-center">
        <span className="inline-block text-xs font-semibold uppercase tracking-widest text-primary mb-3">Our Pilots</span>
        <h1 className="font-heading text-4xl font-bold text-sidebar-foreground mb-3">Meet the Crew</h1>
        <p className="text-sidebar-foreground/60 text-sm max-w-md mx-auto">
          The certified pilots who fly our routes on the VATSIM network.
        </p>
        {!isLoading && sorted.length > 0 && (
          <div className="mt-6 flex items-center justify-center gap-6">
            <div className="text-center">
              <p className="text-2xl font-heading font-bold text-sidebar-foreground">{sorted.length}</p>
              <p className="text-xs text-sidebar-foreground/50 uppercase tracking-wider">Active Pilots</p>
            </div>
            <div className="w-px h-8 bg-sidebar-border" />
            <div className="text-center">
              <p className="text-2xl font-heading font-bold text-sidebar-foreground">
                {sorted.reduce((acc, p) => acc + (p.flights_completed || 0), 0)}
              </p>
              <p className="text-xs text-sidebar-foreground/50 uppercase tracking-wider">Total Flights</p>
            </div>
          </div>
        )}
      </div>

      {/* Top 3 podium */}
      {!isLoading && sorted.length >= 3 && (
        <div className="bg-muted/40 border-b border-border py-8">
          <div className="max-w-3xl mx-auto px-6">
            <div className="flex items-center justify-center gap-2 mb-6">
              <Trophy className="w-5 h-5 text-yellow-500" />
              <h2 className="font-heading font-bold text-foreground">Top Pilots</h2>
            </div>
            <div className="flex items-end justify-center gap-4">
              {[sorted[1], sorted[0], sorted[2]].map((pilot, displayIdx) => {
                const actualIdx = displayIdx === 0 ? 1 : displayIdx === 1 ? 0 : 2;
                const rankObj = rankMap[pilot?.rank_name];
                return pilot ? (
                  <motion.div
                    key={pilot.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: displayIdx * 0.1 }}
                    className={`flex flex-col items-center gap-2 ${displayIdx === 1 ? 'order-1 scale-110' : displayIdx === 0 ? 'order-0' : 'order-2'}`}
                  >
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center font-heading font-bold text-xl text-primary bg-primary/10 border-2 ${
                      actualIdx === 0 ? 'border-yellow-400' : actualIdx === 1 ? 'border-slate-400' : 'border-amber-600'
                    }`}>
                      {(pilot.display_name || pilot.pilot_email)?.[0]?.toUpperCase()}
                    </div>
                    <Medal className={`w-5 h-5 ${podiumColors[actualIdx]}`} />
                    <p className="font-semibold text-sm text-foreground text-center">{pilot.display_name || pilot.pilot_email?.split('@')[0]}</p>
                    {pilot.rank_name && (
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ backgroundColor: (rankObj?.badge_color || '#6b21a8') + '20', color: rankObj?.badge_color || '#6b21a8' }}
                      >
                        {pilot.rank_name}
                      </span>
                    )}
                    <div className={`px-3 py-1 rounded-lg text-center text-xs font-bold ${
                      actualIdx === 0 ? 'bg-yellow-100 text-yellow-800' : actualIdx === 1 ? 'bg-slate-100 text-slate-700' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {pilot.flights_completed || 0} flights
                    </div>
                    {/* Podium bar */}
                    <div className={`w-20 rounded-t-lg flex items-center justify-center text-white font-bold font-heading text-lg ${
                      actualIdx === 0 ? 'bg-yellow-400 h-16' : actualIdx === 1 ? 'bg-slate-400 h-10' : 'bg-amber-500 h-12'
                    }`}>
                      #{actualIdx + 1}
                    </div>
                  </motion.div>
                ) : null;
              })}
            </div>
          </div>
        </div>
      )}

      {/* Full roster grid */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-12">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          </div>
        ) : sorted.length === 0 ? (
          <div className="text-center py-20">
            <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">No pilots on the roster yet.</p>
          </div>
        ) : (
          <>
            <h2 className="font-heading font-bold text-foreground mb-6 flex items-center gap-2">
              <Plane className="w-5 h-5 text-primary" /> All Pilots
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {sorted.map((pilot, i) => {
                const rankObj = rankMap[pilot.rank_name];
                const pct = Math.max(4, Math.round(((pilot.flights_completed || 0) / maxFlights) * 100));
                return (
                  <motion.div
                    key={pilot.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                  >
                    <Card className="p-5 hover:shadow-lg transition-all duration-200 group relative overflow-hidden">
                      {/* Position badge */}
                      {i < 3 && (
                        <div className={`absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center ${
                          i === 0 ? 'bg-yellow-100' : i === 1 ? 'bg-slate-100' : 'bg-amber-100'
                        }`}>
                          <Medal className={`w-4 h-4 ${podiumColors[i]}`} />
                        </div>
                      )}

                      <div className="flex items-start gap-4">
                        {/* Avatar */}
                        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary font-heading shrink-0 group-hover:bg-primary/15 transition-colors">
                          {(pilot.display_name || pilot.pilot_email)?.[0]?.toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-heading font-bold text-foreground truncate">
                            {pilot.display_name || pilot.pilot_email?.split('@')[0]}
                          </h3>
                          {pilot.rank_name && (
                            <span
                              className="inline-block text-xs px-2 py-0.5 rounded font-semibold mt-0.5"
                              style={{ backgroundColor: (rankObj?.badge_color || '#6b21a8') + '20', color: rankObj?.badge_color || '#6b21a8' }}
                            >
                              {pilot.rank_name}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <div className="bg-muted/60 rounded-lg p-2.5 text-center">
                          <p className="text-xl font-heading font-bold text-foreground">{pilot.flights_completed || 0}</p>
                          <p className="text-xs text-muted-foreground">Flights</p>
                        </div>
                        <div className="bg-muted/60 rounded-lg p-2.5 text-center">
                          <p className="text-xl font-heading font-bold text-foreground">#{i + 1}</p>
                          <p className="text-xs text-muted-foreground">Rank</p>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="mt-3">
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                          <span>Flight progress</span>
                          <span>{pct}%</span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all duration-700"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>

                      {pilot.notes && (
                        <p className="text-xs text-muted-foreground mt-3 pt-3 border-t italic">"{pilot.notes}"</p>
                      )}
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}