import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Trash2, Pencil, MapPin, Upload, FileText, X } from 'lucide-react';
import { toast } from 'sonner';
import BulkActionBar from '@/components/admin/BulkActionBar';
import { Checkbox } from '@/components/ui/checkbox';

const empty = { icao: '', iata: '', name: '', city: '', country: '', type: 'destination', active: true, charts: [] };

const typeColors = {
  hub: 'bg-primary/10 text-primary border-primary/30',
  destination: 'bg-blue-100 text-blue-800 border-blue-200',
  focus_city: 'bg-amber-100 text-amber-800 border-amber-200',
};

const CHART_CATEGORIES = ['SID', 'STAR', 'APP', 'GROUND', 'TAXI', 'OTHER'];

export default function AirportManager() {
  const queryClient = useQueryClient();
  const [dialog, setDialog] = useState(null); // null | 'create' | 'edit'
  const [form, setForm] = useState(empty);
  const [uploadingChart, setUploadingChart] = useState(false);
  const [newChartName, setNewChartName] = useState('');
  const [newChartCategory, setNewChartCategory] = useState('APP');
  const [selectedIds, setSelectedIds] = useState(new Set());

  const { data: airports = [], isLoading } = useQuery({
    queryKey: ['admin-airports'],
    queryFn: () => base44.entities.Airport.list('icao'),
  });

  const createMutation = useMutation({
    mutationFn: (d) => base44.entities.Airport.create(d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-airports'] }); setDialog(null); toast.success('Airport added'); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Airport.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-airports'] }); setDialog(null); toast.success('Airport updated'); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Airport.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-airports'] }); toast.success('Airport removed'); },
  });

  const toggleSelect = (id) => setSelectedIds(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const toggleSelectAll = () => setSelectedIds(prev => prev.size === airports.length ? new Set() : new Set(airports.map(a => a.id)));
  const bulkEditFields = [
    { key: 'active', label: 'Active Status', type: 'boolean' },
    { key: 'type', label: 'Airport Type', type: 'select', options: [
      { value: 'hub', label: 'Hub' }, { value: 'destination', label: 'Destination' }, { value: 'focus_city', label: 'Focus City' }
    ]},
  ];
  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids) => { await Promise.all(ids.map(id => base44.entities.Airport.delete(id))); return ids.length; },
    onSuccess: (count) => { queryClient.invalidateQueries({ queryKey: ['admin-airports'] }); setSelectedIds(new Set()); toast.success(`${count} airports removed`); },
  });
  const bulkUpdateMutation = useMutation({
    mutationFn: async ({ ids, field, value }) => { await base44.entities.Airport.bulkUpdate(ids.map(id => ({ id, [field]: value }))); return ids.length; },
    onSuccess: (count) => { queryClient.invalidateQueries({ queryKey: ['admin-airports'] }); setSelectedIds(new Set()); toast.success(`${count} airports updated`); },
  });

  const openCreate = () => { setForm({ ...empty, charts: [] }); setDialog('create'); };
  const openEdit = (a) => { setForm({ ...a, charts: a.charts || [] }); setDialog('edit'); };

  const handleSave = () => {
    if (!form.icao || !form.name) { toast.error('ICAO and name are required'); return; }
    const data = { ...form, icao: form.icao.toUpperCase(), iata: form.iata?.toUpperCase() };
    if (dialog === 'edit' && form.id) updateMutation.mutate({ id: form.id, data });
    else createMutation.mutate(data);
  };

  const handleChartUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const name = newChartName.trim() || file.name.replace(/\.[^.]+$/, '');
    setUploadingChart(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    const chart = { name, url: file_url, category: newChartCategory };
    setForm(f => ({ ...f, charts: [...(f.charts || []), chart] }));
    setNewChartName('');
    setUploadingChart(false);
    toast.success('Chart uploaded!');
    // reset file input
    e.target.value = '';
  };

  const removeChart = (idx) => {
    setForm(f => ({ ...f, charts: f.charts.filter((_, i) => i !== idx) }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Airport Manager</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage airports and upload charts for pilots</p>
        </div>
        <Button onClick={openCreate} className="bg-primary text-primary-foreground">
          <Plus className="w-4 h-4 mr-2" /> Add Airport
        </Button>
      </div>

      <BulkActionBar
        selectedCount={selectedIds.size}
        onClear={() => setSelectedIds(new Set())}
        onDelete={() => bulkDeleteMutation.mutate(Array.from(selectedIds))}
        onBulkEdit={(field, value) => bulkUpdateMutation.mutate({ ids: Array.from(selectedIds), field, value })}
        editFields={bulkEditFields}
      />
      <div className="grid gap-2">
        {isLoading ? (
          <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>
        ) : airports.length === 0 ? (
          <Card className="p-10 text-center">
            <MapPin className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">No airports yet. Add your first airport.</p>
          </Card>
        ) : (
          <>
          <div className="flex items-center gap-3 px-1 pb-1">
            <Checkbox checked={selectedIds.size === airports.length && airports.length > 0} onCheckedChange={toggleSelectAll} />
            <span className="text-sm text-muted-foreground">Select all ({airports.length})</span>
          </div>
          {airports.map(a => (
          <Card key={a.id} className={`p-4 flex items-center justify-between gap-4 ${!a.active ? 'opacity-50' : ''} ${selectedIds.has(a.id) ? 'ring-2 ring-primary' : ''}`}>
            <div className="flex items-center gap-3">
              <Checkbox checked={selectedIds.has(a.id)} onCheckedChange={() => toggleSelect(a.id)} className="shrink-0" />
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <MapPin className="w-4 h-4 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-heading font-bold text-foreground">{a.icao}</span>
                  {a.iata && <span className="text-xs text-muted-foreground">({a.iata})</span>}
                  <Badge className={`text-xs ${typeColors[a.type]}`}>{a.type}</Badge>
                  {!a.active && <Badge variant="outline" className="text-xs text-muted-foreground">Inactive</Badge>}
                  {a.charts?.length > 0 && (
                    <Badge variant="outline" className="text-xs text-foreground">
                      <FileText className="w-3 h-3 mr-1" />{a.charts.length} chart{a.charts.length !== 1 ? 's' : ''}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-foreground">{a.name}</p>
                {(a.city || a.country) && <p className="text-xs text-muted-foreground">{[a.city, a.country].filter(Boolean).join(', ')}</p>}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button variant="ghost" size="icon" onClick={() => openEdit(a)}><Pencil className="w-4 h-4 text-muted-foreground" /></Button>
              <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(a.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
            </div>
          </Card>
          ))}
          </>
        )}
      </div>

      <Dialog open={!!dialog} onOpenChange={o => !o && setDialog(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{dialog === 'edit' ? 'Edit Airport' : 'Add Airport'}</DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="details" className="mt-2">
            <TabsList className="w-full">
              <TabsTrigger value="details" className="flex-1">Details</TabsTrigger>
              <TabsTrigger value="charts" className="flex-1">
                Charts {form.charts?.length > 0 && `(${form.charts.length})`}
              </TabsTrigger>
            </TabsList>

            {/* Details tab */}
            <TabsContent value="details" className="space-y-3 mt-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">ICAO Code *</label>
                  <Input value={form.icao} onChange={e => setForm(f => ({ ...f, icao: e.target.value.toUpperCase() }))} placeholder="YSSY" className="uppercase" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">IATA Code</label>
                  <Input value={form.iata || ''} onChange={e => setForm(f => ({ ...f, iata: e.target.value.toUpperCase() }))} placeholder="SYD" className="uppercase" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Airport Name *</label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Sydney Kingsford Smith" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">City</label>
                  <Input value={form.city || ''} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} placeholder="Sydney" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Country</label>
                  <Input value={form.country || ''} onChange={e => setForm(f => ({ ...f, country: e.target.value }))} placeholder="Australia" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Type</label>
                <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hub">Hub</SelectItem>
                    <SelectItem value="destination">Destination</SelectItem>
                    <SelectItem value="focus_city">Focus City</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-3 pt-1">
                <Switch checked={form.active} onCheckedChange={v => setForm(f => ({ ...f, active: v }))} />
                <span className="text-sm text-muted-foreground">Active (visible in routes & bookings)</span>
              </div>
            </TabsContent>

            {/* Charts tab */}
            <TabsContent value="charts" className="space-y-4 mt-4">
              <p className="text-sm text-muted-foreground">Upload airport charts (SIDs, STARs, approach plates, ground charts) for pilots to view in the portal.</p>

              {/* Existing charts */}
              {form.charts?.length > 0 && (
                <div className="space-y-2">
                  {form.charts.map((chart, i) => (
                    <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg border border-border bg-muted/20">
                      <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{chart.name}</p>
                        {chart.category && <p className="text-xs text-muted-foreground">{chart.category}</p>}
                      </div>
                      <a href={chart.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline shrink-0">View</a>
                      <button type="button" onClick={() => removeChart(i)} className="text-muted-foreground hover:text-destructive shrink-0">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Upload new chart */}
              <div className="space-y-3 p-3 rounded-xl border border-dashed border-border bg-muted/20">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Upload New Chart</p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Chart Name</label>
                    <Input value={newChartName} onChange={e => setNewChartName(e.target.value)} placeholder="e.g. ILS RWY 34L" className="h-8 text-sm" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Category</label>
                    <Select value={newChartCategory} onValueChange={setNewChartCategory}>
                      <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {CHART_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <label className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border border-dashed border-border cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all ${uploadingChart ? 'opacity-60 pointer-events-none' : ''}`}>
                  <Upload className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="text-sm text-muted-foreground">{uploadingChart ? 'Uploading…' : 'Click to upload chart file (PDF, image)'}</span>
                  <input type="file" accept=".pdf,.png,.jpg,.jpeg,.webp" className="hidden" onChange={handleChartUpload} disabled={uploadingChart} />
                </label>
              </div>
            </TabsContent>
          </Tabs>

          <Button className="w-full mt-4" onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending}>
            {(createMutation.isPending || updateMutation.isPending) ? 'Saving...' : 'Save Airport'}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}