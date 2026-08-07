import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Award, Plus, Trash2, Trophy, Star, Zap, Medal, Shield, Plane, Globe, Heart, Flame } from 'lucide-react';
import { toast } from 'sonner';

const iconOptions = ['Award', 'Trophy', 'Star', 'Zap', 'Medal', 'Shield', 'Plane', 'Globe', 'Heart', 'Flame'];
const iconMap = { Award, Trophy, Star, Zap, Medal, Shield, Plane, Globe, Heart, Flame };

const criteriaLabels = { manual: 'Manual Award', flights_count: 'Flight Count', rank: 'By Rank' };

const defaultBadge = { name: '', description: '', icon: 'Award', color: '#6b21a8', criteria_type: 'manual', criteria_value: '', active: true };

export default function BadgeManager() {
  const queryClient = useQueryClient();
  const [dialog, setDialog] = useState(false);
  const [form, setForm] = useState(defaultBadge);
  const [awardDialog, setAwardDialog] = useState(null); // badge object
  const [awardEmail, setAwardEmail] = useState('');
  const [awardNote, setAwardNote] = useState('');

  const { data: badges = [] } = useQuery({
    queryKey: ['admin-badges'],
    queryFn: () => base44.entities.PilotBadge.list('name'),
  });

  const { data: awards = [] } = useQuery({
    queryKey: ['admin-badge-awards'],
    queryFn: () => base44.entities.PilotBadgeAward.list('-created_date'),
  });

  const { data: roster = [] } = useQuery({
    queryKey: ['admin-roster-badges'],
    queryFn: () => base44.entities.PilotRoster.filter({ active: true }),
  });

  const createBadgeMutation = useMutation({
    mutationFn: (data) => base44.entities.PilotBadge.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-badges'] }); setDialog(false); toast.success('Badge created'); },
  });

  const updateBadgeMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.PilotBadge.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-badges'] }); setDialog(false); toast.success('Badge updated'); },
  });

  const deleteBadgeMutation = useMutation({
    mutationFn: (id) => base44.entities.PilotBadge.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-badges'] }); toast.success('Badge deleted'); },
  });

  const awardMutation = useMutation({
    mutationFn: (data) => base44.entities.PilotBadgeAward.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-badge-awards'] }); setAwardDialog(null); setAwardEmail(''); setAwardNote(''); toast.success('Badge awarded!'); },
  });

  const revokeAwardMutation = useMutation({
    mutationFn: (id) => base44.entities.PilotBadgeAward.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-badge-awards'] }); toast.success('Award revoked'); },
  });

  const handleOpen = (badge = null) => {
    setForm(badge ? { ...badge } : { ...defaultBadge });
    setDialog(badge ? 'edit' : 'create');
  };

  const handleSave = () => {
    if (dialog === 'edit' && form.id) {
      updateBadgeMutation.mutate({ id: form.id, data: form });
    } else {
      createBadgeMutation.mutate(form);
    }
  };

  const handleAward = () => {
    if (!awardEmail) { toast.error('Enter a pilot email'); return; }
    awardMutation.mutate({
      pilot_email: awardEmail,
      badge_id: awardDialog.id,
      badge_name: awardDialog.name,
      note: awardNote,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Pilot Badges</h1>
          <p className="text-muted-foreground text-sm mt-1">Create badges and award them to pilots</p>
        </div>
        <Button onClick={() => handleOpen()} className="bg-primary text-primary-foreground">
          <Plus className="w-4 h-4 mr-2" /> Create Badge
        </Button>
      </div>

      <Tabs defaultValue="badges">
        <TabsList>
          <TabsTrigger value="badges">Badges ({badges.length})</TabsTrigger>
          <TabsTrigger value="awards">Awards ({awards.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="badges" className="mt-4">
          {badges.length === 0 ? (
            <Card className="p-10 text-center">
              <Award className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground">No badges yet. Create one to get started.</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {badges.map(badge => {
                const IconComp = iconMap[badge.icon] || Award;
                return (
                  <Card key={badge.id} className={`p-4 ${!badge.active ? 'opacity-60' : ''}`}>
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{ backgroundColor: badge.color + '20' }}>
                        <IconComp className="w-6 h-6" style={{ color: badge.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground truncate">{badge.name}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{badge.description}</p>
                        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                          <Badge variant="outline" className="text-xs text-foreground">{criteriaLabels[badge.criteria_type]}</Badge>
                          {badge.criteria_value && <span className="text-xs text-muted-foreground">· {badge.criteria_value}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3 pt-3 border-t border-border">
                      <Button size="sm" variant="outline" className="flex-1 text-xs" onClick={() => setAwardDialog(badge)}>
                        Award
                      </Button>
                      <Button size="sm" variant="ghost" className="text-xs" onClick={() => handleOpen(badge)}>Edit</Button>
                      <Button size="sm" variant="ghost" onClick={() => deleteBadgeMutation.mutate(badge.id)}>
                        <Trash2 className="w-3.5 h-3.5 text-destructive" />
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="awards" className="mt-4">
          {awards.length === 0 ? (
            <Card className="p-10 text-center">
              <p className="text-muted-foreground">No awards issued yet.</p>
            </Card>
          ) : (
            <div className="space-y-2">
              {awards.map(award => {
                const badge = badges.find(b => b.id === award.badge_id);
                const IconComp = badge ? (iconMap[badge.icon] || Award) : Award;
                return (
                  <Card key={award.id} className="p-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: (badge?.color || '#6b21a8') + '20' }}>
                        <IconComp className="w-4 h-4" style={{ color: badge?.color || '#6b21a8' }} />
                      </div>
                      <div>
                        <p className="font-medium text-sm text-foreground">{award.badge_name}</p>
                        <p className="text-xs text-muted-foreground">{award.pilot_email}</p>
                        {award.note && <p className="text-xs text-muted-foreground italic">"{award.note}"</p>}
                      </div>
                    </div>
                    <Button size="icon" variant="ghost" onClick={() => revokeAwardMutation.mutate(award.id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Create/Edit Badge Dialog */}
      <Dialog open={!!dialog} onOpenChange={open => !open && setDialog(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{dialog === 'edit' ? 'Edit Badge' : 'Create Badge'}</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Badge Name *</label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Long Haul Veteran" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Description</label>
              <Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Awarded for completing 10 long haul flights" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Icon</label>
                <Select value={form.icon} onValueChange={v => setForm(f => ({ ...f, icon: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {iconOptions.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Color</label>
                <input type="color" value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} className="h-9 w-full rounded-md border border-input cursor-pointer" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Criteria</label>
                <Select value={form.criteria_type} onValueChange={v => setForm(f => ({ ...f, criteria_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Manual</SelectItem>
                    <SelectItem value="flights_count">Flight Count</SelectItem>
                    <SelectItem value="rank">By Rank</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {form.criteria_type !== 'manual' && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">
                    {form.criteria_type === 'flights_count' ? 'Min Flights' : 'Rank Name'}
                  </label>
                  <Input value={form.criteria_value} onChange={e => setForm(f => ({ ...f, criteria_value: e.target.value }))} placeholder={form.criteria_type === 'flights_count' ? '10' : 'Captain'} />
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.active} onCheckedChange={v => setForm(f => ({ ...f, active: v }))} />
              <span className="text-sm text-muted-foreground">Active</span>
            </div>

            {/* Preview */}
            {form.name && (
              <div className="flex items-center gap-3 p-3 bg-muted/40 rounded-xl">
                {(() => { const IC = iconMap[form.icon] || Award; return <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: form.color + '20' }}><IC className="w-5 h-5" style={{ color: form.color }} /></div>; })()}
                <div>
                  <p className="font-semibold text-sm text-foreground">{form.name}</p>
                  {form.description && <p className="text-xs text-muted-foreground">{form.description}</p>}
                </div>
              </div>
            )}

            <Button className="w-full" onClick={handleSave} disabled={!form.name || createBadgeMutation.isPending || updateBadgeMutation.isPending}>
              {dialog === 'edit' ? 'Save Changes' : 'Create Badge'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Award Dialog */}
      <Dialog open={!!awardDialog} onOpenChange={open => !open && setAwardDialog(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Award Badge: {awardDialog?.name}</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Pilot Email *</label>
              <Select value={awardEmail} onValueChange={setAwardEmail}>
                <SelectTrigger><SelectValue placeholder="Select a pilot…" /></SelectTrigger>
                <SelectContent>
                  {roster.map(p => (
                    <SelectItem key={p.id} value={p.pilot_email}>
                      {p.display_name || p.pilot_email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Award Note (optional)</label>
              <Input value={awardNote} onChange={e => setAwardNote(e.target.value)} placeholder="Great work on the Sydney–London leg!" />
            </div>
            <Button className="w-full" onClick={handleAward} disabled={!awardEmail || awardMutation.isPending}>
              Award Badge
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}