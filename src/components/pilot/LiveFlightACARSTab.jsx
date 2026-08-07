import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plane, Radio, Plus, CheckCircle, Trash2, Zap, Upload, FileText, X } from 'lucide-react';
import { toast } from 'sonner';

const LIVE_CONFIG_KEY = 'live_tracking_config';

const statusColors = {
  preflight: 'bg-slate-100 text-slate-700',
  enroute: 'bg-blue-100 text-blue-800',
  approach: 'bg-amber-100 text-amber-800',
  landed: 'bg-green-100 text-green-800',
};

const statusSteps = ['preflight', 'enroute', 'approach', 'landed'];
const statusLabels = { preflight: 'Preflight', enroute: 'Enroute', approach: 'Approach', landed: 'Landed' };

const makeEmpty = () => ({
  flight_number: '', origin: '', origin_name: '',
  destination: '', destination_name: '', aircraft: '', status: 'preflight',
  altitude: '', speed: '', progress_pct: 0, departure_time: '', eta: '', remarks: '',
  flight_plan_url: '', flight_plan_name: '',
});

export default function LiveFlightACARSTab({ user }) {
  const queryClient = useQueryClient();
  const [dialog, setDialog] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState('manual'); // default to manual
  const [form, setForm] = useState(makeEmpty());
  const [uploadingPlan, setUploadingPlan] = useState(false);

  const { data: configRows = [] } = useQuery({
    queryKey: ['live-config-pilot'],
    queryFn: () => base44.entities.SiteSettings.filter({ key: LIVE_CONFIG_KEY }),
  });

  const config = useMemo(() => {
    if (!configRows.length) return { enabled: true };
    try { return JSON.parse(configRows[0].value || '{}'); } catch { return {}; }
  }, [configRows]);

  const { data: myBookings = [] } = useQuery({
    queryKey: ['acars-bookings', user?.email],
    queryFn: () => base44.entities.FlightBooking.filter({ pilot_email: user?.email, status: 'booked' }, '-scheduled_date'),
    enabled: !!user?.email,
  });

  const { data: myFlights = [] } = useQuery({
    queryKey: ['my-live-flights', user?.email],
    queryFn: () => base44.entities.LiveFlight.filter({ pilot_email: user?.email, active: true }, '-created_date'),
    enabled: !!user?.email,
    refetchInterval: 15000,
  });

  const { data: allFlights = [] } = useQuery({
    queryKey: ['all-live-flights'],
    queryFn: () => base44.entities.LiveFlight.filter({ active: true }, '-created_date'),
    refetchInterval: 20000,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.LiveFlight.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-live-flights'] });
      queryClient.invalidateQueries({ queryKey: ['all-live-flights'] });
      closeDialog();
      toast.success('Flight logged to ACARS!');
    },
    onError: (e) => toast.error('Failed: ' + (e?.message || 'Unknown error')),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.LiveFlight.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-live-flights'] });
      queryClient.invalidateQueries({ queryKey: ['all-live-flights'] });
      toast.success('Status updated');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.LiveFlight.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-live-flights'] });
      queryClient.invalidateQueries({ queryKey: ['all-live-flights'] });
      toast.success('Flight removed');
    },
  });

  const closeDialog = () => {
    setDialog(false);
    setSelectedBooking('manual');
    setForm(makeEmpty());
  };

  const openDialog = () => {
    setSelectedBooking('manual');
    setForm(makeEmpty());
    setDialog(true);
  };

  const handleBookingSelect = (bookingId) => {
    setSelectedBooking(bookingId);
    if (bookingId === 'manual') {
      setForm(makeEmpty());
      return;
    }
    const booking = myBookings.find(b => b.id === bookingId);
    if (booking) {
      setForm({
        ...makeEmpty(),
        flight_number: booking.flight_number || '',
        origin: booking.origin || '',
        destination: booking.destination || '',
        aircraft: booking.aircraft || '',
        departure_time: booking.departure_time || '',
      });
    }
  };

  const handleUploadFlightPlan = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPlan(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setForm(f => ({ ...f, flight_plan_url: file_url, flight_plan_name: file.name }));
      toast.success('Flight plan uploaded!');
    } finally {
      setUploadingPlan(false);
    }
  };

  const handleSubmit = () => {
    if (!form.flight_number?.trim()) { toast.error('Flight number is required'); return; }
    if (!form.origin?.trim()) { toast.error('Origin ICAO is required'); return; }
    if (!form.destination?.trim()) { toast.error('Destination ICAO is required'); return; }

    createMutation.mutate({
      flight_number: form.flight_number.trim(),
      origin: form.origin.trim().toUpperCase(),
      origin_name: form.origin_name?.trim() || '',
      destination: form.destination.trim().toUpperCase(),
      destination_name: form.destination_name?.trim() || '',
      aircraft: form.aircraft?.trim() || '',
      status: form.status || 'preflight',
      altitude: form.altitude?.trim() || '',
      speed: form.speed?.trim() || '',
      progress_pct: Number(form.progress_pct) || 0,
      departure_time: form.departure_time?.trim() || '',
      eta: form.eta?.trim() || '',
      remarks: form.remarks?.trim() || '',
      flight_plan_url: form.flight_plan_url || '',
      flight_plan_name: form.flight_plan_name || '',
      pilot_email: user?.email,
      pilot_name: user?.full_name || user?.email,
      active: true,
    });
  };

  const advanceStatus = (f) => {
    const idx = statusSteps.indexOf(f.status);
    if (idx < 0 || idx >= statusSteps.length - 1) return;
    const next = statusSteps[idx + 1];
    const extraData = next === 'landed' ? { active: false } : {};
    updateMutation.mutate({ id: f.id, data: { status: next, ...extraData } });
  };

  if (config.enabled === false) {
    return (
      <div className="text-center py-12">
        <Radio className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
        <p className="text-muted-foreground">Live tracking is currently disabled by admin.</p>
      </div>
    );
  }

  const otherFlights = allFlights.filter(f => f.pilot_email !== user?.email);

  return (
    <div className="space-y-6">
      {/* My Active Flights */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            My Live Flights
          </h3>
          <Button size="sm" className="bg-primary text-primary-foreground" onClick={openDialog}>
            <Plus className="w-3.5 h-3.5 mr-1.5" /> Log Flight
          </Button>
        </div>

        {myFlights.length === 0 ? (
          <Card className="p-6 text-center border-dashed">
            <Plane className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No active ACARS entries. Log a flight to appear on the live tracker!</p>
          </Card>
        ) : (
          <div className="space-y-2">
            {myFlights.map(f => {
              const stepIdx = statusSteps.indexOf(f.status);
              const isLanded = f.status === 'landed';
              return (
                <Card key={f.id} className="p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${f.status === 'enroute' ? 'bg-primary/10' : 'bg-muted'}`}>
                        <Plane className={`w-4 h-4 ${f.status === 'enroute' ? 'text-primary' : 'text-muted-foreground'}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-heading font-bold text-sm text-foreground">{f.flight_number}</span>
                          <span className="text-xs text-muted-foreground">{f.origin} → {f.destination}</span>
                          <Badge className={`text-xs ${statusColors[f.status]}`}>{statusLabels[f.status]}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {f.aircraft}{f.altitude && ` · Alt: ${f.altitude}`}{f.speed && ` · ${f.speed}`}
                        </p>
                        {f.flight_plan_url && (
                          <a href={f.flight_plan_url} target="_blank" rel="noopener noreferrer"
                            className="text-xs text-primary flex items-center gap-1 mt-0.5 hover:underline">
                            <FileText className="w-3 h-3" />{f.flight_plan_name || 'Flight Plan'}
                          </a>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {!isLanded && (
                        <Button size="sm" variant="outline"
                          className={`text-xs ${stepIdx === statusSteps.length - 2 ? 'bg-green-600 hover:bg-green-700 text-white border-0' : ''}`}
                          onClick={() => advanceStatus(f)}
                          disabled={updateMutation.isPending}
                        >
                          {stepIdx === 0 && 'Depart'}
                          {stepIdx === 1 && 'Approach'}
                          {stepIdx === 2 && <><CheckCircle className="w-3.5 h-3.5 mr-1" />Land</>}
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(f.id)} disabled={deleteMutation.isPending}>
                        <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                      </Button>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-1.5">
                    {statusSteps.map((s, i) => (
                      <div key={s} className={`h-1.5 flex-1 rounded-full ${i <= stepIdx ? 'bg-primary' : 'bg-muted'}`} />
                    ))}
                  </div>
                  {f.progress_pct > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">{f.progress_pct}% complete</p>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Other pilots flying */}
      {otherFlights.length > 0 && (
        <div>
          <h3 className="font-semibold text-foreground mb-3">Other Pilots Flying Now</h3>
          <div className="space-y-2">
            {otherFlights.map(f => (
              <div key={f.id} className="flex items-center gap-3 p-3 rounded-xl border border-muted bg-muted/20">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm text-foreground">{f.flight_number}</span>
                    <span className="text-xs text-muted-foreground">{f.origin} → {f.destination}</span>
                    <Badge className={`text-xs ${statusColors[f.status]}`}>{statusLabels[f.status]}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{f.pilot_name || f.pilot_email}</p>
                </div>
                {f.progress_pct > 0 && (
                  <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden shrink-0">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${f.progress_pct}%` }} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Log flight dialog */}
      <Dialog open={dialog} onOpenChange={(open) => { if (!open) closeDialog(); }}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-primary" />Log to ACARS
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            {/* Booking selector */}
            {myBookings.length > 0 && (
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  Select Booking <span className="text-muted-foreground/60">(or enter manually)</span>
                </label>
                <Select value={selectedBooking} onValueChange={handleBookingSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a booked flight…" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">
                      <span className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5" />Enter manually</span>
                    </SelectItem>
                    {myBookings.map(b => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.flight_number} · {b.origin} → {b.destination} · {b.scheduled_date}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Form fields */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Flight Number *</label>
                <Input value={form.flight_number} onChange={e => setForm(f => ({ ...f, flight_number: e.target.value }))} placeholder="QF101" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Aircraft</label>
                <Input value={form.aircraft} onChange={e => setForm(f => ({ ...f, aircraft: e.target.value }))} placeholder="B777" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Origin ICAO *</label>
                <Input value={form.origin} onChange={e => setForm(f => ({ ...f, origin: e.target.value.toUpperCase() }))} placeholder="YSSY" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Destination ICAO *</label>
                <Input value={form.destination} onChange={e => setForm(f => ({ ...f, destination: e.target.value.toUpperCase() }))} placeholder="EGLL" />
              </div>
            </div>

            {/* Flight phase */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block">Current Phase</label>
              <div className="grid grid-cols-4 gap-1.5">
                {statusSteps.map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, status: s }))}
                    className={`px-2 py-2 rounded-lg text-xs font-medium border transition-all ${form.status === s ? 'bg-primary text-primary-foreground border-primary' : 'bg-background border-border text-muted-foreground hover:border-primary/50'}`}
                  >
                    {statusLabels[s]}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Altitude</label>
                <Input value={form.altitude} onChange={e => setForm(f => ({ ...f, altitude: e.target.value }))} placeholder="FL350" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Speed</label>
                <Input value={form.speed} onChange={e => setForm(f => ({ ...f, speed: e.target.value }))} placeholder="450 kts" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">ETD (Zulu)</label>
                <Input value={form.departure_time} onChange={e => setForm(f => ({ ...f, departure_time: e.target.value }))} placeholder="09:30Z" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">ETA (Zulu)</label>
                <Input value={form.eta} onChange={e => setForm(f => ({ ...f, eta: e.target.value }))} placeholder="14:15Z" />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Progress % (0–100)</label>
              <Input type="number" min="0" max="100" value={form.progress_pct} onChange={e => setForm(f => ({ ...f, progress_pct: e.target.value }))} />
            </div>

            {/* Flight Plan Upload - only if config allows */}
            {config.allow_flight_plan_upload !== false && (
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Flight Plan</label>
                {form.flight_plan_url ? (
                  <div className="flex items-center gap-2 p-2.5 rounded-lg border border-primary/30 bg-primary/5">
                    <FileText className="w-4 h-4 text-primary shrink-0" />
                    <a href={form.flight_plan_url} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline flex-1 truncate">
                      {form.flight_plan_name || 'Flight Plan'}
                    </a>
                    <button type="button" onClick={() => setForm(f => ({ ...f, flight_plan_url: '', flight_plan_name: '' }))}
                      className="text-muted-foreground hover:text-destructive">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <label className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border border-dashed border-border cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all ${uploadingPlan ? 'opacity-60 pointer-events-none' : ''}`}>
                    <Upload className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className="text-xs text-muted-foreground">
                      {uploadingPlan ? 'Uploading…' : 'Upload flight plan (PDF, .fpl, .xml, .txt)'}
                    </span>
                    <input type="file" accept=".pdf,.fpl,.xml,.txt,.ofp,.lnmpln,.pln" className="hidden" onChange={handleUploadFlightPlan} />
                  </label>
                )}
              </div>
            )}

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Remarks</label>
              <Input value={form.remarks} onChange={e => setForm(f => ({ ...f, remarks: e.target.value }))} placeholder="Conditions, notes…" />
            </div>

            <Button
              className="w-full"
              onClick={handleSubmit}
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? 'Logging…' : 'Log to ACARS'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}