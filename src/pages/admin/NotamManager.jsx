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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Bell, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

const emptyForm = { title: '', content: '', priority: 'medium', expires: '', active: true };

const priorityColors = {
  low: 'bg-blue-100 text-blue-700',
  medium: 'bg-amber-100 text-amber-700',
  high: 'bg-orange-100 text-orange-700',
  critical: 'bg-red-100 text-red-700',
};

export default function NotamManager() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const { data: notams = [], isLoading } = useQuery({
    queryKey: ['admin-notams'],
    queryFn: () => base44.entities.NOTAM.list('-created_date'),
  });

  const saveMutation = useMutation({
    mutationFn: (data) => editing
      ? base44.entities.NOTAM.update(editing.id, data)
      : base44.entities.NOTAM.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-notams'] });
      setDialogOpen(false);
      setForm(emptyForm);
      setEditing(null);
      toast.success(editing ? 'NOTAM updated' : 'NOTAM created');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.NOTAM.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-notams'] });
      toast.success('NOTAM deleted');
    },
  });

  const openEdit = (notam) => {
    setEditing(notam);
    setForm({
      title: notam.title || '',
      content: notam.content || '',
      priority: notam.priority || 'medium',
      expires: notam.expires || '',
      active: notam.active !== false,
    });
    setDialogOpen(true);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-heading text-3xl font-bold text-foreground">NOTAM Manager</h1>
          <p className="text-muted-foreground mt-1">Manage notices to pilots.</p>
        </div>
        <Button onClick={() => { setForm(emptyForm); setEditing(null); setDialogOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" />Add NOTAM
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      ) : notams.length === 0 ? (
        <div className="text-center py-16">
          <Bell className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">No NOTAMs published yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notams.map(notam => (
            <Card key={notam.id} className="px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${priorityColors[notam.priority]}`}>
                  {notam.priority === 'critical' || notam.priority === 'high' 
                    ? <AlertTriangle className="w-5 h-5" />
                    : <Bell className="w-5 h-5" />
                  }
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-foreground">{notam.title}</h3>
                    <Badge className={priorityColors[notam.priority]}>{notam.priority}</Badge>
                    {!notam.active && <Badge variant="secondary">Inactive</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-1">{notam.content}</p>
                </div>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" onClick={() => openEdit(notam)}>
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(notam.id)}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) { setEditing(null); setForm(emptyForm); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit NOTAM' : 'Create NOTAM'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>Title</Label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="NOTAM title" />
            </div>
            <div>
              <Label>Content</Label>
              <Textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} placeholder="NOTAM details..." rows={4} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Priority</Label>
                <Select value={form.priority} onValueChange={v => setForm(f => ({ ...f, priority: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Expires (optional)</Label>
                <Input type="date" value={form.expires} onChange={e => setForm(f => ({ ...f, expires: e.target.value }))} />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={form.active} onCheckedChange={v => setForm(f => ({ ...f, active: v }))} />
              <Label>Active (visible to pilots)</Label>
            </div>
            <Button className="w-full" onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? 'Saving...' : 'Save NOTAM'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}