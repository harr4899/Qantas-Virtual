import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Upload, Link, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ImageUploader({ label, value, onChange }) {
  const [uploading, setUploading] = useState(false);
  const [urlMode, setUrlMode] = useState(false);
  const [urlInput, setUrlInput] = useState('');

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    onChange(file_url);
    setUploading(false);
    toast.success('Image uploaded');
  };

  const handleUrlSave = () => {
    if (urlInput.trim()) {
      onChange(urlInput.trim());
      setUrlMode(false);
      setUrlInput('');
    }
  };

  return (
    <div className="space-y-2">
      {label && <Label className="text-sm">{label}</Label>}
      {value && (
        <div className="relative rounded-xl overflow-hidden border border-border group">
          <img src={value} alt="" className="w-full h-40 object-cover" />
          <button
            onClick={() => onChange('')}
            className="absolute top-2 right-2 w-7 h-7 bg-black/50 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      <div className="flex gap-2">
        <label className={`flex items-center gap-2 px-4 py-2 border border-input rounded-lg cursor-pointer hover:bg-muted text-sm flex-1 justify-center ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          {uploading ? 'Uploading...' : 'Upload Image'}
          <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
        </label>
        <Button variant="outline" size="sm" onClick={() => setUrlMode(!urlMode)}>
          <Link className="w-4 h-4" />
        </Button>
      </div>
      {urlMode && (
        <div className="flex gap-2">
          <Input
            placeholder="https://..."
            value={urlInput}
            onChange={e => setUrlInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleUrlSave()}
          />
          <Button size="sm" onClick={handleUrlSave}>Use URL</Button>
        </div>
      )}
    </div>
  );
}