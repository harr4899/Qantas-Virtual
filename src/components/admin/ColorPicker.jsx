import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export default function ColorPicker({ label, value, onChange }) {
  const [input, setInput] = useState(value || '#ffffff');

  const handleInput = (v) => {
    setInput(v);
    if (/^#[0-9A-Fa-f]{6}$/.test(v)) onChange(v);
  };

  return (
    <div className="space-y-1.5">
      {label && <Label className="text-sm">{label}</Label>}
      <div className="flex items-center gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <button
              className="w-9 h-9 rounded-lg border-2 border-border shadow-sm shrink-0 hover:scale-105 transition-transform"
              style={{ backgroundColor: value || '#ffffff' }}
            />
          </PopoverTrigger>
          <PopoverContent className="w-auto p-3">
            <input
              type="color"
              value={value || '#ffffff'}
              onChange={e => { setInput(e.target.value); onChange(e.target.value); }}
              className="w-40 h-40 cursor-pointer rounded-lg border-0 p-0 bg-transparent"
            />
          </PopoverContent>
        </Popover>
        <Input
          value={input}
          onChange={e => handleInput(e.target.value)}
          placeholder="#ffffff"
          className="font-mono text-sm"
        />
      </div>
    </div>
  );
}