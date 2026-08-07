import React, { useState, useMemo, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Plane, MapPin, ArrowRight, Shield, Lock, Search, X, Globe, Calendar as CalendarIcon } from 'lucide-react';
import { format, startOfDay } from 'date-fns';
import { toast } from 'sonner';

export default function RoutesTab({ routes, airports, ranks, opsConfig, myBookings, user, pilotRankOrder, nextRequiredOrigin, hasAnyActiveBooking }) {
  const queryClient = useQueryClient();
  const [bookingDialog, setBookingDialog] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [departureTime, setDepartureTime] = useState('');
  const [gate, setGate] = useState('');
  const [selectedAirport, setSelectedAirport] = useState(null);
  const [routeSearch, setRouteSearch] = useState('');
  const [aircraftFilter, setAircraftFilter] = useState('all');
  const [distanceFilter, setDistanceFilter] = useState('all');

  const bookMutation = useMutation({
    mutationFn: async (data) => {
      const { route, ...bookingData } = data;
      const booking = await base44.entities.FlightBooking.create(bookingData);
      try {
        await base44.entities.LiveFlight.create({
          pilot_email: bookingData.pilot_email,
          pilot_name: user?.full_name || user?.email,
          flight_number: bookingData.flight_number,
          origin: bookingData.origin,
          origin_name: route?.origin_name || '',
          destination: bookingData.destination,
          destination_name: route?.destination_name || '',
          aircraft: bookingData.aircraft,
          status: 'preflight',
          departure_time: bookingData.departure_time,
          booking_id: booking.id,
          active: true,
        });
      } catch (e) {
        console.error('Failed to auto-start live tracking', e);
      }
      return booking;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['my-live-flights'] });
      queryClient.invalidateQueries({ queryKey: ['all-live-flights'] });
      queryClient.invalidateQueries({ queryKey: ['acars-bookings'] });
      setBookingDialog(null);
      setSelectedDate(null);
      setDepartureTime('');
      setGate('');
      toast.success('Flight booked! Live tracking started automatically.');
    },
  });

  const getRouteRestriction = (route) => {
    if (opsConfig.enforce_rank_restrictions && route.required_rank) {
      const requiredRankObj = ranks.find(r => r.name === route.required_rank);
      const requiredOrder = requiredRankObj?.order ?? 0;
      if (pilotRankOrder < requiredOrder) return { locked: true, reason: `Requires rank: ${route.required_rank}` };
    }
    if (opsConfig.enforce_hub_start && opsConfig.hub_icao && !hasAnyActiveBooking) {
      if (route.origin.toUpperCase() !== opsConfig.hub_icao.toUpperCase())
        return { locked: true, reason: `First flight must depart from: ${opsConfig.hub_icao}` };
    }
    if (opsConfig.enforce_progressive_routing && nextRequiredOrigin && hasAnyActiveBooking) {
      if (route.origin.toUpperCase() !== nextRequiredOrigin.toUpperCase())
        return { locked: true, reason: `Must depart from: ${nextRequiredOrigin}` };
    }
    return { locked: false };
  };

  const aircraftTypes = useMemo(() => {
    const types = new Set(routes.map(r => r.aircraft).filter(Boolean));
    return Array.from(types).sort();
  }, [routes]);

  const filteredRoutes = useMemo(() => {
    return routes.filter(r => {
      if (routeSearch) {
        const q = routeSearch.toLowerCase();
        if (!(r.flight_number?.toLowerCase().includes(q) ||
              r.origin?.toLowerCase().includes(q) ||
              r.destination?.toLowerCase().includes(q) ||
              r.origin_name?.toLowerCase().includes(q) ||
              r.destination_name?.toLowerCase().includes(q) ||
              r.aircraft?.toLowerCase().includes(q))) return false;
      }
      if (aircraftFilter !== 'all' && r.aircraft !== aircraftFilter) return false;
      if (distanceFilter !== 'all') {
        const d = r.distance_nm || 0;
        if (distanceFilter === 'short' && d >= 500) return false;
        if (distanceFilter === 'medium' && (d < 500 || d > 1500)) return false;
        if (distanceFilter === 'long' && d < 1500) return false;
      }
      return true;
    });
  }, [routes, routeSearch, aircraftFilter, distanceFilter]);

  const isFiltering = !!routeSearch.trim() || aircraftFilter !== 'all' || distanceFilter !== 'all';

  const groupedRoutes = useMemo(() => {
    const groups = {};
    for (const route of filteredRoutes) {
      const key = route.origin || 'Unknown';
      if (!groups[key]) {
        const airportRecord = airports.find(a => a.icao?.toUpperCase() === key.toUpperCase());
        groups[key] = { origin: key, origin_name: airportRecord?.name || route.origin_name || '', routes: [] };
      }
      groups[key].routes.push(route);
    }
    return Object.values(groups).sort((a, b) => a.origin.localeCompare(b.origin));
  }, [filteredRoutes, airports]);

  useEffect(() => {
    if (groupedRoutes.length > 0 && !selectedAirport) {
      if (nextRequiredOrigin) {
        const match = groupedRoutes.find(g => g.origin.toUpperCase() === nextRequiredOrigin.toUpperCase());
        setSelectedAirport(match ? match.origin : groupedRoutes[0].origin);
      } else if (opsConfig.enforce_hub_start && opsConfig.hub_icao && !hasAnyActiveBooking) {
        const match = groupedRoutes.find(g => g.origin.toUpperCase() === opsConfig.hub_icao.toUpperCase());
        setSelectedAirport(match ? match.origin : groupedRoutes[0].origin);
      } else {
        setSelectedAirport(groupedRoutes[0].origin);
      }
    }
  }, [groupedRoutes, selectedAirport, nextRequiredOrigin]);

  const handleBook = () => {
    if (!bookingDialog || !selectedDate) return;
    bookMutation.mutate({
      route: bookingDialog,
      pilot_email: user.email,
      route_id: bookingDialog.id,
      flight_number: bookingDialog.flight_number,
      origin: bookingDialog.origin,
      destination: bookingDialog.destination,
      aircraft: bookingDialog.aircraft,
      scheduled_date: format(selectedDate, 'yyyy-MM-dd'),
      departure_time: departureTime,
      gate: gate,
      status: 'booked',
    });
  };

  const renderRouteCard = (route) => {
    const { locked, reason } = getRouteRestriction(route);
    return (
      <div key={route.id} className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${locked ? 'border-muted bg-muted/20 opacity-70' : 'border-border hover:border-primary/30 hover:bg-muted/20'}`}>
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${locked ? 'bg-muted' : 'bg-primary/10'}`}>
            {locked ? <Lock className="w-3.5 h-3.5 text-muted-foreground" /> : <Plane className="w-3.5 h-3.5 text-primary" />}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-heading font-bold text-foreground text-sm">{route.flight_number}</span>
              <Badge variant="outline" className="text-xs text-foreground">{route.aircraft}</Badge>
              {route.required_rank && opsConfig.enforce_rank_restrictions && (
                <Badge variant="outline" className="text-xs border-amber-400 text-amber-700 bg-amber-50">
                  <Shield className="w-2.5 h-2.5 mr-1" />{route.required_rank}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-xs mt-0.5 text-muted-foreground">
              <span className="font-semibold text-foreground">{route.origin}</span>
              <ArrowRight className="w-3 h-3" />
              <span className="font-semibold text-foreground">{route.destination}</span>
              {route.destination_name && <span>· {route.destination_name}</span>}
              {route.distance_nm > 0 && <span>· {route.distance_nm} NM</span>}
            </div>
            {locked && reason && (
              <p className="text-xs text-amber-700 font-medium mt-1 flex items-center gap-1">
                <Lock className="w-3 h-3" />{reason}
              </p>
            )}
          </div>
        </div>
        <Button size="sm" disabled={locked} onClick={() => !locked && setBookingDialog(route)} className={locked ? 'opacity-0' : 'bg-primary text-primary-foreground'}>
          Book
        </Button>
      </div>
    );
  };

  if (routes.length === 0) {
    return (
      <div className="text-center py-12">
        <Globe className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
        <p className="text-muted-foreground text-sm">No routes available yet.</p>
      </div>
    );
  }

  return (
    <>
      {/* Smart Search Bar */}
      <div className="mb-5 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search by flight number, airport, destination, or aircraft..." value={routeSearch} onChange={e => setRouteSearch(e.target.value)} className="pl-9 h-9" />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={aircraftFilter} onValueChange={setAircraftFilter}>
            <SelectTrigger className="w-auto h-8 text-xs"><SelectValue placeholder="Aircraft" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Aircraft</SelectItem>
              {aircraftTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={distanceFilter} onValueChange={setDistanceFilter}>
            <SelectTrigger className="w-auto h-8 text-xs"><SelectValue placeholder="Distance" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any Distance</SelectItem>
              <SelectItem value="short">Short (&lt;500 NM)</SelectItem>
              <SelectItem value="medium">Medium (500-1500 NM)</SelectItem>
              <SelectItem value="long">Long (&gt;1500 NM)</SelectItem>
            </SelectContent>
          </Select>
          {isFiltering && (
            <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => { setRouteSearch(''); setAircraftFilter('all'); setDistanceFilter('all'); }}>
              <X className="w-3 h-3 mr-1" /> Clear filters
            </Button>
          )}
          {isFiltering && (
            <span className="text-xs text-muted-foreground ml-auto">{filteredRoutes.length} match{filteredRoutes.length !== 1 ? 'es' : ''}</span>
          )}
        </div>
      </div>

      {/* Results */}
      {filteredRoutes.length === 0 ? (
        <div className="text-center py-12">
          <Search className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">No routes match your filters.</p>
        </div>
      ) : isFiltering ? (
        <div className="space-y-2">{filteredRoutes.map(renderRouteCard)}</div>
      ) : (
        <>
          <div className="mb-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2.5">Departure Airport</p>
            <div className="flex flex-wrap gap-2">
              {groupedRoutes.map(group => {
                const isActive = selectedAirport === group.origin;
                const allLocked = group.routes.every(r => getRouteRestriction(r).locked);
                return (
                  <button key={group.origin} onClick={() => setSelectedAirport(group.origin)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium transition-all ${
                      isActive ? 'bg-primary text-primary-foreground border-primary'
                        : allLocked ? 'bg-muted/30 text-muted-foreground border-muted/50 opacity-50'
                        : 'bg-background text-foreground border-border hover:border-primary/40 hover:bg-primary/5'
                    }`}>
                    <MapPin className="w-3 h-3" />
                    <span>{group.origin}</span>
                    <span className={`text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold leading-none ${isActive ? 'bg-white/20 text-white' : 'bg-muted text-muted-foreground'}`}>
                      {group.routes.length}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
          {(() => {
            const currentGroup = groupedRoutes.find(g => g.origin === selectedAirport);
            if (!currentGroup) return null;
            return (
              <div>
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <MapPin className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <div>
                    <span className="font-heading font-bold text-foreground text-sm">{currentGroup.origin}</span>
                    {currentGroup.origin_name && <span className="text-xs text-muted-foreground ml-2">{currentGroup.origin_name}</span>}
                  </div>
                </div>
                <div className="space-y-2">{currentGroup.routes.map(renderRouteCard)}</div>
              </div>
            );
          })()}
        </>
      )}

      {/* Booking Dialog */}
      <Dialog open={!!bookingDialog} onOpenChange={(open) => { if (!open) { setBookingDialog(null); setSelectedDate(null); setDepartureTime(''); setGate(''); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-foreground">Book Flight {bookingDialog?.flight_number}</DialogTitle>
          </DialogHeader>
          {bookingDialog && (
            <div className="space-y-4 mt-2">
              <div className="flex items-center justify-center gap-6 py-4 bg-muted/40 rounded-xl">
                <div className="text-center">
                  <p className="font-heading text-2xl font-bold text-foreground">{bookingDialog.origin}</p>
                  <p className="text-xs text-muted-foreground">{bookingDialog.origin_name}</p>
                </div>
                <Plane className="w-5 h-5 text-primary" />
                <div className="text-center">
                  <p className="font-heading text-2xl font-bold text-foreground">{bookingDialog.destination}</p>
                  <p className="text-xs text-muted-foreground">{bookingDialog.destination_name}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-muted/40 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Aircraft</p>
                  <p className="font-semibold text-foreground mt-0.5">{bookingDialog.aircraft}</p>
                </div>
                <div className="bg-muted/40 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Distance</p>
                  <p className="font-semibold text-foreground mt-0.5">{bookingDialog.distance_nm} NM</p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Date *</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal text-foreground">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? format(selectedDate, 'PPP') : <span className="text-muted-foreground">Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate}
                      disabled={(date) => startOfDay(date) < startOfDay(new Date())} initialFocus />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Dep. Time (Z)</label>
                  <Input type="time" value={departureTime} onChange={e => setDepartureTime(e.target.value)} />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Gate</label>
                  <Input value={gate} onChange={e => setGate(e.target.value)} placeholder="e.g. A12" />
                </div>
              </div>
              <Button className="w-full" onClick={handleBook} disabled={!selectedDate || bookMutation.isPending}>
                {bookMutation.isPending ? 'Booking...' : 'Confirm Booking'}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}