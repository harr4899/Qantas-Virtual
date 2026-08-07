import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Pencil, X, Check } from 'lucide-react';

export default function BulkActionBar({ selectedCount, onClear, onDelete, onBulkEdit, editFields }) {
  const [editOpen, setEditOpen] = useState(false);
  const [editField, setEditField] = useState('');
  const [editValue, setEditValue] = useState('');

  if (selectedCount === 0) return null;

  const currentField = editFields?.find(f => f.key === editField);
  const isBoolean = currentField?.type === 'boolean';

  const handleApply = () => {
    let parsed = editValue;
    if (isBoolean) parsed = editValue === true || editValue === 'true';
    if (currentField?.type === 'number') parsed = Number(editValue);
    onBulkEdit(editField, parsed);
    setEditOpen(false);
    setEditField('');
    setEditValue('');
  };

  const handleFieldChange = (v) => {
    setEditField(v);
    const field = editFields?.find(f => f.key === v);
    setEditValue(field?.type === 'boolean' ? false : '');
  };

  return (
    <>
      <div className="flex items-center justify-between gap-3 p-3 rounded-xl border border-primary/30 bg-primary/5 mb-4">
        <div className="flex items-center gap-2">
          <Badge className="bg-primary text-primary-foreground">{selectedCount} selected</Badge>
          <Button variant="ghost" size="sm" onClick={onClear} className="text-xs h-7">
            <X className="w-3 h-3 mr-1" /> Clear
          </Button>
        </div>
        <div className="flex items-center gap-2">
          {editFields && editFields.length > 0 && (
            <Button variant="outline" size="sm" onClick={() => setEditOpen(true)} className="text-xs h-7">
              <Pencil className="w-3 h-3 mr-1" /> Bulk Edit
            </Button>
          )}
          <Button variant="destructive" size="sm" onClick={onDelete} className="text-xs h-7">
            <Trash2 className="w-3 h-3 mr-1" /> Delete Selected
          </Button>
        </div>
      </div>

      {editFields && (
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Bulk Edit {selectedCount} items</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Field to edit</label>
                <Select value={editField} onValueChange={handleFieldChange}>
                  <SelectTrigger><SelectValue placeholder="Select field..." /></SelectTrigger>
                  <SelectContent>
                    {editFields.map(f => <SelectItem key={f.key} value={f.key}>{f.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {currentField && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">New value</label>
                  {currentField.type === 'select' ? (
                    <Select value={String(editValue)} onValueChange={setEditValue}>
                      <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                      <SelectContent>
                        {currentField.options.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  ) : isBoolean ? (
                    <div className="flex items-center gap-3">
                      <Switch checked={editValue === true || editValue === 'true'} onCheckedChange={(v) => setEditValue(v)} id="bulk-bool" />
                      <label htmlFor="bulk-bool" className="text-sm text-muted-foreground">{editValue === true || editValue === 'true' ? 'Yes' : 'No'}</label>
                    </div>
                  ) : currentField.type === 'number' ? (
                    <Input type="number" value={editValue} onChange={e => setEditValue(e.target.value)} />
                  ) : (
                    <Input value={editValue} onChange={e => setEditValue(e.target.value)} />
                  )}
                </div>
              )}
              <Button className="w-full" onClick={handleApply} disabled={!editField || (!isBoolean && editValue === '' && editValue !== 0)}>
                <Check className="w-4 h-4 mr-1" /> Apply to {selectedCount} items
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}