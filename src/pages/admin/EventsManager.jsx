import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { CalendarDays, Plus, Trash2, Users, Plane } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import BulkActionBar from '@/components/admin/BulkActionBar';
import { Checkbox } from '@/components/ui/checkbox';

const typeColors = {
  group_flight: 'bg-blue-100 text-blue-800',
  long_haul_challenge: 'bg-purple-100 text-purple-800',
  atc_event: 'bg-amber-100 text-amber-800',
  speed_run: 'bg-green-100 text-green-800',
  other: 'bg-slate-100 text-slate-700',
};
const typeLabels = {
  group_flight: 'Group Flight',
  long_haul_challenge: 'Long-Haul Challenge',
  atc_event: 'ATC Event',
  speed_run: 'Speed Run',
  other: 'Other',
};

const defaultForm = {
  title: '', description: '', event_type: 'group_flight', audience: 'all',
  event_date: '', event_time: '', end_date: '', route_from: '', route_to: '',
  aircraft: '', max_participants: '', banner_url: '', active: true,
};

export default function EventsManager() {
  const queryClient = useQueryClient();
  const [dialog, setDialog] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [signupsDialog, setSignupsDialog] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());

  const { data: events = [] } = useQuery({
    queryKey: ['admin-events'],
    queryFn: () => base44.entities.VAEvent.list('-event_date'),
  });

  const { data: signups = [] } = useQuery({
    queryKey: ['admin-event-signups', signupsDialog],
    queryFn: () => base44.entities.EventSignup.filter({ event_id: signupsDialog }),
    enabled: !!signupsDialog,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.VAEvent.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-events'] }); setDialog(false); toast.success('Event created'); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.VAEvent.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-events'] }); setDialog(false); toast.success('Event updated'); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.VAEvent.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-events'] }); toast.success('Event deleted'); },
  });

  const toggleSelect = (id) => setSelectedIds(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const toggleSelectAll = () => setSelectedIds(prev => prev.size === events.length ? new Set() : new Set(events.map(e => e.id)));
  const bulkEditFields = [
    { key: 'active', label: 'Published (Active)', type: 'boolean' },
    { key: 'audience', label: 'Audience', type: 'select', options: [
      { value: 'all', label: 'Everyone' }, { value: 'pilots', label: 'Pilots Only' }, { value: 'passengers', label: 'Passengers Only' }
    ]},
    { key: 'event_type', label: 'Event Type', type: 'select', options: Object.entries(typeLabels).map(([k, v]) => ({ value: k, label: v })) },
  ];
  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids) => { await Promise.all(ids.map(id => base44.entities.VAEvent.delete(id))); return ids.length; },
    onSuccess: (count) => { queryClient.invalidateQueries({ queryKey: ['admin-events'] }); setSelectedIds(new Set()); toast.success(`${count} events deleted`); },
  });
  const bulkUpdateMutation = useMutation({
    mutationFn: async ({ ids, field, value }) => { await base44.entities.VAEvent.bulkUpdate(ids.map(id => ({ id, [field]: value }))); return ids.length; },
    onSuccess: (count) => { queryClient.invalidateQueries({ queryKey: ['admin-events'] }); setSelectedIds(new Set()); toast.success(`${count} events updated`); },
  });

  const handleOpen = (event = null) => {
    setForm(event ? { ...event, max_participants: event.max_participants || '' } : { ...defaultForm });
    setDialog(event ? 'edit' : 'create');
  };

  const handleSave = () => {
    const payload = { ...form, max_participants: form.max_participants ? Number(form.max_participants) : undefined };
    if (dialog === 'edit' && form.id) {
      updateMutation.mutate({ id: form.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Events Manager</h1>
          <p className="text-muted-foreground text-sm mt-1">Create and manage pilot & passenger events</p>
        </div>
        <Button onClick={() => handleOpen()} className="bg-primary text-primary-foreground">
          <Plus className="w-4 h-4 mr-2" /> Create Event
        </Button>
      </div>

      <BulkActionBar
        selectedCount={selectedIds.size}
        onClear={() => setSelectedIds(new Set())}
        onDelete={() => bulkDeleteMutation.mutate(Array.from(selectedIds))}
        onBulkEdit={(field, value) => bulkUpdateMutation.mutate({ ids: Array.from(selectedIds), field, value })}
        editFields={bulkEditFields}
      />
      <div className="space-y-3">
        {events.length === 0 ? (
          <Card className="p-10 text-center">
            <CalendarDays className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">No events yet. Create one to get started.</p>
          </Card>
        ) : (
          <>
          <div className="flex items-center gap-3 px-1 pb-1">
            <Checkbox checked={selectedIds.size === events.length && events.length > 0} onCheckedChange={toggleSelectAll} />
            <span className="text-sm text-muted-foreground">Select all ({events.length})</span>
          </div>
          {events.map(ev => (
          <Card key={ev.id} className={`p-4 flex items-center justify-between gap-4 ${!ev.active ? 'opacity-60' : ''} ${selectedIds.has(ev.id) ? 'ring-2 ring-primary' : ''}`}>
            <div className="flex items-center gap-3">
              <Checkbox checked={selectedIds.has(ev.id)} onCheckedChange={() => toggleSelect(ev.id)} className="shrink-0" />
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <CalendarDays className="w-5 h-5 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-foreground">{ev.title}</span>
                  <Badge className={`text-xs ${typeColors[ev.event_type]}`}>{typeLabels[ev.event_type]}</Badge>
                  <Badge variant="outline" className="text-xs text-foreground">{ev.audience}</Badge>
                  {!ev.active && <Badge variant="secondary" className="text-xs">Hidden</Badge>}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {ev.event_date && format(new Date(ev.event_date), 'EEE, d MMM yyyy')}
                  {ev.event_time && ` · ${ev.event_time}Z`}
                  {ev.route_from && ev.route_to && ` · ${ev.route_from} → ${ev.route_to}`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button variant="ghost" size="sm" onClick={() => setSignupsDialog(ev.id)}>
                <Users className="w-4 h-4 mr-1" /> Signups
              </Button>
              <Button variant="ghost" size="sm" onClick={() => handleOpen(ev)}>Edit</Button>
              <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(ev.id)}>
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </div>
          </Card>
          ))}
          </>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={!!dialog} onOpenChange={open => !open && setDialog(false)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{dialog === 'edit' ? 'Edit Event' : 'Create Event'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Title *</label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Sydney Group Flight" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Description</label>
              <Textarea rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Event details..." />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Type</label>
                <Select value={form.event_type} onValueChange={v => setForm(f => ({ ...f, event_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(typeLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Audience</label>
                <Select value={form.audience} onValueChange={v => setForm(f => ({ ...f, audience: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Everyone</SelectItem>
                    <SelectItem value="pilots">Pilots Only</SelectItem>
                    <SelectItem value="passengers">Passengers Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Event Date *</label>
                <Input type="date" value={form.event_date} onChange={e => setForm(f => ({ ...f, event_date: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Time (Zulu)</label>
                <Input type="time" value={form.event_time} onChange={e => setForm(f => ({ ...f, event_time: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">From ICAO</label>
                <Input value={form.route_from} onChange={e => setForm(f => ({ ...f, route_from: e.target.value }))} placeholder="YSSY" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">To ICAO</label>
                <Input value={form.route_to} onChange={e => setForm(f => ({ ...f, route_to: e.target.value }))} placeholder="EGLL" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Aircraft</label>
                <Input value={form.aircraft} onChange={e => setForm(f => ({ ...f, aircraft: e.target.value }))} placeholder="B747, A380..." />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Max Participants</label>
                <Input type="number" value={form.max_participants} onChange={e => setForm(f => ({ ...f, max_participants: e.target.value }))} placeholder="Unlimited" />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Banner Image URL</label>
              <Input value={form.banner_url} onChange={e => setForm(f => ({ ...f, banner_url: e.target.value }))} placeholder="https://..." />
            </div>
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2">
                <Switch checked={form.active} onCheckedChange={v => setForm(f => ({ ...f, active: v }))} />
                <span className="text-sm text-muted-foreground">Published</span>
              </div>
              <Button onClick={handleSave}>Save Event</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Signups Dialog */}
      <Dialog open={!!signupsDialog} onOpenChange={open => !open && setSignupsDialog(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Event Sign-ups</DialogTitle></DialogHeader>
          <div className="mt-2 space-y-2">
            {signups.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No sign-ups yet.</p>
            ) : signups.map(s => (
              <div key={s.id} className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <p className="font-medium text-sm text-foreground">{s.name}</p>
                  <p className="text-xs text-muted-foreground">{s.email}</p>
                </div>
                <Badge variant="outline" className="text-xs text-foreground">{s.role}</Badge>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}