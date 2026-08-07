import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { useAuth } from '@/lib/AuthContext';
import QuestionEditor from '../../components/admin/QuestionEditor';
import ImportExport from '../../components/admin/ImportExport';

export default function ExamManager() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [form, setForm] = useState({
    title: 'Final Examination', description: '', questions: [], passing_score: 80, time_limit_minutes: 0
  });

  const { data: exams = [], isLoading } = useQuery({
    queryKey: ['admin-exam'],
    queryFn: () => base44.entities.FinalExam.list(),
  });

  const exam = exams[0];

  useEffect(() => {
    if (exam) {
      setForm({
        title: exam.title || 'Final Examination',
        description: exam.description || '',
        questions: exam.questions || [],
        passing_score: exam.passing_score || 80,
        time_limit_minutes: exam.time_limit_minutes || 0,
      });
    }
  }, [exam]);

  const saveMutation = useMutation({
    mutationFn: (data) => exam
      ? base44.entities.FinalExam.update(exam.id, data)
      : base44.entities.FinalExam.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-exam'] });
      toast.success('Final exam saved');
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold text-foreground">Final Exam</h1>
        <p className="text-muted-foreground mt-1">Configure the final examination for pilot certification.</p>
      </div>

      <Card className="p-6 space-y-4 mb-6">
        <div>
          <Label>Exam Title</Label>
          <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
        </div>
        <div>
          <Label>Description</Label>
          <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Passing Score (%)</Label>
            <Input type="number" value={form.passing_score} onChange={e => setForm(f => ({ ...f, passing_score: parseInt(e.target.value) || 80 }))} />
          </div>
          <div>
            <Label>Time Limit (minutes, 0 = no limit)</Label>
            <Input type="number" value={form.time_limit_minutes} onChange={e => setForm(f => ({ ...f, time_limit_minutes: parseInt(e.target.value) || 0 }))} />
          </div>
        </div>
      </Card>

      <Tabs defaultValue="questions" className="mb-6">
        <TabsList className="w-full">
          <TabsTrigger value="questions" className="flex-1">Questions ({form.questions.length})</TabsTrigger>
          {isAdmin && <TabsTrigger value="import-export" className="flex-1">Import / Export</TabsTrigger>}
        </TabsList>
        <TabsContent value="questions" className="mt-4">
          <QuestionEditor questions={form.questions} onChange={questions => setForm(f => ({ ...f, questions }))} />
        </TabsContent>
        {isAdmin && (
          <TabsContent value="import-export" className="mt-4">
            <ImportExport
              slides={[]}
              questions={form.questions}
              onSlidesChange={() => {}}
              onQuestionsChange={questions => setForm(f => ({ ...f, questions }))}
            />
          </TabsContent>
        )}
      </Tabs>

      <Button className="w-full" size="lg" onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending}>
        {saveMutation.isPending ? 'Saving...' : 'Save Final Exam'}
      </Button>
    </div>
  );
}