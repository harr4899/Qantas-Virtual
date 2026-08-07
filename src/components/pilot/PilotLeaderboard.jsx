import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Plane, Medal } from 'lucide-react';

const medalColors = ['text-yellow-500', 'text-slate-400', 'text-amber-600'];
const medalBg = ['bg-yellow-50 border-yellow-200', 'bg-slate-50 border-slate-200', 'bg-amber-50 border-amber-200'];

export default function PilotLeaderboard({ currentUserEmail }) {
  const { data: roster = [] } = useQuery({
    queryKey: ['leaderboard-roster'],
    queryFn: () => base44.entities.PilotRoster.filter({ active: true }),
  });

  const { data: ranks = [] } = useQuery({
    queryKey: ['leaderboard-ranks'],
    queryFn: () => base44.entities.PilotRank.list('order'),
  });

  const rankMap = Object.fromEntries(ranks.map(r => [r.name, r]));

  const sorted = [...roster]
    .sort((a, b) => (b.flights_completed || 0) - (a.flights_completed || 0))
    .slice(0, 10);

  const maxFlights = sorted[0]?.flights_completed || 1;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Trophy className="w-5 h-5 text-yellow-500" />
        <h3 className="font-heading font-bold text-foreground">Pilot Leaderboard</h3>
      </div>

      {sorted.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-sm">
          <Plane className="w-8 h-8 mx-auto mb-2 opacity-30" />
          No pilot data yet.
        </div>
      ) : (
        <div className="space-y-2">
          {sorted.map((pilot, i) => {
            const isMe = pilot.pilot_email === currentUserEmail;
            const rankObj = rankMap[pilot.rank_name];
            const pct = Math.max(4, Math.round(((pilot.flights_completed || 0) / maxFlights) * 100));
            return (
              <div
                key={pilot.id}
                className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                  isMe ? 'border-primary bg-primary/5' : i < 3 ? medalBg[i] : 'border-border bg-background'
                }`}
              >
                {/* Rank number */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
                  i < 3 ? `${medalColors[i]} bg-white border` : 'text-muted-foreground bg-muted'
                }`}>
                  {i < 3 ? <Medal className="w-4 h-4" /> : i + 1}
                </div>

                {/* Avatar */}
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-sm text-primary shrink-0">
                  {(pilot.display_name || pilot.pilot_email)?.[0]?.toUpperCase()}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`font-semibold text-sm ${isMe ? 'text-primary' : 'text-foreground'}`}>
                      {pilot.display_name || pilot.pilot_email}
                      {isMe && <span className="ml-1 text-xs text-primary/70">(you)</span>}
                    </span>
                    {pilot.rank_name && (
                      <span
                        className="text-xs px-1.5 py-0.5 rounded font-medium"
                        style={{ backgroundColor: (rankObj?.badge_color || '#6b21a8') + '20', color: rankObj?.badge_color || '#6b21a8' }}
                      >
                        {pilot.rank_name}
                      </span>
                    )}
                  </div>
                  {/* Progress bar */}
                  <div className="mt-1.5 h-1 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                {/* Flight count */}
                <div className="text-right shrink-0">
                  <div className="flex items-center gap-1 text-sm font-bold text-foreground">
                    <Plane className="w-3.5 h-3.5 text-primary" />
                    {pilot.flights_completed || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">flights</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}