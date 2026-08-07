import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Plus, Trash2, Upload, ChevronUp, ChevronDown } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function SlideEditor({ slides, onChange }) {
  const addSlide = () => {
    onChange([...slides, { title: '', content: '', image_url: '' }]);
  };

  const updateSlide = (index, field, value) => {
    const updated = [...slides];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const removeSlide = (index) => {
    onChange(slides.filter((_, i) => i !== index));
  };

  const moveSlide = (index, dir) => {
    const newIndex = index + dir;
    if (newIndex < 0 || newIndex >= slides.length) return;
    const updated = [...slides];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    onChange(updated);
  };

  const handleImageUpload = async (index, e) => {
    const file = e.target.files[0];
    if (!file) return;
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    updateSlide(index, 'image_url', file_url);
    toast.success('Image uploaded');
  };

  return (
    <div className="space-y-4">
      {slides.map((slide, i) => (
        <Card key={i} className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Slide {i + 1}</span>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" onClick={() => moveSlide(i, -1)} disabled={i === 0}>
                <ChevronUp className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => moveSlide(i, 1)} disabled={i === slides.length - 1}>
                <ChevronDown className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => removeSlide(i)}>
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </div>
          </div>
          <div>
            <Label>Title</Label>
            <Input value={slide.title} onChange={e => updateSlide(i, 'title', e.target.value)} placeholder="Slide title" />
          </div>
          <div>
            <Label>Content</Label>
            <Textarea value={slide.content} onChange={e => updateSlide(i, 'content', e.target.value)} placeholder="Slide content (supports markdown)" rows={4} />
          </div>
          <div>
            <Label>Image</Label>
            <div className="flex items-center gap-3 mt-1">
              {slide.image_url && <img src={slide.image_url} className="w-20 h-14 rounded-lg object-cover" alt="" />}
              <label className="flex items-center gap-2 px-3 py-2 border border-input rounded-lg cursor-pointer hover:bg-muted text-sm">
                <Upload className="w-4 h-4" /> Upload
                <input type="file" accept="image/*" className="hidden" onChange={e => handleImageUpload(i, e)} />
              </label>
            </div>
          </div>
        </Card>
      ))}
      <Button variant="outline" onClick={addSlide} className="w-full">
        <Plus className="w-4 h-4 mr-2" />Add Slide
      </Button>
    </div>
  );
}