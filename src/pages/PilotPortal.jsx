import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Plane, Calendar as CalendarIcon, Bell, AlertTriangle,
  LogOut, CheckCircle, Globe, Navigation, FileText,
  Radio, CalendarDays, TrendingUp, Map
} from 'lucide-react';
import { Link } from 'react-router-dom';
import RoutesTab from '@/components/pilot/RoutesTab';
import LiveFlightACARSTab from '@/components/pilot/LiveFlightACARSTab';
import PilotFlightStats from '@/components/pilot/PilotFlightStats';
import PilotBadgesDisplay from '@/components/pilot/PilotBadgesDisplay';
import PilotEventsTab from '@/components/pilot/PilotEventsTab';
import PilotLeaderboard from '@/components/pilot/PilotLeaderboard';
import PostFlightReportDialog from '@/components/pilot/PostFlightReportDialog';
import AirportChartsTab from '@/components/pilot/AirportChartsTab';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { useSiteSettings } from '@/hooks/useSiteSettings';

const CONFIG_KEY = 'pilot_operations_config';

export default function PilotPortal() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [pilotRank, setPilotRank] = useState(null);
  const [pilotRankOrder, setPilotRankOrder] = useState(0);
  const [postFlightBooking, setPostFlightBooking] = useState(null);

  useEffect(() => {
    async function check() {
      const isAuth = await base44.auth.isAuthenticated();
      if (!isAuth) { window.location.href = '/pilot-login'; return; }
      const u = await base44.auth.me();
      setUser(u);

      const approvedList = await base44.entities.ApprovedPilot.filter({ email: u.email, status: 'active' });
      if (approvedList.length > 0 && approvedList[0].fast_pass) {
        setHasAccess(true);
        await loadRank(u.email);
        setChecking(false);
        return;
      }

      const progress = await base44.entities.PilotProgress.filter({ pilot_email: u.email, type: 'final_exam', passed: true });
      if (progress.length === 0) {
        const approved = await base44.entities.ApprovedPilot.filter({ email: u.email, status: 'active' });
        if (approved.length === 0) { window.location.href = '/pilot-login'; return; }
        window.location.href = '/training';
        return;
      }

      setHasAccess(true);
      await loadRank(u.email);
      setChecking(false);
    }

    async function loadRank(email) {
      const rosterEntry = await base44.entities.PilotRoster.filter({ pilot_email: email, active: true });
      if (rosterEntry.length > 0 && rosterEntry[0].rank_name) {
        setPilotRank(rosterEntry[0].rank_name);
        const ranks = await base44.entities.PilotRank.list('order');
        const rankObj = ranks.find(r => r.name === rosterEntry[0].rank_name);
        if (rankObj) setPilotRankOrder(rankObj.order ?? 0);
      }
    }

    check();
  }, []);

  const { data: routes = [] } = useQuery({
    queryKey: ['pilot-routes'],
    queryFn: () => base44.entities.Route.filter({ active: true }),
    enabled: hasAccess,
  });

  const { data: airports = [] } = useQuery({
    queryKey: ['pilot-airports'],
    queryFn: () => base44.entities.Airport.filter({ active: true }),
    enabled: hasAccess,
  });

  const { data: ranks = [] } = useQuery({
    queryKey: ['pilot-ranks-list'],
    queryFn: () => base44.entities.PilotRank.list('order'),
    enabled: hasAccess,
  });

  const { data: opsSettingsRaw = [] } = useQuery({
    queryKey: ['pilot-ops-settings'],
    queryFn: () => base44.entities.SiteSettings.filter({ key: CONFIG_KEY }),
    enabled: hasAccess,
  });

  const opsConfig = useMemo(() => {
    if (opsSettingsRaw.length === 0) return {};
    try { return JSON.parse(opsSettingsRaw[0].value || '{}'); } catch { return {}; }
  }, [opsSettingsRaw]);

  const { data: notams = [] } = useQuery({
    queryKey: ['pilot-notams'],
    queryFn: () => base44.entities.NOTAM.filter({ active: true }, '-created_date'),
    enabled: hasAccess,
  });

  const { data: myBookings = [] } = useQuery({
    queryKey: ['my-bookings'],
    queryFn: () => base44.entities.FlightBooking.filter({ pilot_email: user?.email }, '-scheduled_date'),
    enabled: !!user && hasAccess,
  });

  const cancelMutation = useMutation({
    mutationFn: (id) => base44.entities.FlightBooking.update(id, { status: 'cancelled' }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['my-bookings'] }); toast.success('Booking cancelled'); },
  });

  const handleFlightCompleted = () => {
    queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
    setPostFlightBooking(null);
  };

  const { settings } = useSiteSettings();
  const activeBookings = myBookings.filter(b => b.status === 'booked');
  const completedBookings = myBookings.filter(b => b.status === 'completed');

  const nextRequiredOrigin = useMemo(() => {
    if (!opsConfig.enforce_progressive_routing) return null;
    const relevant = myBookings
      .filter(b => b.status === 'booked' || b.status === 'completed')
      .sort((a, b) => {
        const dateDiff = (b.scheduled_date || '').localeCompare(a.scheduled_date || '');
        if (dateDiff !== 0) return dateDiff;
        return (b.created_date || '').localeCompare(a.created_date || '');
      });
    return relevant.length > 0 ? relevant[0].destination : null;
  }, [myBookings, opsConfig.enforce_progressive_routing]);

  const hasAnyActiveBooking = myBookings.some(b => b.status === 'booked' || b.status === 'completed');

  const priorityColors = {
    low: 'bg-blue-50 text-blue-800 border-blue-200',
    medium: 'bg-amber-50 text-amber-800 border-amber-200',
    high: 'bg-orange-50 text-orange-800 border-orange-200',
    critical: 'bg-red-50 text-red-800 border-red-200',
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/20">
      {/* Header */}
      <header className="bg-sidebar text-sidebar-foreground border-b border-sidebar-border sticky top-0 z-50">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
            {settings.site_logo ? (
              <img src={settings.site_logo} alt="Logo" className="h-8 w-auto object-contain" />
            ) : (
              <>
                <div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center">
                  <Plane className="w-4 h-4 text-sidebar-primary-foreground" />
                </div>
                <span className="font-heading text-sm font-bold text-sidebar-foreground">Pilot Portal</span>
              </>
            )}
          </Link>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-sidebar-foreground leading-tight">{user?.full_name || user?.email}</p>
              <p className="text-xs text-sidebar-foreground/60">{pilotRank || 'Certified Pilot'}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={() => base44.auth.logout('/pilot-login')} className="text-sidebar-foreground/70 hover:text-sidebar-foreground h-8 w-8">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-6">
        {/* Welcome Banner */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-primary to-primary/75 rounded-2xl px-6 py-5 mb-6 text-white relative overflow-hidden"
        >
          <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-[0.07]">
            <Plane className="w-36 h-36" />
          </div>
          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="text-white/70 text-xs uppercase tracking-widest mb-0.5">Welcome back</p>
              <h1 className="font-heading text-xl font-bold text-white">{user?.full_name || 'Pilot'}</h1>
              {pilotRank && <p className="text-white/70 text-sm mt-0.5">{pilotRank}</p>}
            </div>
            <div className="flex items-center gap-5">
              <div className="text-center">
                <p className="text-2xl font-heading font-bold text-white">{completedBookings.length}</p>
                <p className="text-white/60 text-xs">Flights Done</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-heading font-bold text-white">{activeBookings.length}</p>
                <p className="text-white/60 text-xs">Upcoming</p>
              </div>
            </div>
          </div>
          {(opsConfig.enforce_hub_start || opsConfig.enforce_progressive_routing) && (
            <div className="mt-3 flex items-center gap-2 text-xs bg-white/15 rounded-lg px-3 py-1.5 w-fit">
              <Navigation className="w-3.5 h-3.5 text-white" />
              {!hasAnyActiveBooking && opsConfig.enforce_hub_start
                ? <span className="text-white">First flight must depart from <strong>{opsConfig.hub_icao || 'hub'}</strong></span>
                : nextRequiredOrigin && opsConfig.enforce_progressive_routing
                ? <span className="text-white">Next departure: <strong>{nextRequiredOrigin}</strong></span>
                : <span className="text-white">Progressive routing active</span>
              }
            </div>
          )}
        </motion.div>

        <div className="grid lg:grid-cols-[1fr_300px] gap-6">
          {/* Main content */}
          <div>
            <Tabs defaultValue="routes" className="w-full">
              {/* Tab bar */}
              <div className="bg-card border border-border rounded-xl mb-1 overflow-hidden">
                <div className="px-4 pt-3 pb-0 border-b border-border overflow-x-auto">
                  <TabsList className="bg-transparent h-auto p-0 gap-0 flex w-max min-w-full">
                    {[
                      { value: 'routes', icon: Globe, label: 'Routes' },
                      { value: 'bookings', icon: CalendarIcon, label: 'My Bookings' },
                      { value: 'loadsheet', icon: FileText, label: 'Load Sheet' },
                      { value: 'acars', icon: Radio, label: 'Live Tracker' },
                      { value: 'charts', icon: Map, label: 'Charts' },
                      { value: 'mystats', icon: TrendingUp, label: 'My Stats' },
                      { value: 'events', icon: CalendarDays, label: 'Events' },
                    ].map(({ value, icon: Icon, label }) => (
                      <TabsTrigger
                        key={value}
                        value={value}
                        className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-muted-foreground rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent bg-transparent whitespace-nowrap"
                      >
                        <Icon className="w-3.5 h-3.5" />
                        {label}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </div>

                {/* ── ROUTES ── */}
                <TabsContent value="routes" className="p-5 mt-0">
                  <RoutesTab
                    routes={routes}
                    airports={airports}
                    ranks={ranks}
                    opsConfig={opsConfig}
                    myBookings={myBookings}
                    user={user}
                    pilotRankOrder={pilotRankOrder}
                    nextRequiredOrigin={nextRequiredOrigin}
                    hasAnyActiveBooking={hasAnyActiveBooking}
                  />
                </TabsContent>

                {/* ── BOOKINGS ── */}
                <TabsContent value="bookings" className="p-5 mt-0 space-y-4">
                  {activeBookings.length === 0 && completedBookings.length === 0 ? (
                    <div className="text-center py-12">
                      <CalendarIcon className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
                      <p className="text-muted-foreground text-sm">No bookings yet.</p>
                    </div>
                  ) : (
                    <>
                      {activeBookings.length > 0 && (
                        <div>
                          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Upcoming</h4>
                          <div className="space-y-2">
                            {activeBookings.map(booking => (
                              <div key={booking.id} className="flex items-center justify-between p-4 rounded-xl border border-primary/20 bg-primary/5">
                                <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
                                    <Plane className="w-4 h-4 text-primary" />
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="font-semibold text-foreground text-sm">{booking.flight_number}</span>
                                      <span className="text-xs text-muted-foreground">{booking.origin} → {booking.destination}</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                      {format(new Date(booking.scheduled_date), 'EEE, d MMM yyyy')}
                                      {booking.departure_time && ` · ${booking.departure_time}Z`}
                                      {booking.gate && ` · Gate ${booking.gate}`}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex gap-2 shrink-0">
                                  <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white text-xs h-8" onClick={() => setPostFlightBooking(booking)}>
                                    Complete
                                  </Button>
                                  <Button variant="outline" size="sm" className="text-xs h-8" onClick={() => cancelMutation.mutate(booking.id)}>
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {completedBookings.length > 0 && (
                        <div>
                          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Completed</h4>
                          <div className="space-y-1">
                            {completedBookings.slice(0, 15).map(booking => (
                              <div key={booking.id} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted/30 transition-colors">
                                <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                                <span className="text-sm text-foreground flex-1">{booking.flight_number} · {booking.origin} → {booking.destination}</span>
                                <span className="text-xs text-muted-foreground">{format(new Date(booking.scheduled_date), 'MMM d, yyyy')}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </TabsContent>

                {/* ── LOAD SHEET ── */}
                <TabsContent value="loadsheet" className="p-5 mt-0">
                  {activeBookings.length === 0 ? (
                    <div className="text-center py-12">
                      <FileText className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
                      <p className="text-muted-foreground text-sm">No upcoming bookings. Book a flight first.</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {activeBookings.map(booking => (
                        <LoadSheet key={booking.id} booking={booking} routes={routes} />
                      ))}
                    </div>
                  )}
                </TabsContent>

                {/* ── LIVE TRACKER ── */}
                <TabsContent value="acars" className="p-5 mt-0">
                  <LiveFlightACARSTab user={user} />
                </TabsContent>

                {/* ── CHARTS ── */}
                <TabsContent value="charts" className="p-5 mt-0">
                  <AirportChartsTab />
                </TabsContent>

                {/* ── MY STATS ── */}
                <TabsContent value="mystats" className="p-5 mt-0">
                  <PilotFlightStats pilotEmail={user?.email} />
                </TabsContent>

                {/* ── EVENTS ── */}
                <TabsContent value="events" className="p-5 mt-0">
                  <PilotEventsTab user={user} />
                </TabsContent>
              </div>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* NOTAMs */}
            {notams.length > 0 && (
              <Card className="overflow-hidden">
                <div className="px-4 py-3 border-b bg-muted/30 flex items-center gap-2">
                  <Bell className="w-3.5 h-3.5 text-primary" />
                  <h3 className="font-semibold text-foreground text-sm">NOTAMs</h3>
                  <Badge className="ml-auto text-xs" variant="outline">{notams.length}</Badge>
                </div>
                <div className="p-3 space-y-2 max-h-64 overflow-y-auto">
                  {notams.map(notam => (
                    <div key={notam.id} className={`p-2.5 rounded-lg border text-xs ${priorityColors[notam.priority]}`}>
                      <div className="flex items-start gap-1.5">
                        {(notam.priority === 'critical' || notam.priority === 'high')
                          ? <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                          : <Bell className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        }
                        <div>
                          <p className="font-semibold">{notam.title}</p>
                          <p className="mt-0.5 opacity-80">{notam.content}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Quick stats */}
            <Card className="p-4">
              <h3 className="font-semibold text-foreground text-sm mb-3">Quick Stats</h3>
              <div className="space-y-2.5">
                {[
                  { label: 'Completed Flights', value: completedBookings.length },
                  { label: 'Upcoming Flights', value: activeBookings.length },
                  { label: 'Available Routes', value: routes.length },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">{label}</span>
                    <span className="text-sm font-semibold text-foreground">{value}</span>
                  </div>
                ))}
                {pilotRank && (
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="text-xs text-muted-foreground">Rank</span>
                    <Badge variant="outline" className="text-xs text-foreground">{pilotRank}</Badge>
                  </div>
                )}
              </div>
            </Card>

            {/* Badges */}
            {user && <PilotBadgesDisplay pilotEmail={user.email} />}

            {/* Leaderboard */}
            <Card className="p-4">
              <PilotLeaderboard currentUserEmail={user?.email} />
            </Card>
          </div>
        </div>
      </div>

      {/* Post-Flight Report Dialog */}
      {postFlightBooking && (
        <PostFlightReportDialog
          open={!!postFlightBooking}
          booking={postFlightBooking}
          user={user}
          onComplete={handleFlightCompleted}
          onCancel={() => setPostFlightBooking(null)}
        />
      )}

    </div>
  );
}

function LoadSheet({ booking, routes }) {
  const route = routes.find(r => r.id === booking.route_id);
  const [pax, setPax] = useState(150);
  const [cargo, setCargo] = useState(5000);
  const [fuel, setFuel] = useState(40000);
  const [zfw, setZfw] = useState(180000);

  const { data: publicPassengers = [] } = useQuery({
    queryKey: ['public-passengers', booking.route_id, booking.scheduled_date],
    queryFn: () => base44.entities.PublicBooking.filter({ route_id: booking.route_id, travel_date: booking.scheduled_date }),
  });

  const confirmedPax = publicPassengers.filter(p => p.status !== 'cancelled');
  const tow = zfw + fuel;
  const lw = tow - Math.round(fuel * 0.7);

  return (
    <div className="border border-border rounded-2xl overflow-hidden">
      <div className="bg-sidebar text-sidebar-foreground px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Plane className="w-4 h-4 text-primary" />
          <div>
            <p className="font-heading font-bold text-sidebar-foreground text-sm">{booking.flight_number}</p>
            <p className="text-xs text-sidebar-foreground/60">{booking.origin} → {booking.destination}</p>
          </div>
        </div>
        <div className="text-right text-xs">
          <p className="font-medium text-sidebar-foreground">{format(new Date(booking.scheduled_date), 'EEE, d MMM yyyy')}</p>
          {booking.departure_time && <p className="text-sidebar-foreground/60">ETD {booking.departure_time}Z</p>}
        </div>
      </div>

      <div className="bg-muted/30 px-5 py-3 grid grid-cols-4 gap-3 text-xs border-b border-border">
        {[
          { label: 'Aircraft', value: booking.aircraft || route?.aircraft || '—' },
          { label: 'Flight Level', value: route?.flight_level || '—' },
          { label: 'Distance', value: route?.distance_nm ? `${route.distance_nm} NM` : '—' },
          { label: 'Booked PAX', value: confirmedPax.length },
        ].map(({ label, value }) => (
          <div key={label}>
            <p className="text-muted-foreground uppercase tracking-wider mb-0.5">{label}</p>
            <p className="font-semibold text-foreground">{value}</p>
          </div>
        ))}
      </div>

      <div className="px-5 py-5 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Passengers', value: pax, set: setPax },
            { label: 'Cargo (kg)', value: cargo, set: setCargo },
            { label: 'Block Fuel (kg)', value: fuel, set: setFuel },
            { label: 'Zero Fuel Wt (kg)', value: zfw, set: setZfw },
          ].map(({ label, value, set }) => (
            <div key={label} className="space-y-1">
              <label className="text-xs text-muted-foreground">{label}</label>
              <Input type="number" value={value} onChange={e => set(Number(e.target.value))} className="font-mono text-foreground h-8 text-sm" />
            </div>
          ))}
        </div>

        <div className="bg-muted/40 rounded-xl p-4 grid grid-cols-2 gap-4 border border-border">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Takeoff Weight</p>
            <p className="text-lg font-heading font-bold text-foreground">{tow.toLocaleString()} kg</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Est. Landing Weight</p>
            <p className="text-lg font-heading font-bold text-foreground">{lw.toLocaleString()} kg</p>
          </div>
        </div>

        {route?.notes && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
            <p className="text-xs font-semibold text-amber-800 uppercase tracking-wider mb-1">Route Notes</p>
            <p className="text-sm text-amber-900">{route.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}