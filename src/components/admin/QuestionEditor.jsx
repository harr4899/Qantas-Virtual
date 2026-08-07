import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Plus, Trash2 } from 'lucide-react';

export default function QuestionEditor({ questions, onChange }) {
  const addQuestion = () => {
    onChange([...questions, { question: '', options: ['', '', '', ''], correct_index: 0 }]);
  };

  const updateQuestion = (qi, field, value) => {
    const updated = [...questions];
    updated[qi] = { ...updated[qi], [field]: value };
    onChange(updated);
  };

  const updateOption = (qi, oi, value) => {
    const updated = [...questions];
    const opts = [...updated[qi].options];
    opts[oi] = value;
    updated[qi] = { ...updated[qi], options: opts };
    onChange(updated);
  };

  const addOption = (qi) => {
    const updated = [...questions];
    updated[qi] = { ...updated[qi], options: [...updated[qi].options, ''] };
    onChange(updated);
  };

  const removeOption = (qi, oi) => {
    const updated = [...questions];
    const opts = updated[qi].options.filter((_, i) => i !== oi);
    let correctIdx = updated[qi].correct_index;
    if (oi === correctIdx) correctIdx = 0;
    else if (oi < correctIdx) correctIdx--;
    updated[qi] = { ...updated[qi], options: opts, correct_index: correctIdx };
    onChange(updated);
  };

  const removeQuestion = (qi) => {
    onChange(questions.filter((_, i) => i !== qi));
  };

  return (
    <div className="space-y-4">
      {questions.map((q, qi) => (
        <Card key={qi} className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Question {qi + 1}</span>
            <Button variant="ghost" size="icon" onClick={() => removeQuestion(qi)}>
              <Trash2 className="w-4 h-4 text-destructive" />
            </Button>
          </div>
          <div>
            <Label>Question</Label>
            <Input value={q.question} onChange={e => updateQuestion(qi, 'question', e.target.value)} placeholder="Enter question" />
          </div>
          <div>
            <Label>Options (select the correct answer)</Label>
            <RadioGroup
              value={String(q.correct_index)}
              onValueChange={v => updateQuestion(qi, 'correct_index', parseInt(v))}
              className="mt-2 space-y-2"
            >
              {q.options.map((opt, oi) => (
                <div key={oi} className="flex items-center gap-2">
                  <RadioGroupItem value={String(oi)} id={`q${qi}-o${oi}`} />
                  <Input
                    value={opt}
                    onChange={e => updateOption(qi, oi, e.target.value)}
                    placeholder={`Option ${oi + 1}`}
                    className="flex-1"
                  />
                  {q.options.length > 2 && (
                    <Button variant="ghost" size="icon" onClick={() => removeOption(qi, oi)}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              ))}
            </RadioGroup>
            <Button variant="ghost" size="sm" onClick={() => addOption(qi)} className="mt-2">
              <Plus className="w-3 h-3 mr-1" />Add Option
            </Button>
          </div>
        </Card>
      ))}
      <Button variant="outline" onClick={addQuestion} className="w-full">
        <Plus className="w-4 h-4 mr-2" />Add Question
      </Button>
    </div>
  );
}