import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Trash2, Pencil, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';

const EMPTY = { label: '', value: '', icon: 'Globe', order: 0 };
const ICON_OPTIONS = ['Globe', 'Plane', 'Users', 'Star', 'TrendingUp', 'Award', 'Map', 'CheckCircle', 'Clock', 'Shield'];

export default function HomeStatsManager() {
  const queryClient = useQueryClient();
  const [dialog, setDialog] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);

  const { data: stats = [], isLoading } = useQuery({
    queryKey: ['home-stats'],
    queryFn: () => base44.entities.HomeStats.list('order'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.HomeStats.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['home-stats'] }); toast.success('Stat added'); closeDialog(); },
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.HomeStats.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['home-stats'] }); toast.success('Stat updated'); closeDialog(); },
  });
  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.HomeStats.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['home-stats'] }); toast.success('Stat removed'); },
  });

  const openAdd = () => { setForm(EMPTY); setEditing(null); setDialog(true); };
  const openEdit = (s) => { setForm({ ...s }); setEditing(s); setDialog(true); };
  const closeDialog = () => { setDialog(false); setEditing(null); setForm(EMPTY); };
  const handleSave = () => {
    if (editing) updateMutation.mutate({ id: editing.id, data: form });
    else createMutation.mutate(form);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-heading text-3xl font-bold text-foreground">Home Page Stats</h1>
          <p className="text-muted-foreground mt-1">Customize the statistics shown on the public homepage.</p>
        </div>
        <Button onClick={openAdd}><Plus className="w-4 h-4 mr-2" />Add Stat</Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>
      ) : stats.length === 0 ? (
        <div className="text-center py-16"><BarChart3 className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" /><p className="text-muted-foreground">No stats configured yet.</p></div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map(stat => (
            <Card key={stat.id} className="p-4 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{stat.label}</span>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openEdit(stat)}><Pencil className="w-3 h-3" /></Button>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => deleteMutation.mutate(stat.id)}><Trash2 className="w-3 h-3 text-destructive" /></Button>
                </div>
              </div>
              <p className="font-heading text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground">Icon: {stat.icon}</p>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialog} onOpenChange={(o) => !o && closeDialog()}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'Edit Stat' : 'Add Stat'}</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-1.5"><Label>Label *</Label><Input value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))} placeholder="e.g. Total Flights" /></div>
            <div className="space-y-1.5"><Label>Value *</Label><Input value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))} placeholder="e.g. 1,200+" /></div>
            <div className="space-y-1.5">
              <Label>Icon</Label>
              <select className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm" value={form.icon} onChange={e => setForm(f => ({ ...f, icon: e.target.value }))}>
                {ICON_OPTIONS.map(i => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>
            <div className="space-y-1.5"><Label>Display Order</Label><Input type="number" value={form.order} onChange={e => setForm(f => ({ ...f, order: parseInt(e.target.value) || 0 }))} /></div>
            <Button className="w-full" onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending}>
              {editing ? 'Save Changes' : 'Add Stat'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}