import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Trash2, Pencil, Star } from 'lucide-react';
import { toast } from 'sonner';

const EMPTY = { name: '', min_flights: 0, auto_assign: false, badge_color: '#6b21a8', order: 0 };

export default function RankManager() {
  const queryClient = useQueryClient();
  const [dialog, setDialog] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);

  const { data: ranks = [], isLoading } = useQuery({
    queryKey: ['pilot-ranks'],
    queryFn: () => base44.entities.PilotRank.list('order'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.PilotRank.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['pilot-ranks'] }); toast.success('Rank created'); closeDialog(); },
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.PilotRank.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['pilot-ranks'] }); toast.success('Rank updated'); closeDialog(); },
  });
  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.PilotRank.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['pilot-ranks'] }); toast.success('Rank deleted'); },
  });

  const openAdd = () => { setForm(EMPTY); setEditing(null); setDialog(true); };
  const openEdit = (r) => { setForm({ ...r }); setEditing(r); setDialog(true); };
  const closeDialog = () => { setDialog(false); setEditing(null); setForm(EMPTY); };
  const handleSave = () => {
    if (editing) updateMutation.mutate({ id: editing.id, data: form });
    else createMutation.mutate(form);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-heading text-3xl font-bold text-foreground">Pilot Ranks</h1>
          <p className="text-muted-foreground mt-1">Define rank tiers and automation rules.</p>
        </div>
        <Button onClick={openAdd}><Plus className="w-4 h-4 mr-2" />Add Rank</Button>
      </div>

      <Card className="p-4 mb-6 bg-muted/40 border-dashed">
        <p className="text-sm text-muted-foreground"><strong>Auto-Assign:</strong> Enable auto-assign on a rank and set the minimum flights required. Use the "Auto-Assign Ranks" button in the Roster Manager to apply them.</p>
      </Card>

      {isLoading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>
      ) : ranks.length === 0 ? (
        <div className="text-center py-16"><Star className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" /><p className="text-muted-foreground">No ranks defined yet.</p></div>
      ) : (
        <div className="space-y-2">
          {ranks.map(rank => (
            <Card key={rank.id} className="px-5 py-3 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: rank.badge_color }} />
                <div>
                  <Badge style={{ backgroundColor: rank.badge_color, color: '#fff', border: 'none' }}>{rank.name}</Badge>
                </div>
                <span className="text-sm text-muted-foreground">Order: {rank.order}</span>
                {rank.auto_assign && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                    Auto ≥ {rank.min_flights} flights
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" onClick={() => openEdit(rank)}><Pencil className="w-4 h-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(rank.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialog} onOpenChange={(o) => !o && closeDialog()}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'Edit Rank' : 'Add Rank'}</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-1.5"><Label>Rank Name *</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. First Officer" /></div>
            <div className="space-y-1.5"><Label>Display Order (lower = lower rank)</Label><Input type="number" value={form.order} onChange={e => setForm(f => ({ ...f, order: parseInt(e.target.value) || 0 }))} /></div>
            <div className="space-y-1.5"><Label>Badge Color</Label><div className="flex gap-3 items-center"><Input type="color" value={form.badge_color} onChange={e => setForm(f => ({ ...f, badge_color: e.target.value }))} className="w-16 h-9 p-1 cursor-pointer" /><span className="text-sm text-muted-foreground">{form.badge_color}</span></div></div>
            <div className="flex items-center gap-3">
              <Switch checked={form.auto_assign} onCheckedChange={v => setForm(f => ({ ...f, auto_assign: v }))} />
              <Label>Auto-assign based on flight count</Label>
            </div>
            {form.auto_assign && (
              <div className="space-y-1.5"><Label>Minimum Flights Required</Label><Input type="number" value={form.min_flights} onChange={e => setForm(f => ({ ...f, min_flights: parseInt(e.target.value) || 0 }))} /></div>
            )}
            <Button className="w-full" onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending}>
              {editing ? 'Save Changes' : 'Create Rank'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}