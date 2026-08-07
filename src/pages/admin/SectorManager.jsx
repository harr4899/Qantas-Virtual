import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Pencil, Trash2, Upload, BookOpen, GripVertical } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/lib/AuthContext';
import SlideEditor from '../../components/admin/SlideEditor';
import QuestionEditor from '../../components/admin/QuestionEditor';
import ImportExport from '../../components/admin/ImportExport';

export default function SectorManager() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    title: '', description: '', order: 0, slides: [], test_questions: [], passing_score: 70
  });

  const { data: sectors = [], isLoading } = useQuery({
    queryKey: ['admin-sectors'],
    queryFn: () => base44.entities.TrainingSector.list('order'),
  });

  const saveMutation = useMutation({
    mutationFn: (data) => editing
      ? base44.entities.TrainingSector.update(editing.id, data)
      : base44.entities.TrainingSector.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-sectors'] });
      setDialogOpen(false);
      resetForm();
      toast.success(editing ? 'Sector updated' : 'Sector created');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.TrainingSector.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-sectors'] });
      toast.success('Sector deleted');
    },
  });

  const resetForm = () => {
    setEditing(null);
    setForm({ title: '', description: '', order: 0, slides: [], test_questions: [], passing_score: 70 });
  };

  const openEdit = (sector) => {
    setEditing(sector);
    setForm({
      title: sector.title,
      description: sector.description || '',
      order: sector.order || 0,
      slides: sector.slides || [],
      test_questions: sector.test_questions || [],
      passing_score: sector.passing_score || 70,
    });
    setDialogOpen(true);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-heading text-3xl font-bold text-foreground">Training Sectors</h1>
          <p className="text-muted-foreground mt-1">Create and manage training modules with slides and tests.</p>
        </div>
        <Button onClick={() => { resetForm(); setDialogOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" />Add Sector
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      ) : sectors.length === 0 ? (
        <div className="text-center py-16">
          <BookOpen className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">No training sectors yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sectors.map((sector, i) => (
            <Card key={sector.id} className="px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <span className="font-heading font-bold text-primary">{i + 1}</span>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{sector.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {sector.slides?.length || 0} slides · {sector.test_questions?.length || 0} questions · Pass: {sector.passing_score || 70}%
                  </p>
                </div>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" onClick={() => openEdit(sector)}>
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(sector.id)}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm(); }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Sector' : 'Create Sector'}</DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="details" className="mt-4">
            <TabsList className="w-full">
              <TabsTrigger value="details" className="flex-1">Details</TabsTrigger>
              <TabsTrigger value="slides" className="flex-1">Slides ({form.slides.length})</TabsTrigger>
              <TabsTrigger value="test" className="flex-1">Test ({form.test_questions.length})</TabsTrigger>
              {isAdmin && <TabsTrigger value="import-export" className="flex-1">Import / Export</TabsTrigger>}
            </TabsList>

            <TabsContent value="details" className="space-y-4 mt-4">
              <div>
                <Label>Title</Label>
                <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Order</Label>
                  <Input type="number" value={form.order} onChange={e => setForm(f => ({ ...f, order: parseInt(e.target.value) || 0 }))} />
                </div>
                <div>
                  <Label>Passing Score (%)</Label>
                  <Input type="number" value={form.passing_score} onChange={e => setForm(f => ({ ...f, passing_score: parseInt(e.target.value) || 70 }))} />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="slides" className="mt-4">
              <SlideEditor slides={form.slides} onChange={slides => setForm(f => ({ ...f, slides }))} />
            </TabsContent>

            <TabsContent value="test" className="mt-4">
              <QuestionEditor questions={form.test_questions} onChange={questions => setForm(f => ({ ...f, test_questions: questions }))} />
            </TabsContent>

            {isAdmin && (
              <TabsContent value="import-export" className="mt-4">
                <ImportExport
                  slides={form.slides}
                  questions={form.test_questions}
                  onSlidesChange={slides => setForm(f => ({ ...f, slides }))}
                  onQuestionsChange={questions => setForm(f => ({ ...f, test_questions: questions }))}
                />
              </TabsContent>
            )}
          </Tabs>

          <Button className="w-full mt-4" onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? 'Saving...' : 'Save Sector'}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}