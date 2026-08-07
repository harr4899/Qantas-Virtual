import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plane, Radio, Plus, Trash2, Settings, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

const LIVE_CONFIG_KEY = 'live_tracking_config';
const statusColors = {
  preflight: 'bg-slate-100 text-slate-700',
  enroute: 'bg-blue-100 text-blue-800',
  approach: 'bg-amber-100 text-amber-800',
  landed: 'bg-green-100 text-green-800',
};

const defaultFlight = {
  pilot_email: '', pilot_name: '', flight_number: '', origin: '', origin_name: '',
  destination: '', destination_name: '', aircraft: '', status: 'preflight',
  altitude: '', speed: '', progress_pct: 0, departure_time: '', eta: '', remarks: '', active: true,
};

export default function LiveFlightManager() {
  const queryClient = useQueryClient();
  const [dialog, setDialog] = useState(null);
  const [form, setForm] = useState(defaultFlight);

  // Fetch live flights
  const { data: flights = [] } = useQuery({
    queryKey: ['admin-live-flights'],
    queryFn: () => base44.entities.LiveFlight.list('-created_date'),
  });

  // Fetch + manage config
  const { data: configRows = [] } = useQuery({
    queryKey: ['live-config'],
    queryFn: () => base44.entities.SiteSettings.filter({ key: LIVE_CONFIG_KEY }),
  });

  const config = useMemo(() => {
    if (!configRows.length) return { enabled: true, public_enabled: true, title: 'Live Flight Tracker', subtitle: 'See who\'s flying right now' };
    try { return JSON.parse(configRows[0].value || '{}'); } catch { return {}; }
  }, [configRows]);

  const saveConfigMutation = useMutation({
    mutationFn: async (newConfig) => {
      const val = JSON.stringify(newConfig);
      if (configRows.length > 0) {
        await base44.entities.SiteSettings.update(configRows[0].id, { value: val });
      } else {
        await base44.entities.SiteSettings.create({ key: LIVE_CONFIG_KEY, value: val });
      }
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['live-config'] }); toast.success('Settings saved'); },
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.LiveFlight.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-live-flights'] }); setDialog(null); toast.success('Flight added'); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.LiveFlight.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-live-flights'] }); setDialog(null); toast.success('Flight updated'); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.LiveFlight.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-live-flights'] }); toast.success('Flight removed'); },
  });

  const handleOpen = (flight = null) => {
    setForm(flight ? { ...flight } : { ...defaultFlight });
    setDialog(flight ? 'edit' : 'create');
  };

  const handleSave = () => {
    if (dialog === 'edit' && form.id) {
      updateMutation.mutate({ id: form.id, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const toggleConfig = (key) => saveConfigMutation.mutate({ ...config, [key]: !config[key] });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Live Flight Tracking</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage ACARS-style live flights shown to pilots and the public</p>
        </div>
        <Button onClick={() => handleOpen()} className="bg-primary text-primary-foreground">
          <Plus className="w-4 h-4 mr-2" /> Add Flight
        </Button>
      </div>

      {/* Settings */}
      <Card className="p-5 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Settings className="w-4 h-4 text-muted-foreground" />
          <h2 className="font-semibold text-foreground text-sm">Display Settings</h2>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div>
              <p className="font-medium text-sm text-foreground">Pilot Portal Tracker</p>
              <p className="text-xs text-muted-foreground">Show live tab on pilot portal</p>
            </div>
            <Switch checked={config.enabled !== false} onCheckedChange={() => toggleConfig('enabled')} />
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div>
              <p className="font-medium text-sm text-foreground">Public Tracker Page</p>
              <p className="text-xs text-muted-foreground">Show live tracker on public site</p>
            </div>
            <Switch checked={config.public_enabled !== false} onCheckedChange={() => toggleConfig('public_enabled')} />
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div>
              <p className="font-medium text-sm text-foreground">Allow Flight Plan Upload</p>
              <p className="text-xs text-muted-foreground">Pilots can attach flight plan files in ACARS</p>
            </div>
            <Switch checked={config.allow_flight_plan_upload !== false} onCheckedChange={() => toggleConfig('allow_flight_plan_upload')} />
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">Page Title</label>
            <Input value={config.title || ''} onChange={e => saveConfigMutation.mutate({ ...config, title: e.target.value })} placeholder="Live Flight Tracker" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">Page Subtitle</label>
            <Input value={config.subtitle || ''} onChange={e => saveConfigMutation.mutate({ ...config, subtitle: e.target.value })} placeholder="See who's flying right now" />
          </div>
        </div>
      </Card>

      {/* Active flights */}
      <div>
        <h2 className="text-xs uppercase tracking-[0.15em] text-muted-foreground font-semibold mb-3">Active Flights ({flights.filter(f => f.active).length})</h2>
        <div className="space-y-2">
          {flights.length === 0 ? (
            <Card className="p-8 text-center">
              <Radio className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-muted-foreground text-sm">No live flights. Add one to start tracking.</p>
            </Card>
          ) : flights.map(f => (
            <Card key={f.id} className={`p-4 flex items-center justify-between gap-4 ${!f.active ? 'opacity-50' : ''}`}>
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${f.active ? 'bg-primary/10' : 'bg-muted'}`}>
                  <Plane className={`w-4 h-4 ${f.active ? 'text-primary' : 'text-muted-foreground'}`} />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-heading font-bold text-foreground">{f.flight_number}</span>
                    <span className="text-sm text-muted-foreground">{f.origin} → {f.destination}</span>
                    <Badge className={`text-xs ${statusColors[f.status]}`}>{f.status}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{f.pilot_name || f.pilot_email} · {f.aircraft}</p>
                  {(f.altitude || f.speed) && (
                    <p className="text-xs text-muted-foreground">{f.altitude && `Alt: ${f.altitude}`}{f.altitude && f.speed && ' · '}{f.speed && `Spd: ${f.speed}`}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button variant="ghost" size="icon" onClick={() => updateMutation.mutate({ id: f.id, data: { active: !f.active } })}>
                  {f.active ? <Eye className="w-4 h-4 text-muted-foreground" /> : <EyeOff className="w-4 h-4 text-muted-foreground" />}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleOpen(f)}>Edit</Button>
                <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(f.id)}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Dialog */}
      <Dialog open={!!dialog} onOpenChange={open => !open && setDialog(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{dialog === 'edit' ? 'Edit Flight' : 'Add Live Flight'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Pilot Name</label>
                <Input value={form.pilot_name} onChange={e => setForm(f => ({ ...f, pilot_name: e.target.value }))} placeholder="Capt. J. Smith" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Pilot Email</label>
                <Input value={form.pilot_email} onChange={e => setForm(f => ({ ...f, pilot_email: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Flight Number</label>
                <Input value={form.flight_number} onChange={e => setForm(f => ({ ...f, flight_number: e.target.value }))} placeholder="QF101" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Aircraft</label>
                <Input value={form.aircraft} onChange={e => setForm(f => ({ ...f, aircraft: e.target.value }))} placeholder="B777" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Origin ICAO</label>
                <Input value={form.origin} onChange={e => setForm(f => ({ ...f, origin: e.target.value }))} placeholder="YSSY" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Destination ICAO</label>
                <Input value={form.destination} onChange={e => setForm(f => ({ ...f, destination: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Status</label>
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="preflight">Preflight</SelectItem>
                    <SelectItem value="enroute">Enroute</SelectItem>
                    <SelectItem value="approach">Approach</SelectItem>
                    <SelectItem value="landed">Landed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Progress %</label>
                <Input type="number" min="0" max="100" value={form.progress_pct} onChange={e => setForm(f => ({ ...f, progress_pct: Number(e.target.value) }))} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Altitude</label>
                <Input value={form.altitude} onChange={e => setForm(f => ({ ...f, altitude: e.target.value }))} placeholder="FL350" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Speed</label>
                <Input value={form.speed} onChange={e => setForm(f => ({ ...f, speed: e.target.value }))} placeholder="450 kts" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">ETD</label>
                <Input value={form.departure_time} onChange={e => setForm(f => ({ ...f, departure_time: e.target.value }))} placeholder="09:30Z" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">ETA</label>
                <Input value={form.eta} onChange={e => setForm(f => ({ ...f, eta: e.target.value }))} placeholder="14:15Z" />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Remarks</label>
              <Input value={form.remarks} onChange={e => setForm(f => ({ ...f, remarks: e.target.value }))} placeholder="Smooth flight, light turbulence over Pacific..." />
            </div>
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2">
                <Switch checked={form.active} onCheckedChange={v => setForm(f => ({ ...f, active: v }))} />
                <span className="text-sm text-muted-foreground">Visible</span>
              </div>
              <Button onClick={handleSave}>Save Flight</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}