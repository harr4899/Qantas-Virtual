import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Download, Upload, Copy, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { toast } from 'sonner';

const SLIDES_TEMPLATE = {
  slides: [
    {
      title: "Introduction to Airspace",
      content: "In this slide you will learn about the different types of airspace.\n\n**Class A** - Controlled, IFR only.\n**Class B** - Busy terminal areas.\n**Class C** - Medium airports.",
      image_url: ""
    },
    {
      title: "Second Slide Title",
      content: "Your slide content here. Supports **bold**, *italic*, and line breaks.",
      image_url: ""
    }
  ]
};

const QUESTIONS_TEMPLATE = {
  questions: [
    {
      question: "What class of airspace requires an IFR clearance at all times?",
      options: ["Class A", "Class B", "Class C", "Class D"],
      correct_index: 0
    },
    {
      question: "Another sample question?",
      options: ["Answer 1", "Answer 2", "Answer 3", "Answer 4"],
      correct_index: 2
    }
  ]
};

const CHATGPT_PROMPT_SLIDES = `Generate training slides for [TOPIC] as JSON in this exact format:
{
  "slides": [
    {
      "title": "Slide title here",
      "content": "Slide body text. Supports **bold**, *italic*, and newlines.",
      "image_url": ""
    }
  ]
}
Generate [NUMBER] slides. Only return the raw JSON, no explanation.`;

const CHATGPT_PROMPT_QUESTIONS = `Generate multiple choice quiz questions about [TOPIC] as JSON in this exact format:
{
  "questions": [
    {
      "question": "The question text here?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_index": 0
    }
  ]
}
Generate [NUMBER] questions. correct_index is the 0-based index of the correct answer. Only return raw JSON, no explanation.`;

export default function ImportExport({ slides, questions, onSlidesChange, onQuestionsChange }) {
  const [mode, setMode] = useState('slides'); // 'slides' | 'questions'
  const [importText, setImportText] = useState('');
  const [importResult, setImportResult] = useState(null); // null | { ok, count, error }
  const [copiedPrompt, setCopiedPrompt] = useState(null);

  const handleExport = () => {
    const data = mode === 'slides' ? { slides } : { questions };
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = mode === 'slides' ? 'slides.json' : 'questions.json';
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${mode}`);
  };

  const handleImport = () => {
    setImportResult(null);
    let parsed;
    try {
      parsed = JSON.parse(importText.trim());
    } catch {
      setImportResult({ ok: false, error: 'Invalid JSON. Make sure you paste raw JSON only (no markdown code blocks).' });
      return;
    }

    if (mode === 'slides') {
      if (!Array.isArray(parsed.slides)) {
        setImportResult({ ok: false, error: 'Expected { "slides": [...] }' });
        return;
      }
      const valid = parsed.slides.filter(s => typeof s.title === 'string' && typeof s.content === 'string');
      if (valid.length === 0) {
        setImportResult({ ok: false, error: 'No valid slides found. Each slide needs "title" and "content".' });
        return;
      }
      onSlidesChange([...slides, ...valid.map(s => ({ title: s.title, content: s.content, image_url: s.image_url || '' }))]);
      setImportResult({ ok: true, count: valid.length });
      setImportText('');
      toast.success(`Imported ${valid.length} slide${valid.length !== 1 ? 's' : ''}`);
    } else {
      if (!Array.isArray(parsed.questions)) {
        setImportResult({ ok: false, error: 'Expected { "questions": [...] }' });
        return;
      }
      const valid = parsed.questions.filter(q =>
        typeof q.question === 'string' &&
        Array.isArray(q.options) &&
        q.options.length >= 2 &&
        typeof q.correct_index === 'number'
      );
      if (valid.length === 0) {
        setImportResult({ ok: false, error: 'No valid questions found. Each needs "question", "options" array, and "correct_index".' });
        return;
      }
      onQuestionsChange([...questions, ...valid]);
      setImportResult({ ok: true, count: valid.length });
      setImportText('');
      toast.success(`Imported ${valid.length} question${valid.length !== 1 ? 's' : ''}`);
    }
  };

  const copyPrompt = (type) => {
    const prompt = type === 'slides' ? CHATGPT_PROMPT_SLIDES : CHATGPT_PROMPT_QUESTIONS;
    navigator.clipboard.writeText(prompt);
    setCopiedPrompt(type);
    setTimeout(() => setCopiedPrompt(null), 2000);
    toast.success('Prompt copied — paste it into ChatGPT!');
  };

  const copyTemplate = () => {
    const template = mode === 'slides' ? SLIDES_TEMPLATE : QUESTIONS_TEMPLATE;
    navigator.clipboard.writeText(JSON.stringify(template, null, 2));
    toast.success('Template copied');
  };

  return (
    <div className="space-y-6">
      {/* Mode toggle */}
      <div className="flex gap-2">
        <Button
          variant={mode === 'slides' ? 'default' : 'outline'}
          size="sm"
          onClick={() => { setMode('slides'); setImportResult(null); setImportText(''); }}
        >
          Slides
        </Button>
        <Button
          variant={mode === 'questions' ? 'default' : 'outline'}
          size="sm"
          onClick={() => { setMode('questions'); setImportResult(null); setImportText(''); }}
        >
          Questions
        </Button>
        <div className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
          <span>{mode === 'slides' ? slides.length : questions.length} currently in sector</span>
        </div>
      </div>

      {/* ChatGPT prompts */}
      <Card className="p-4 bg-accent/30 border-accent">
        <div className="flex items-start gap-3">
          <Info className="w-4 h-4 text-primary mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground mb-2">
              Step 1 — Generate with ChatGPT
            </p>
            <p className="text-xs text-muted-foreground mb-3">
              Copy the prompt below, paste it into ChatGPT (replace <code className="bg-muted px-1 rounded">[TOPIC]</code> and <code className="bg-muted px-1 rounded">[NUMBER]</code>), then paste the JSON output into the import box below.
            </p>
            <div className="space-y-2">
              <div className="bg-muted rounded-lg p-3 text-xs font-mono whitespace-pre-wrap text-foreground">
                {mode === 'slides' ? CHATGPT_PROMPT_SLIDES : CHATGPT_PROMPT_QUESTIONS}
              </div>
              <Button size="sm" variant="outline" onClick={() => copyPrompt(mode)} className="gap-2">
                {copiedPrompt === mode ? <CheckCircle className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                {copiedPrompt === mode ? 'Copied!' : 'Copy Prompt'}
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Import */}
      <div>
        <p className="text-sm font-semibold text-foreground mb-2">Step 2 — Paste & Import</p>
        <p className="text-xs text-muted-foreground mb-3">
          Paste the JSON from ChatGPT here. New {mode} will be <strong>appended</strong> to existing ones.
        </p>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-muted-foreground">JSON input</span>
          <Button variant="ghost" size="sm" onClick={copyTemplate} className="text-xs h-7 gap-1">
            <Copy className="w-3 h-3" /> Copy example JSON
          </Button>
        </div>
        <Textarea
          value={importText}
          onChange={e => { setImportText(e.target.value); setImportResult(null); }}
          placeholder={`Paste JSON here...\n${JSON.stringify(mode === 'slides' ? SLIDES_TEMPLATE : QUESTIONS_TEMPLATE, null, 2)}`}
          rows={8}
          className="font-mono text-xs"
        />
        {importResult && (
          <div className={`mt-2 flex items-start gap-2 text-sm p-3 rounded-lg ${importResult.ok ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            {importResult.ok
              ? <><CheckCircle className="w-4 h-4 shrink-0 mt-0.5" /><span>Successfully imported <strong>{importResult.count}</strong> {mode}. Save the sector to keep them.</span></>
              : <><AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /><span>{importResult.error}</span></>
            }
          </div>
        )}
        <Button className="mt-3 gap-2" onClick={handleImport} disabled={!importText.trim()}>
          <Upload className="w-4 h-4" /> Import {mode === 'slides' ? 'Slides' : 'Questions'}
        </Button>
      </div>

      {/* Export */}
      <div className="border-t pt-5">
        <p className="text-sm font-semibold text-foreground mb-1">Export current {mode}</p>
        <p className="text-xs text-muted-foreground mb-3">
          Download the current {mode} as JSON — you can import it into any other sector on this or another instance.
        </p>
        <Button variant="outline" onClick={handleExport} className="gap-2">
          <Download className="w-4 h-4" /> Download {mode === 'slides' ? 'slides.json' : 'questions.json'}
        </Button>
      </div>
    </div>
  );
}