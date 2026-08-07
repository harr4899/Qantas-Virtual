import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Plane, TrendingUp, Gauge, Clock } from 'lucide-react';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';

export default function PilotFlightStats({ pilotEmail, isAdmin = false }) {
  const { data: reports = [], isLoading } = useQuery({
    queryKey: ['flight-reports-stats', pilotEmail],
    queryFn: () => pilotEmail
      ? base44.entities.PostFlightReport.filter({ pilot_email: pilotEmail }, '-created_date')
      : base44.entities.PostFlightReport.list('-created_date', 200),
    enabled: isAdmin || !!pilotEmail,
  });

  const { data: routes = [] } = useQuery({
    queryKey: ['routes-for-stats'],
    queryFn: () => base44.entities.Route.filter({ active: true }),
  });

  if (isLoading) {
    return <div className="flex items-center justify-center py-12"><div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" /></div>;
  }

  if (reports.length === 0) {
    return (
      <div className="text-center py-12">
        <Plane className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
        <p className="text-muted-foreground text-sm">No flight reports yet.</p>
      </div>
    );
  }

  // Total flight hours: estimate from route distance_nm
  const totalHours = reports.reduce((sum, r) => {
    const route = routes.find(ro => ro.flight_number === r.flight_number);
    const nm = route?.distance_nm || 0;
    // ~480 kts average cruise
    return sum + (nm > 0 ? nm / 480 : 0);
  }, 0);

  const avgLandingFpm = reports.length
    ? Math.round(reports.reduce((s, r) => s + (r.landing_fpm || 0), 0) / reports.length)
    : 0;

  const smoothLandings = reports.filter(r => r.landing_fpm && r.landing_fpm > -200).length;
  const smoothPct = reports.length ? Math.round((smoothLandings / reports.length) * 100) : 0;

  // Monthly flight frequency (last 6 months)
  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const d = subMonths(new Date(), 5 - i);
    const label = format(d, 'MMM');
    const start = startOfMonth(d).toISOString();
    const end = endOfMonth(d).toISOString();
    const count = reports.filter(r => r.created_date >= start && r.created_date <= end).length;
    return { month: label, flights: count };
  });

  // Landing rate distribution
  const fpmBuckets = [
    { label: '< -500', color: '#ef4444', count: reports.filter(r => r.landing_fpm < -500).length },
    { label: '-500 to -300', color: '#f97316', count: reports.filter(r => r.landing_fpm >= -500 && r.landing_fpm < -300).length },
    { label: '-300 to -200', color: '#eab308', count: reports.filter(r => r.landing_fpm >= -300 && r.landing_fpm < -200).length },
    { label: '-200 to -100', color: '#22c55e', count: reports.filter(r => r.landing_fpm >= -200 && r.landing_fpm < -100).length },
    { label: '> -100 (butter)', color: '#6366f1', count: reports.filter(r => r.landing_fpm >= -100).length },
  ];

  const fpmLabel = (v) => {
    if (!v) return '—';
    if (v > -100) return '✨ Butter';
    if (v > -200) return '👍 Great';
    if (v > -300) return '😐 OK';
    if (v > -500) return '😬 Hard';
    return '💥 Very hard';
  };

  return (
    <div className="space-y-6">
      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={<Plane className="w-4 h-4 text-primary" />} label="Total Flights" value={reports.length} />
        <StatCard icon={<Clock className="w-4 h-4 text-blue-500" />} label="Est. Flight Hours" value={totalHours > 0 ? `${totalHours.toFixed(1)}h` : `${reports.length * 2}h`} note="based on route distance" />
        <StatCard icon={<Gauge className="w-4 h-4 text-amber-500" />} label="Avg Landing Rate" value={`${avgLandingFpm} fpm`} note={fpmLabel(avgLandingFpm)} />
        <StatCard icon={<TrendingUp className="w-4 h-4 text-green-500" />} label="Smooth Landings" value={`${smoothPct}%`} note={`${smoothLandings} of ${reports.length}`} />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Monthly frequency */}
        <Card className="p-5">
          <h4 className="font-semibold text-foreground mb-4 text-sm">Flight Frequency (Last 6 Months)</h4>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={monthlyData} barSize={28}>
              <XAxis dataKey="month" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip formatter={(v) => [`${v} flights`, 'Flights']} />
              <Bar dataKey="flights" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Landing rate distribution */}
        <Card className="p-5">
          <h4 className="font-semibold text-foreground mb-4 text-sm">Landing Rate Distribution</h4>
          <div className="space-y-2.5">
            {fpmBuckets.map(b => (
              <div key={b.label} className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground w-32 shrink-0">{b.label}</span>
                <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: reports.length ? `${(b.count / reports.length) * 100}%` : '0%', backgroundColor: b.color }}
                  />
                </div>
                <span className="text-xs font-semibold text-foreground w-6 text-right">{b.count}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Recent reports table */}
      {isAdmin && (
        <Card className="overflow-hidden">
          <div className="p-4 border-b bg-muted/40">
            <h4 className="font-semibold text-foreground text-sm">Recent Reports</h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/30">
                <tr>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pilot</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Flight</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Route</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Landing FPM</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Rating</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody>
                {reports.slice(0, 20).map((r, i) => (
                  <tr key={r.id} className={i % 2 === 0 ? 'bg-background' : 'bg-muted/20'}>
                    <td className="px-4 py-2.5 font-medium text-foreground truncate max-w-[120px]">{r.pilot_name || r.pilot_email}</td>
                    <td className="px-4 py-2.5 text-foreground">{r.flight_number}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{r.origin} → {r.destination}</td>
                    <td className="px-4 py-2.5">
                      <span className={`font-mono font-semibold ${r.landing_fpm > -200 ? 'text-green-600' : r.landing_fpm > -400 ? 'text-amber-600' : 'text-red-600'}`}>
                        {r.landing_fpm} fpm
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="text-amber-500">{'★'.repeat(r.overall_rating || 0)}</span>
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground text-xs">{r.flight_date || r.created_date?.slice(0, 10)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, note }) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{label}</span>
      </div>
      <p className="font-heading text-2xl font-bold text-foreground">{value}</p>
      {note && <p className="text-xs text-muted-foreground mt-0.5">{note}</p>}
    </Card>
  );
}