import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Pencil, Users, RefreshCw, Search } from 'lucide-react';
import { toast } from 'sonner';

const EMPTY = { pilot_email: '', display_name: '', rank_id: '', flights_completed: 0, active: true, discord_id: '', notes: '' };

export default function RosterManager() {
  const queryClient = useQueryClient();
  const [dialog, setDialog] = useState(null); // null | 'add' | 'edit'
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [search, setSearch] = useState('');

  const { data: roster = [], isLoading } = useQuery({
    queryKey: ['admin-roster'],
    queryFn: () => base44.entities.PilotRoster.list('-created_date'),
  });

  const { data: ranks = [] } = useQuery({
    queryKey: ['pilot-ranks'],
    queryFn: () => base44.entities.PilotRank.list('order'),
  });

  const { data: bookings = [] } = useQuery({
    queryKey: ['all-bookings-roster'],
    queryFn: () => base44.entities.FlightBooking.filter({ status: 'completed' }),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.PilotRoster.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-roster'] }); toast.success('Pilot added to roster'); closeDialog(); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.PilotRoster.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-roster'] }); toast.success('Pilot updated'); closeDialog(); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.PilotRoster.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-roster'] }); toast.success('Removed from roster'); },
  });

  const autoAssignMutation = useMutation({
    mutationFn: async () => {
      const autoRanks = ranks.filter(r => r.auto_assign).sort((a, b) => b.min_flights - a.min_flights);
      for (const pilot of roster) {
        const flightCount = bookings.filter(b => b.pilot_email === pilot.pilot_email).length;
        const assignedRank = autoRanks.find(r => flightCount >= (r.min_flights || 0));
        if (assignedRank) {
          await base44.entities.PilotRoster.update(pilot.id, { rank_id: assignedRank.id, rank_name: assignedRank.name, flights_completed: flightCount });
        }
      }
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-roster'] }); toast.success('Auto-assigned ranks based on flight count'); },
  });

  const openAdd = () => { setForm(EMPTY); setEditing(null); setDialog('edit'); };
  const openEdit = (p) => { setForm({ ...p }); setEditing(p); setDialog('edit'); };
  const closeDialog = () => { setDialog(null); setEditing(null); setForm(EMPTY); };

  const handleSave = () => {
    const rank = ranks.find(r => r.id === form.rank_id);
    const data = { ...form, rank_name: rank?.name || form.rank_name || '' };
    if (editing) updateMutation.mutate({ id: editing.id, data });
    else createMutation.mutate(data);
  };

  const rankMap = Object.fromEntries(ranks.map(r => [r.id, r]));

  const filteredRoster = roster.filter(p => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (p.display_name?.toLowerCase().includes(q) || p.pilot_email?.toLowerCase().includes(q));
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-heading text-3xl font-bold text-foreground">Pilot Roster</h1>
          <p className="text-muted-foreground mt-1">Manage active pilots and their ranks.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => autoAssignMutation.mutate()} disabled={autoAssignMutation.isPending}>
            <RefreshCw className="w-4 h-4 mr-2" />Auto-Assign Ranks
          </Button>
          <Button onClick={openAdd}>
            <Plus className="w-4 h-4 mr-2" />Add Pilot
          </Button>
        </div>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by name or email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9 max-w-md"
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>
      ) : filteredRoster.length === 0 ? (
        <div className="text-center py-16">
          {search ? (
            <>
              <Search className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground">No pilots match "{search}".</p>
            </>
          ) : (
            <>
              <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground">No pilots on roster yet.</p>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredRoster.map(pilot => {
            const rank = rankMap[pilot.rank_id];
            return (
              <Card key={pilot.id} className="px-5 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                    {(pilot.display_name || pilot.pilot_email)?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{pilot.display_name || pilot.pilot_email}</p>
                    <p className="text-xs text-muted-foreground">{pilot.pilot_email}</p>
                  </div>
                  {pilot.rank_name && (
                    <Badge style={{ backgroundColor: rank?.badge_color || '#6b21a8', color: '#fff', border: 'none' }}>
                      {pilot.rank_name}
                    </Badge>
                  )}
                  <span className="text-xs text-muted-foreground">{pilot.flights_completed || 0} flights</span>
                  {pilot.discord_id && (
                    <Badge variant="outline" className="text-xs border-indigo-400 text-indigo-600">
                      Discord Linked
                    </Badge>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(pilot)}><Pencil className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(pilot.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={dialog === 'edit'} onOpenChange={(o) => !o && closeDialog()}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'Edit Pilot' : 'Add Pilot to Roster'}</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-1.5"><Label>Pilot Email *</Label><Input value={form.pilot_email} onChange={e => setForm(f => ({ ...f, pilot_email: e.target.value }))} placeholder="pilot@example.com" /></div>
            <div className="space-y-1.5"><Label>Display Name</Label><Input value={form.display_name} onChange={e => setForm(f => ({ ...f, display_name: e.target.value }))} placeholder="Optional display name" /></div>
            <div className="space-y-1.5">
              <Label>Rank</Label>
              <Select value={form.rank_id} onValueChange={v => setForm(f => ({ ...f, rank_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Select rank..." /></SelectTrigger>
                <SelectContent>
                  {ranks.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Flights Completed</Label><Input type="number" value={form.flights_completed} onChange={e => setForm(f => ({ ...f, flights_completed: parseInt(e.target.value) || 0 }))} /></div>
            <div className="space-y-1.5"><Label>Discord ID</Label><Input value={form.discord_id || ''} onChange={e => setForm(f => ({ ...f, discord_id: e.target.value }))} placeholder="Auto-filled by Discord bot — avoid editing" /></div>
            <div className="space-y-1.5"><Label>Notes</Label><Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></div>
            <Button className="w-full" onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending}>
              {editing ? 'Save Changes' : 'Add Pilot'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}