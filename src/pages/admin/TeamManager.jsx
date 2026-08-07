import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';

export default function TeamManager() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', role: '', bio: '', photo_url: '', display_order: 0 });

  const { data: members = [], isLoading } = useQuery({
    queryKey: ['admin-team'],
    queryFn: () => base44.entities.TeamMember.list('display_order'),
  });

  const saveMutation = useMutation({
    mutationFn: (data) => editing
      ? base44.entities.TeamMember.update(editing.id, data)
      : base44.entities.TeamMember.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-team'] });
      setDialogOpen(false);
      resetForm();
      toast.success(editing ? 'Member updated' : 'Member added');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.TeamMember.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-team'] });
      toast.success('Member removed');
    },
  });

  const resetForm = () => {
    setEditing(null);
    setForm({ name: '', role: '', bio: '', photo_url: '', display_order: 0 });
  };

  const openEdit = (member) => {
    setEditing(member);
    setForm({ name: member.name, role: member.role, bio: member.bio || '', photo_url: member.photo_url || '', display_order: member.display_order || 0 });
    setDialogOpen(true);
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(f => ({ ...f, photo_url: file_url }));
    toast.success('Photo uploaded');
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-heading text-3xl font-bold text-foreground">Team Members</h1>
          <p className="text-muted-foreground mt-1">Manage your virtual airline staff.</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" />Add Member</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? 'Edit Member' : 'Add Member'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>Name</Label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <Label>Role</Label>
                <Input value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} />
              </div>
              <div>
                <Label>Bio</Label>
                <Textarea value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} />
              </div>
              <div>
                <Label>Photo</Label>
                <div className="flex items-center gap-3 mt-1">
                  {form.photo_url && <img src={form.photo_url} className="w-12 h-12 rounded-lg object-cover" alt="" />}
                  <label className="flex items-center gap-2 px-4 py-2 border border-input rounded-lg cursor-pointer hover:bg-muted text-sm">
                    <Upload className="w-4 h-4" /> Upload Photo
                    <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                  </label>
                </div>
              </div>
              <div>
                <Label>Display Order</Label>
                <Input type="number" value={form.display_order} onChange={e => setForm(f => ({ ...f, display_order: parseInt(e.target.value) || 0 }))} />
              </div>
              <Button className="w-full" onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending}>
                {saveMutation.isPending ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {members.map(member => (
            <Card key={member.id} className="p-4 flex items-start gap-4">
              {member.photo_url ? (
                <img src={member.photo_url} className="w-14 h-14 rounded-xl object-cover shrink-0" alt="" />
              ) : (
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="font-heading text-xl font-bold text-primary/40">{member.name?.charAt(0)}</span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground truncate">{member.name}</h3>
                <p className="text-sm text-secondary">{member.role}</p>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button variant="ghost" size="icon" onClick={() => openEdit(member)}>
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(member.id)}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}