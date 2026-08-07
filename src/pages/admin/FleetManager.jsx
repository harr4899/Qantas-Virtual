import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Pencil, Trash2, Plane } from 'lucide-react';
import { toast } from 'sonner';
import ImageUploader from '../../components/admin/ImageUploader';
import BulkActionBar from '@/components/admin/BulkActionBar';
import { Checkbox } from '@/components/ui/checkbox';
import { useSiteSettings } from '@/hooks/useSiteSettings';

const EMPTY = {
  name: '', icao_code: '', registration: '', image_url: '', description: '',
  range_nm: '', cruise_speed_kts: '', capacity: '', engines: '', active: true, display_order: 0,
  section: 1,
};

export default function FleetManager() {
  const queryClient = useQueryClient();
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const { settings, save: saveSetting, isSaving: isSavingSetting } = useSiteSettings();
  const [pageForm, setPageForm] = useState({ fleet_badge: '', fleet_heading: '', fleet_subtext: '', fleet_section_1_name: '', fleet_section_2_name: '' });
  const [pageFormReady, setPageFormReady] = useState(false);

  React.useEffect(() => {
    if (!pageFormReady && settings.fleet_heading !== undefined) {
      setPageForm({
        fleet_badge: settings.fleet_badge || 'Our Fleet',
        fleet_heading: settings.fleet_heading || 'Fleet Showcase',
        fleet_subtext: settings.fleet_subtext || 'Explore the aircraft that make up our virtual airline fleet.',
        fleet_section_1_name: settings.fleet_section_1_name || 'Section 1',
        fleet_section_2_name: settings.fleet_section_2_name || 'Section 2',
      });
      setPageFormReady(true);
    }
  }, [settings, pageFormReady]);

  const { data: aircraft = [], isLoading } = useQuery({
    queryKey: ['fleet-admin'],
    queryFn: () => base44.entities.FleetAircraft.list('display_order'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.FleetAircraft.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['fleet-admin'] }); setEditTarget(null); toast.success('Aircraft added'); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.FleetAircraft.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['fleet-admin'] }); setEditTarget(null); toast.success('Aircraft updated'); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.FleetAircraft.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['fleet-admin'] }); toast.success('Aircraft removed'); },
  });

  const toggleSelect = (id) => setSelectedIds(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const toggleSelectAll = () => setSelectedIds(prev => prev.size === aircraft.length ? new Set() : new Set(aircraft.map(a => a.id)));
  const bulkEditFields = [
    { key: 'active', label: 'Active Status', type: 'boolean' },
    { key: 'display_order', label: 'Display Order', type: 'number' },
    { key: 'engines', label: 'Engines', type: 'text' },
    { key: 'section', label: 'Showcase Section', type: 'select', options: [
      { value: '1', label: 'Section 1' }, { value: '2', label: 'Section 2' }
    ] },
  ];
  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids) => { await Promise.all(ids.map(id => base44.entities.FleetAircraft.delete(id))); return ids.length; },
    onSuccess: (count) => { queryClient.invalidateQueries({ queryKey: ['fleet-admin'] }); setSelectedIds(new Set()); toast.success(`${count} aircraft removed`); },
  });
  const bulkUpdateMutation = useMutation({
    mutationFn: async ({ ids, field, value }) => { await base44.entities.FleetAircraft.bulkUpdate(ids.map(id => ({ id, [field]: value }))); return ids.length; },
    onSuccess: (count) => { queryClient.invalidateQueries({ queryKey: ['fleet-admin'] }); setSelectedIds(new Set()); toast.success(`${count} aircraft updated`); },
  });

  const openNew = () => { setForm(EMPTY); setEditTarget('new'); };
  const openEdit = (ac) => { setForm({ ...ac, range_nm: ac.range_nm || '', cruise_speed_kts: ac.cruise_speed_kts || '', capacity: ac.capacity || '', section: ac.section || 1 }); setEditTarget(ac.id); };

  const handleSave = () => {
    const data = {
      ...form,
      range_nm: form.range_nm ? Number(form.range_nm) : 0,
      cruise_speed_kts: form.cruise_speed_kts ? Number(form.cruise_speed_kts) : 0,
      capacity: form.capacity ? Number(form.capacity) : 0,
      display_order: Number(form.display_order) || 0,
      section: Number(form.section) || 1,
    };
    if (editTarget === 'new') createMutation.mutate(data);
    else updateMutation.mutate({ id: editTarget, data });
  };

  const savePageSettings = async () => {
    await saveSetting('fleet_badge', pageForm.fleet_badge);
    await saveSetting('fleet_heading', pageForm.fleet_heading);
    await saveSetting('fleet_subtext', pageForm.fleet_subtext);
    await saveSetting('fleet_section_1_name', pageForm.fleet_section_1_name);
    await saveSetting('fleet_section_2_name', pageForm.fleet_section_2_name);
    toast.success('Page settings saved');
  };

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-heading text-3xl font-bold text-foreground">Fleet Manager</h1>
          <p className="text-muted-foreground mt-1">Manage the aircraft shown on the public Fleet page.</p>
        </div>
        <Button onClick={openNew}><Plus className="w-4 h-4 mr-2" />Add Aircraft</Button>
      </div>

      {/* Page text settings */}
      <Card className="p-5 mb-8 space-y-4">
        <h3 className="font-semibold text-foreground">Fleet Page Text</h3>
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label>Badge</Label>
            <Input value={pageForm.fleet_badge} onChange={e => setPageForm(f => ({ ...f, fleet_badge: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label>Heading</Label>
            <Input value={pageForm.fleet_heading} onChange={e => setPageForm(f => ({ ...f, fleet_heading: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label>Subtext</Label>
            <Input value={pageForm.fleet_subtext} onChange={e => setPageForm(f => ({ ...f, fleet_subtext: e.target.value }))} />
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Section 1 Name</Label>
            <Input value={pageForm.fleet_section_1_name} onChange={e => setPageForm(f => ({ ...f, fleet_section_1_name: e.target.value }))} placeholder="Section 1" />
          </div>
          <div className="space-y-1.5">
            <Label>Section 2 Name</Label>
            <Input value={pageForm.fleet_section_2_name} onChange={e => setPageForm(f => ({ ...f, fleet_section_2_name: e.target.value }))} placeholder="Section 2" />
          </div>
        </div>
        <Button size="sm" onClick={savePageSettings} disabled={isSavingSetting}>Save Page Text</Button>
      </Card>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      ) : aircraft.length === 0 ? (
        <Card className="p-12 text-center">
          <Plane className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">No aircraft yet. Add your first one!</p>
        </Card>
      ) : (
        <>
        <BulkActionBar
          selectedCount={selectedIds.size}
          onClear={() => setSelectedIds(new Set())}
          onDelete={() => bulkDeleteMutation.mutate(Array.from(selectedIds))}
          onBulkEdit={(field, value) => bulkUpdateMutation.mutate({ ids: Array.from(selectedIds), field, value })}
          editFields={bulkEditFields}
        />
        <div className="flex items-center gap-3 mb-3 px-1">
          <Checkbox checked={selectedIds.size === aircraft.length && aircraft.length > 0} onCheckedChange={toggleSelectAll} />
          <span className="text-sm text-muted-foreground">Select all ({aircraft.length})</span>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {aircraft.map(ac => (
            <Card key={ac.id} className={`overflow-hidden relative ${selectedIds.has(ac.id) ? 'ring-2 ring-primary' : ''}`}>
              <div className="absolute top-2 left-2 z-10">
                <Checkbox checked={selectedIds.has(ac.id)} onCheckedChange={() => toggleSelect(ac.id)} />
              </div>
              {ac.image_url ? (
                <img src={ac.image_url} alt={ac.name} className="w-full h-36 object-cover" />
              ) : (
                <div className="h-36 bg-muted flex items-center justify-center">
                  <Plane className="w-10 h-10 text-muted-foreground/30" />
                </div>
              )}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-foreground text-sm">{ac.name}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {ac.icao_code && <Badge variant="outline" className="text-xs">{ac.icao_code}</Badge>}
                      {ac.registration && <Badge variant="outline" className="text-xs">{ac.registration}</Badge>}
                      {!ac.active && <Badge variant="secondary" className="text-xs">Inactive</Badge>}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => openEdit(ac)}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="w-7 h-7 text-destructive" onClick={() => deleteMutation.mutate(ac.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
        </>
      )}

      <Dialog open={!!editTarget} onOpenChange={open => { if (!open) setEditTarget(null); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editTarget === 'new' ? 'Add Aircraft' : 'Edit Aircraft'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1.5">
                <Label>Aircraft Name *</Label>
                <Input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Boeing 787-9 Dreamliner" />
              </div>
              <div className="space-y-1.5">
                <Label>ICAO Type Code</Label>
                <Input value={form.icao_code} onChange={e => set('icao_code', e.target.value.toUpperCase())} placeholder="B789" />
              </div>
              <div className="space-y-1.5">
                <Label>Registration</Label>
                <Input value={form.registration} onChange={e => set('registration', e.target.value.toUpperCase())} placeholder="VH-ZNA" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={e => set('description', e.target.value)} rows={2} placeholder="Brief description..." />
            </div>
            <div className="space-y-1.5">
              <Label>Photo</Label>
              <ImageUploader value={form.image_url} onChange={v => set('image_url', v)} />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label>Range (NM)</Label>
                <Input type="number" value={form.range_nm} onChange={e => set('range_nm', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Cruise Speed (kts)</Label>
                <Input type="number" value={form.cruise_speed_kts} onChange={e => set('cruise_speed_kts', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Capacity</Label>
                <Input type="number" value={form.capacity} onChange={e => set('capacity', e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Engines</Label>
              <Input value={form.engines} onChange={e => set('engines', e.target.value)} placeholder="2x GE GEnx-1B" />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label>Display Order</Label>
                <Input type="number" value={form.display_order} onChange={e => set('display_order', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Section</Label>
                <Select value={String(form.section || 1)} onValueChange={v => set('section', Number(v))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Section 1</SelectItem>
                    <SelectItem value="2">Section 2</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-3 pt-6">
                <Switch checked={form.active} onCheckedChange={v => set('active', v)} id="ac-active" />
                <Label htmlFor="ac-active">Active</Label>
              </div>
            </div>
            <Button className="w-full" onClick={handleSave} disabled={!form.name || createMutation.isPending || updateMutation.isPending}>
              {editTarget === 'new' ? 'Add Aircraft' : 'Save Changes'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}