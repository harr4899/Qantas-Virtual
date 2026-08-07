import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, RotateCcw, Mail, Zap, Search } from 'lucide-react';
import { toast } from 'sonner';

export default function PilotAccess() {
  const queryClient = useQueryClient();
  const [email, setEmail] = useState('');
  const [search, setSearch] = useState('');

  const { data: pilots = [], isLoading } = useQuery({
    queryKey: ['admin-pilots'],
    queryFn: () => base44.entities.ApprovedPilot.list('-created_date'),
  });

  const fastPassMutation = useMutation({
    mutationFn: ({ id, fast_pass }) => base44.entities.ApprovedPilot.update(id, { fast_pass }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-pilots'] });
      toast.success('Fast Pass updated');
    },
  });

  const addMutation = useMutation({
    mutationFn: (email) => base44.entities.ApprovedPilot.create({ email, status: 'active' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-pilots'] });
      setEmail('');
      toast.success('Pilot access granted');
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.ApprovedPilot.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-pilots'] });
      toast.success('Access updated');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ApprovedPilot.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-pilots'] });
      toast.success('Pilot removed');
    },
  });

  const handleAdd = () => {
    if (!email.trim()) return;
    addMutation.mutate(email.trim());
  };

  const filteredPilots = pilots.filter(p => {
    if (!search) return true;
    return p.email?.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold text-foreground">Student Pilot Access</h1>
        <p className="text-muted-foreground mt-1">Manage which emails can access the pilot training portal.</p>
      </div>

      <Card className="p-6 mb-8">
        <h3 className="font-semibold text-foreground mb-4">Add Student Pilot Email</h3>
        <div className="flex gap-3">
          <Input
            placeholder="pilot@example.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            className="flex-1"
          />
          <Button onClick={handleAdd} disabled={addMutation.isPending}>
            <Plus className="w-4 h-4 mr-2" />Add
          </Button>
        </div>
      </Card>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9 max-w-md"
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      ) : filteredPilots.length === 0 ? (
        <div className="text-center py-16">
          {search ? (
            <>
              <Search className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground">No pilots match "{search}".</p>
            </>
          ) : (
            <>
              <Mail className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground">No pilots added yet.</p>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredPilots.map(pilot => (
            <Card key={pilot.id} className="px-5 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span className="text-foreground font-medium">{pilot.email}</span>
                <Badge variant={pilot.status === 'active' ? 'default' : 'secondary'}>
                  {pilot.status}
                </Badge>
              </div>
              <div className="flex gap-1 items-center">
                <Button
                  variant={pilot.fast_pass ? 'default' : 'outline'}
                  size="sm"
                  className={pilot.fast_pass ? 'bg-amber-500 hover:bg-amber-600 text-white border-0' : ''}
                  onClick={() => fastPassMutation.mutate({ id: pilot.id, fast_pass: !pilot.fast_pass })}
                  title="Fast Pass: skip training and go straight to Pilot Portal"
                >
                  <Zap className="w-4 h-4 mr-1" />
                  {pilot.fast_pass ? 'Fast Pass ON' : 'Fast Pass'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleMutation.mutate({
                    id: pilot.id,
                    status: pilot.status === 'active' ? 'revoked' : 'active'
                  })}
                >
                  <RotateCcw className="w-4 h-4 mr-1" />
                  {pilot.status === 'active' ? 'Revoke' : 'Restore'}
                </Button>
                <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(pilot.id)}>
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