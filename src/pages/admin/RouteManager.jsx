import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Plane, ArrowRight, Shield, Lock } from 'lucide-react';
import { toast } from 'sonner';
import BulkActionBar from '@/components/admin/BulkActionBar';

const emptyForm = {
  flight_number: '', origin: '', origin_name: '', destination: '',
  destination_name: '', aircraft: '', distance_nm: 0, flight_level: '', notes: '', active: true,
  required_rank: '', require_pilot_booking: true
};

export default function RouteManager() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [selectedIds, setSelectedIds] = useState(new Set());

  const { data: ranks = [] } = useQuery({
    queryKey: ['pilot-ranks'],
    queryFn: () => base44.entities.PilotRank.list('order'),
  });

  const { data: routes = [], isLoading } = useQuery({
    queryKey: ['admin-routes'],
    queryFn: () => base44.entities.Route.list('flight_number'),
  });

  const saveMutation = useMutation({
    mutationFn: (data) => editing
      ? base44.entities.Route.update(editing.id, data)
      : base44.entities.Route.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-routes'] });
      queryClient.invalidateQueries({ queryKey: ['public-routes'] });
      setDialogOpen(false);
      setForm(emptyForm);
      setEditing(null);
      toast.success(editing ? 'Route updated' : 'Route created');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Route.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-routes'] });
      queryClient.invalidateQueries({ queryKey: ['public-routes'] });
      toast.success('Route deleted');
    },
  });

  const toggleSelect = (id) => setSelectedIds(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const toggleSelectAll = () => setSelectedIds(prev => prev.size === routes.length ? new Set() : new Set(routes.map(r => r.id)));

  const bulkEditFields = [
    { key: 'active', label: 'Active (Visible)', type: 'boolean' },
    { key: 'require_pilot_booking', label: 'Require Pilot Booking', type: 'boolean' },
  ];

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids) => { await Promise.all(ids.map(id => base44.entities.Route.delete(id))); return ids.length; },
    onSuccess: (count) => { queryClient.invalidateQueries({ queryKey: ['admin-routes'] }); setSelectedIds(new Set()); toast.success(`${count} routes deleted`); },
  });
  const bulkUpdateMutation = useMutation({
    mutationFn: async ({ ids, field, value }) => { await base44.entities.Route.bulkUpdate(ids.map(id => ({ id, [field]: value }))); return ids.length; },
    onSuccess: (count) => { queryClient.invalidateQueries({ queryKey: ['admin-routes'] }); setSelectedIds(new Set()); toast.success(`${count} routes updated`); },
  });

  const openEdit = (route) => {
    setEditing(route);
    setForm({
      flight_number: route.flight_number || '',
      origin: route.origin || '',
      origin_name: route.origin_name || '',
      destination: route.destination || '',
      destination_name: route.destination_name || '',
      aircraft: route.aircraft || '',
      distance_nm: route.distance_nm || 0,
      flight_level: route.flight_level || '',
      notes: route.notes || '',
      active: route.active !== false,
      required_rank: route.required_rank || '',
      require_pilot_booking: route.require_pilot_booking !== false,
    });
    setDialogOpen(true);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-heading text-3xl font-bold text-foreground">Route Manager</h1>
          <p className="text-muted-foreground mt-1">Create and manage flight routes for pilots to book.</p>
        </div>
        <Button onClick={() => { setForm(emptyForm); setEditing(null); setDialogOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" />Add Route
        </Button>
      </div>

      <BulkActionBar
        selectedCount={selectedIds.size}
        onClear={() => setSelectedIds(new Set())}
        onDelete={() => bulkDeleteMutation.mutate(Array.from(selectedIds))}
        onBulkEdit={(field, value) => bulkUpdateMutation.mutate({ ids: Array.from(selectedIds), field, value })}
        editFields={bulkEditFields}
      />

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      ) : routes.length === 0 ? (
        <div className="text-center py-16">
          <Plane className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">No routes created yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-3 px-1 pb-1">
            <Checkbox checked={selectedIds.size === routes.length && routes.length > 0} onCheckedChange={toggleSelectAll} />
            <span className="text-sm text-muted-foreground">Select all ({routes.length})</span>
          </div>
          {routes.map(route => (
            <Card key={route.id} className={`px-5 py-4 flex items-center justify-between ${selectedIds.has(route.id) ? 'ring-2 ring-primary' : ''}`}>
              <div className="flex items-center gap-4">
                <Checkbox checked={selectedIds.has(route.id)} onCheckedChange={() => toggleSelect(route.id)} className="shrink-0" />
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Plane className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-foreground">{route.flight_number}</h3>
                    <Badge variant="outline">{route.aircraft}</Badge>
                    {!route.active && <Badge variant="secondary">Inactive</Badge>}
                    {route.require_pilot_booking !== false && (
                      <Badge variant="outline" className="text-xs border-blue-400 text-blue-700 bg-blue-50">
                        <Lock className="w-3 h-3 mr-1" />Pilot Required
                      </Badge>
                    )}
                    {route.required_rank && (
                      <Badge variant="outline" className="text-xs border-amber-400 text-amber-700 bg-amber-50">
                        <Shield className="w-3 h-3 mr-1" />{route.required_rank}+
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{route.origin}</span>
                    <ArrowRight className="w-3 h-3" />
                    <span>{route.destination}</span>
                    {route.distance_nm > 0 && <span>· {route.distance_nm} NM</span>}
                  </div>
                </div>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" onClick={() => openEdit(route)}>
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(route.id)}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) { setEditing(null); setForm(emptyForm); } }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Route' : 'Create Route'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>Flight Number</Label>
              <Input value={form.flight_number} onChange={e => setForm(f => ({ ...f, flight_number: e.target.value }))} placeholder="TG101" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Origin (ICAO)</Label>
                <Input value={form.origin} onChange={e => setForm(f => ({ ...f, origin: e.target.value }))} placeholder="VTBS" />
              </div>
              <div>
                <Label>Origin Name</Label>
                <Input value={form.origin_name} onChange={e => setForm(f => ({ ...f, origin_name: e.target.value }))} placeholder="Suvarnabhumi" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Destination (ICAO)</Label>
                <Input value={form.destination} onChange={e => setForm(f => ({ ...f, destination: e.target.value }))} placeholder="EGLL" />
              </div>
              <div>
                <Label>Destination Name</Label>
                <Input value={form.destination_name} onChange={e => setForm(f => ({ ...f, destination_name: e.target.value }))} placeholder="London Heathrow" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Aircraft</Label>
                <Input value={form.aircraft} onChange={e => setForm(f => ({ ...f, aircraft: e.target.value }))} placeholder="B777" />
              </div>
              <div>
                <Label>Distance (NM)</Label>
                <Input type="number" value={form.distance_nm} onChange={e => setForm(f => ({ ...f, distance_nm: parseInt(e.target.value) || 0 }))} />
              </div>
              <div>
                <Label>Flight Level</Label>
                <Input value={form.flight_level} onChange={e => setForm(f => ({ ...f, flight_level: e.target.value }))} placeholder="FL350" />
              </div>
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Special procedures, remarks..." />
            </div>
            <div>
              <Label>Required Rank (optional)</Label>
              <p className="text-xs text-muted-foreground mb-1">Only pilots with this rank can book this route (when rank restrictions are enabled in Pilot Ops Settings).</p>
              <select
                className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background"
                value={form.required_rank}
                onChange={e => setForm(f => ({ ...f, required_rank: e.target.value }))}
              >
                <option value="">No restriction (all ranks)</option>
                {ranks.map(r => (
                  <option key={r.id} value={r.name}>{r.name}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={form.active} onCheckedChange={v => setForm(f => ({ ...f, active: v }))} />
              <Label>Active (visible to pilots)</Label>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg border border-border bg-muted/30">
              <Switch checked={form.require_pilot_booking} onCheckedChange={v => setForm(f => ({ ...f, require_pilot_booking: v }))} className="mt-0.5" />
              <div>
                <Label>Require pilot booking for passengers</Label>
                <p className="text-xs text-muted-foreground mt-0.5">When on, passengers can only book this route if a pilot has scheduled a flight on it. Turn off to let passengers request any date.</p>
              </div>
            </div>
            <Button className="w-full" onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? 'Saving...' : 'Save Route'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}