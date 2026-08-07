import React, { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash2, Pencil, MapPin, Upload, ImageIcon, MousePointer } from 'lucide-react';
import { toast } from 'sonner';

const EMPTY = { name: '', description: '', x: 50, y: 50, type: 'destination', active: true };
const typeColors = { hub: 'bg-purple-100 text-purple-700', destination: 'bg-sky-100 text-sky-700', waypoint: 'bg-amber-100 text-amber-700' };

export default function MapManager() {
  const queryClient = useQueryClient();
  const { settings, save: saveSetting } = useSiteSettings();
  const [dialog, setDialog] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [placingPin, setPlacingPin] = useState(false);
  const [uploadingMap, setUploadingMap] = useState(false);
  const mapRef = useRef(null);
  const fileInputRef = useRef(null);

  const mapImageUrl = settings.map_image_url || null;

  const { data: locations = [], isLoading } = useQuery({
    queryKey: ['map-locations'],
    queryFn: () => base44.entities.MapLocation.list('-created_date'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.MapLocation.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['map-locations'] }); toast.success('Location added'); closeDialog(); },
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.MapLocation.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['map-locations'] }); toast.success('Location updated'); closeDialog(); },
  });
  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.MapLocation.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['map-locations'] }); toast.success('Location removed'); },
  });

  const openAdd = () => { setForm(EMPTY); setEditing(null); setDialog(true); };
  const openEdit = (loc) => { setForm({ ...loc }); setEditing(loc); setDialog(true); };
  const closeDialog = () => { setDialog(false); setEditing(null); setForm(EMPTY); setPlacingPin(false); };

  const handleSave = () => {
    if (!form.name.trim()) { toast.error('Please enter a location name.'); return; }
    const data = { ...form, x: parseFloat(form.x), y: parseFloat(form.y) };
    if (editing) updateMutation.mutate({ id: editing.id, data });
    else createMutation.mutate(data);
  };

  // Upload map background image
  const handleMapUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingMap(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    await saveSetting('map_image_url', file_url);
    setUploadingMap(false);
    toast.success('Map image uploaded!');
  };

  // Click on the map preview to set pin position
  const handleMapClick = (e) => {
    if (!placingPin) return;
    const rect = mapRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setForm(f => ({ ...f, x: parseFloat(x.toFixed(2)), y: parseFloat(y.toFixed(2)) }));
    setPlacingPin(false);
    toast.success('Pin position set! Fill in the details and save.');
    setDialog(true);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-heading text-3xl font-bold text-foreground">Map Manager</h1>
          <p className="text-muted-foreground mt-1">Upload a fictional map image and place destination pins on it.</p>
        </div>
        <Button onClick={openAdd}><Plus className="w-4 h-4 mr-2" />Add Location</Button>
      </div>

      {/* Map Image Upload */}
      <Card className="p-6 mb-6">
        <div className="flex items-start justify-between gap-6">
          <div>
            <h2 className="font-semibold text-foreground mb-1 flex items-center gap-2"><ImageIcon className="w-4 h-4" />Map Background Image</h2>
            <p className="text-sm text-muted-foreground">Upload your fictional world/route map image. PNG or JPG recommended (16:9 ratio works best).</p>
          </div>
          <div className="flex gap-2 shrink-0">
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleMapUpload} />
            <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={uploadingMap}>
              {uploadingMap ? <><div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />Uploading...</> : <><Upload className="w-4 h-4 mr-2" />{mapImageUrl ? 'Replace Image' : 'Upload Image'}</>}
            </Button>
          </div>
        </div>

        {mapImageUrl && (
          <div className="mt-4 relative">
            <div
              ref={mapRef}
              className={`relative rounded-xl overflow-hidden border border-border ${placingPin ? 'cursor-crosshair ring-2 ring-primary' : 'cursor-default'}`}
              style={{ aspectRatio: '16/9' }}
              onClick={handleMapClick}
            >
              <img src={mapImageUrl} alt="Map" className="w-full h-full object-cover" draggable={false} />
              {/* Existing pins */}
              {locations.map(loc => (
                <div
                  key={loc.id}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ left: `${loc.x}%`, top: `${loc.y}%` }}
                >
                  <MapPin className={`w-6 h-6 ${loc.type === 'hub' ? 'text-purple-600' : loc.type === 'waypoint' ? 'text-amber-500' : 'text-sky-500'} drop-shadow`} fill="white" strokeWidth={1.5} />
                </div>
              ))}
              {placingPin && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                  <div className="bg-background rounded-xl px-5 py-3 shadow-xl text-sm font-medium flex items-center gap-2">
                    <MousePointer className="w-4 h-4 text-primary" /> Click anywhere on the map to place the pin
                  </div>
                </div>
              )}
            </div>
            <div className="mt-3 flex gap-2">
              <Button
                variant={placingPin ? 'destructive' : 'outline'}
                size="sm"
                onClick={() => { if (placingPin) { setPlacingPin(false); } else { setForm(EMPTY); setEditing(null); setPlacingPin(true); } }}
              >
                <MousePointer className="w-4 h-4 mr-2" />
                {placingPin ? 'Cancel Pin Placement' : 'Click Map to Place New Pin'}
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Locations list */}
      {isLoading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>
      ) : locations.length === 0 ? (
        <div className="text-center py-16"><MapPin className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" /><p className="text-muted-foreground">No locations yet. Upload a map and click to place pins.</p></div>
      ) : (
        <div className="space-y-2">
          {locations.map(loc => (
            <Card key={loc.id} className="px-5 py-3 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="font-semibold text-foreground">{loc.name}</p>
                  {loc.description && <p className="text-xs text-muted-foreground">{loc.description}</p>}
                </div>
                <Badge className={typeColors[loc.type] || ''}>{loc.type}</Badge>
                <span className="text-xs text-muted-foreground">({loc.x?.toFixed(1)}%, {loc.y?.toFixed(1)}%)</span>
                {!loc.active && <Badge variant="secondary">Hidden</Badge>}
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" onClick={() => openEdit(loc)}><Pencil className="w-4 h-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(loc.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialog} onOpenChange={(o) => !o && closeDialog()}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'Edit Location' : 'Add Map Location'}</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-1.5"><Label>Name *</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Capital City" /></div>
            <div className="space-y-1.5"><Label>Description</Label><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Short popup description..." rows={2} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>X Position (%)</Label>
                <Input type="number" min="0" max="100" step="0.1" value={form.x} onChange={e => setForm(f => ({ ...f, x: parseFloat(e.target.value) }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Y Position (%)</Label>
                <Input type="number" min="0" max="100" step="0.1" value={form.y} onChange={e => setForm(f => ({ ...f, y: parseFloat(e.target.value) }))} />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Tip: Use the "Click Map to Place Pin" button on the map above for easy positioning.</p>
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="hub">Hub</SelectItem>
                  <SelectItem value="destination">Destination</SelectItem>
                  <SelectItem value="waypoint">Waypoint</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={form.active} onCheckedChange={v => setForm(f => ({ ...f, active: v }))} />
              <Label>Show on map</Label>
            </div>
            <Button className="w-full" onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending}>
              {editing ? 'Save Changes' : 'Add Location'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}