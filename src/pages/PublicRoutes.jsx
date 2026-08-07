import React, { useState, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import Navbar from '../components/public/Navbar';
import Footer from '../components/public/Footer';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plane, ArrowRight, CheckCircle, Search, Calendar, XCircle, RefreshCw, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function PublicRoutes() {
  const { settings } = useSiteSettings();
  const routesBadge = settings.routes_badge || 'Our Network';
  const routesHeading = settings.routes_heading || 'Flight Routes';
  const routesSubtext = settings.routes_subtext || 'Search our route network and book a flight with our pilots.';
  const routesBgColor = settings.routes_bg_color || '';
  const routesHeadingColor = settings.routes_heading_color || '';

  const [departure, setDeparture] = useState('');
  const [arrival, setArrival] = useState('');
  const [manageMode, setManageMode] = useState(false);
  const [manageEmail, setManageEmail] = useState('');
  const [managedBookings, setManagedBookings] = useState(null);
  const [loadingManage, setLoadingManage] = useState(false);
  const [bookingTarget, setBookingTarget] = useState(null);
  const [customDate, setCustomDate] = useState('');
  const [submitted, setSubmitted] = useState(null);
  const [form, setForm] = useState({ passenger_name: '', passenger_email: '', notes: '' });

  const today = new Date().toISOString().split('T')[0];

  const { data: routes = [] } = useQuery({
    queryKey: ['public-routes'],
    queryFn: () => base44.entities.Route.filter({ active: true }),
  });

  const { data: pilotBookings = [] } = useQuery({
    queryKey: ['pilot-bookings-public'],
    queryFn: () => base44.entities.FlightBooking.filter({ status: 'booked' }),
  });

  // Group routes into origin→destination pairs
  const routeGroups = useMemo(() => {
    const groups = {};
    for (const route of routes) {
      const key = `${(route.origin || '').toUpperCase()}-${(route.destination || '').toUpperCase()}`;
      if (!groups[key]) {
        groups[key] = {
          key,
          origin: route.origin,
          destination: route.destination,
          origin_name: route.origin_name,
          destination_name: route.destination_name,
          distance_nm: route.distance_nm,
          aircraftTypes: new Set(),
          routes: [],
        };
      }
      if (route.aircraft) groups[key].aircraftTypes.add(route.aircraft);
      groups[key].routes.push(route);
    }
    return Object.values(groups).map(g => ({ ...g, aircraftTypes: Array.from(g.aircraftTypes) }));
  }, [routes]);

  const filteredGroups = useMemo(() => {
    const dep = departure.trim().toUpperCase();
    const arr = arrival.trim().toUpperCase();
    if (!dep && !arr) return routeGroups;
    return routeGroups.filter(g => {
      const matchDep = !dep || g.origin?.toUpperCase() === dep || g.origin_name?.toUpperCase().includes(dep);
      const matchArr = !arr || g.destination?.toUpperCase() === arr || g.destination_name?.toUpperCase().includes(arr);
      return matchDep && matchArr;
    });
  }, [routeGroups, departure, arrival]);

  const getGroupBookings = (group) => {
    const routeIds = group.routes.map(r => r.id);
    return pilotBookings
      .filter(b => routeIds.includes(b.route_id) && b.scheduled_date >= today)
      .sort((a, b) => (a.scheduled_date || '').localeCompare(b.scheduled_date || ''));
  };

  const bookMutation = useMutation({
    mutationFn: (data) => base44.entities.PublicBooking.create(data),
    onSuccess: () => {
      toast.success('Booking submitted!');
      setSubmitted({
        route: bookingTarget.route,
        date: bookingTarget.booking ? bookingTarget.booking.scheduled_date : customDate,
        passenger_name: form.passenger_name,
      });
      setBookingTarget(null);
      setForm({ passenger_name: '', passenger_email: '', notes: '' });
      setCustomDate('');
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (id) => base44.entities.PublicBooking.update(id, { status: 'cancelled' }),
    onSuccess: async () => {
      toast.success('Booking cancelled');
      if (manageEmail) {
        const updated = await base44.entities.PublicBooking.filter({ passenger_email: manageEmail });
        setManagedBookings(updated);
      }
    },
  });

  const handleManageLookup = async (e) => {
    e.preventDefault();
    if (!manageEmail.trim()) return;
    setLoadingManage(true);
    const bookings = await base44.entities.PublicBooking.filter({ passenger_email: manageEmail.trim() });
    setManagedBookings(bookings.sort((a, b) => (b.created_date || '').localeCompare(a.created_date || '')));
    setLoadingManage(false);
  };

  const handleRebook = (booking) => {
    setManageMode(false);
    setManagedBookings(null);
    setDeparture(booking.origin || '');
    setArrival(booking.destination || '');
    setForm(f => ({ ...f, passenger_name: booking.passenger_name || '', passenger_email: booking.passenger_email || '' }));
    toast.info('Search updated with your original route. Find a flight below.');
  };

  const handleConfirmBooking = (e) => {
    e.preventDefault();
    if (!form.passenger_name || !form.passenger_email) {
      toast.error('Please fill in your name and email.');
      return;
    }
    if (!bookingTarget.booking && !customDate) {
      toast.error('Please choose a travel date.');
      return;
    }
    const { route, booking } = bookingTarget;
    bookMutation.mutate({
      passenger_name: form.passenger_name,
      passenger_email: form.passenger_email,
      route_id: route.id,
      flight_number: route.flight_number,
      origin: route.origin,
      destination: route.destination,
      travel_date: booking ? booking.scheduled_date : customDate,
      notes: form.notes,
      status: 'pending',
    });
  };

  const statusColors = {
    pending: 'bg-amber-100 text-amber-700',
    confirmed: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-xl mx-auto px-6 py-24 text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="font-heading text-3xl font-bold text-foreground mb-3">Booking Submitted!</h1>
          <p className="text-muted-foreground mb-6">
            Thank you, {submitted.passenger_name}. Your booking request has been received and will be confirmed shortly.
          </p>
          {submitted.route && (
            <div className="bg-muted/50 rounded-xl p-5 text-sm mb-8 text-left space-y-2">
              <div className="flex items-center gap-2 font-semibold text-foreground">
                <Plane className="w-4 h-4 text-primary" />
                {submitted.route.flight_number}
              </div>
              <p className="text-muted-foreground">{submitted.route.origin} → {submitted.route.destination}</p>
              <p className="text-muted-foreground">{format(new Date(submitted.date), 'EEEE, d MMMM yyyy')}</p>
              <p className="text-muted-foreground">Aircraft: {submitted.route.aircraft || 'TBD'}</p>
            </div>
          )}
          <div className="flex gap-3 justify-center">
            <Button onClick={() => setSubmitted(null)}>Book Another</Button>
            <Button variant="outline" onClick={() => window.location.href = '/'}>Return Home</Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-5xl mx-auto px-6 py-16">
        <div className="text-center mb-10" style={routesBgColor ? { backgroundColor: routesBgColor } : {}}>
          <span className="text-xs font-semibold uppercase tracking-widest mb-3 block" style={{ color: routesHeadingColor || 'hsl(var(--secondary))' }}>{routesBadge}</span>
          <h1 className="font-heading text-4xl font-bold mb-4" style={{ color: routesHeadingColor || 'hsl(var(--foreground))' }}>{routesHeading}</h1>
          <p className="text-muted-foreground max-w-xl mx-auto">{routesSubtext}</p>
        </div>

        {/* Toggle: Book / Manage */}
        <div className="flex gap-2 mb-8 justify-center">
          <Button variant={!manageMode ? 'default' : 'outline'} size="sm" onClick={() => { setManageMode(false); setManagedBookings(null); }}>
            <Plane className="w-4 h-4 mr-2" />Book a Flight
          </Button>
          <Button variant={manageMode ? 'default' : 'outline'} size="sm" onClick={() => setManageMode(true)}>
            <RefreshCw className="w-4 h-4 mr-2" />Manage My Booking
          </Button>
        </div>

        {manageMode ? (
          <div className="max-w-2xl mx-auto space-y-6">
            <Card className="p-6">
              <h2 className="font-heading text-lg font-bold text-foreground mb-4">Find Your Booking</h2>
              <form onSubmit={handleManageLookup} className="flex gap-3">
                <Input type="email" placeholder="Enter your email address" value={manageEmail} onChange={e => setManageEmail(e.target.value)} className="flex-1" />
                <Button type="submit" disabled={loadingManage}>{loadingManage ? 'Searching...' : <Search className="w-4 h-4" />}</Button>
              </form>
            </Card>
            {managedBookings !== null && (
              managedBookings.length === 0 ? (
                <Card className="p-10 text-center"><p className="text-muted-foreground">No bookings found for this email.</p></Card>
              ) : (
                <div className="space-y-3">
                  {managedBookings.map(b => (
                    <Card key={b.id} className="p-5">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-foreground">{b.flight_number}</span>
                            <Badge className={statusColors[b.status] || ''}>{b.status}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{b.origin} → {b.destination}</p>
                          {b.travel_date && <p className="text-sm text-muted-foreground">{format(new Date(b.travel_date), 'EEEE, d MMMM yyyy')}</p>}
                        </div>
                        {b.status !== 'cancelled' && (
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" className="text-destructive border-destructive/30" onClick={() => cancelMutation.mutate(b.id)} disabled={cancelMutation.isPending}>
                              <XCircle className="w-4 h-4 mr-1" />Cancel
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleRebook(b)}>
                              <RefreshCw className="w-4 h-4 mr-1" />Rebook
                            </Button>
                          </div>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              )
            )}
          </div>
        ) : (
          <>
            {/* Search */}
            <Card className="p-6 mb-8">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Departure Airport</Label>
                  <Input placeholder="e.g. VTBS or Bangkok" value={departure} onChange={e => setDeparture(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Arrival Airport</Label>
                  <Input placeholder="e.g. EGLL or London" value={arrival} onChange={e => setArrival(e.target.value)} />
                </div>
              </div>
            </Card>

            {/* Route pair cards */}
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-heading text-xl font-bold text-foreground">
                Available Routes
                {filteredGroups.length > 0 && <span className="ml-2 text-sm font-normal text-muted-foreground">({filteredGroups.length})</span>}
              </h2>
            </div>

            {filteredGroups.length === 0 ? (
              <Card className="p-10 text-center">
                <Plane className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="font-medium text-foreground mb-1">No routes found</p>
                <p className="text-sm text-muted-foreground">Try a different origin or destination.</p>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredGroups.map(group => {
                  const bookings = getGroupBookings(group);
                  const canRequestDate = group.routes.some(r => r.require_pilot_booking === false);
                  return (
                    <Card key={group.key} className="p-5">
                      <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
                        <div>
                          <div className="flex items-center gap-2 text-lg font-semibold text-foreground">
                            <span>{group.origin}</span>
                            <ArrowRight className="w-4 h-4 text-primary" />
                            <span>{group.destination}</span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-0.5">{group.origin_name} → {group.destination_name}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          {group.distance_nm > 0 && <Badge variant="outline" className="text-xs">{group.distance_nm} NM</Badge>}
                          {group.aircraftTypes.map(ac => (
                            <Badge key={ac} variant="outline" className="text-xs">{ac}</Badge>
                          ))}
                        </div>
                      </div>

                      {bookings.length > 0 ? (
                        <div className="space-y-2">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" /> Scheduled Flights
                          </p>
                          {bookings.map(b => {
                            const route = group.routes.find(r => r.id === b.route_id) || group.routes[0];
                            return (
                              <div key={b.id} className="flex items-center justify-between gap-3 p-3 rounded-lg bg-muted/40 border border-border">
                                <div className="flex items-center gap-3">
                                  <Calendar className="w-4 h-4 text-primary" />
                                  <div>
                                    <p className="text-sm font-medium text-foreground">
                                      {format(new Date(b.scheduled_date), 'EEE, d MMM yyyy')}
                                      {b.departure_time && <span className="text-muted-foreground"> · {b.departure_time}Z</span>}
                                    </p>
                                    <p className="text-xs text-muted-foreground">{route?.flight_number} · {b.aircraft || route?.aircraft}</p>
                                  </div>
                                </div>
                                <Button size="sm" onClick={() => setBookingTarget({ route, booking: b })}>
                                  Book
                                </Button>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="flex items-center justify-between gap-3 p-3 rounded-lg bg-muted/30 border border-dashed border-border">
                          {canRequestDate ? (
                            <>
                              <p className="text-sm text-muted-foreground">No scheduled flights — request your own date.</p>
                              <Button size="sm" variant="outline" onClick={() => setBookingTarget({ route: group.routes[0], booking: null })}>
                                Request a Date
                              </Button>
                            </>
                          ) : (
                            <p className="text-sm text-muted-foreground">No scheduled flights available. Check back later.</p>
                          )}
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* Booking Dialog */}
      <Dialog open={!!bookingTarget} onOpenChange={(o) => { if (!o) { setBookingTarget(null); setCustomDate(''); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Book Your Flight</DialogTitle>
          </DialogHeader>
          {bookingTarget && (
            <form onSubmit={handleConfirmBooking} className="space-y-4">
              <div className="bg-muted/50 rounded-xl p-4 text-sm space-y-1">
                <p className="font-semibold text-foreground flex items-center gap-2">
                  <Plane className="w-4 h-4 text-primary" />
                  {bookingTarget.route.flight_number}
                </p>
                <p className="text-muted-foreground">{bookingTarget.route.origin} → {bookingTarget.route.destination}</p>
                {bookingTarget.booking ? (
                  <p className="text-muted-foreground">{format(new Date(bookingTarget.booking.scheduled_date), 'EEEE, d MMMM yyyy')}</p>
                ) : (
                  <div className="space-y-1.5 pt-1">
                    <Label>Choose a travel date</Label>
                    <Input type="date" value={customDate} onChange={e => setCustomDate(e.target.value)} required min={today} />
                  </div>
                )}
                <p className="text-muted-foreground">Aircraft: {bookingTarget.route.aircraft || 'TBD'}</p>
              </div>
              <div className="space-y-1.5">
                <Label>Your Name *</Label>
                <Input placeholder="John Smith" value={form.passenger_name} onChange={e => setForm(f => ({ ...f, passenger_name: e.target.value }))} required />
              </div>
              <div className="space-y-1.5">
                <Label>Email Address *</Label>
                <Input type="email" placeholder="john@example.com" value={form.passenger_email} onChange={e => setForm(f => ({ ...f, passenger_email: e.target.value }))} required />
              </div>
              <div className="space-y-1.5">
                <Label>Additional Notes</Label>
                <Input placeholder="Any special requests..." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
              <Button type="submit" className="w-full" size="lg" disabled={bookMutation.isPending}>
                {bookMutation.isPending ? 'Submitting...' : 'Confirm Booking Request'}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}