import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Plus, Trash2, Shield, Mail } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminAccessManager() {
  const queryClient = useQueryClient();
  const [email, setEmail] = useState('');
  const [label, setLabel] = useState('');

  const { data: admins = [], isLoading } = useQuery({
    queryKey: ['admin-access-list'],
    queryFn: () => base44.entities.AdminAccess.list('-created_date'),
  });

  const addMutation = useMutation({
    mutationFn: (data) => base44.entities.AdminAccess.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-access-list'] });
      setEmail('');
      setLabel('');
      toast.success('Admin access granted');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.AdminAccess.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-access-list'] });
      toast.success('Admin access revoked');
    },
  });

  const handleAdd = () => {
    if (!email.trim()) return;
    addMutation.mutate({ email: email.trim(), label: label.trim() });
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold text-foreground">Admin Access</h1>
        <p className="text-muted-foreground mt-1">Control who can access the admin panel. Only you (the owner) can see this page.</p>
      </div>

      <Card className="p-6 mb-8 border-primary/20 bg-primary/5">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">Grant Admin Access</h3>
        </div>
        <div className="flex gap-3">
          <Input
            placeholder="Email address"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            className="flex-1"
          />
          <Input
            placeholder="Label (optional)"
            value={label}
            onChange={e => setLabel(e.target.value)}
            className="w-48"
          />
          <Button onClick={handleAdd} disabled={addMutation.isPending}>
            <Plus className="w-4 h-4 mr-2" />Add
          </Button>
        </div>
      </Card>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      ) : admins.length === 0 ? (
        <div className="text-center py-16">
          <Shield className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">No admins added yet. Add emails above to grant access.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {admins.map(admin => (
            <Card key={admin.id} className="px-5 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <div>
                  <span className="text-foreground font-medium">{admin.email}</span>
                  {admin.label && <span className="text-muted-foreground text-sm ml-2">— {admin.label}</span>}
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(admin.id)}>
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
