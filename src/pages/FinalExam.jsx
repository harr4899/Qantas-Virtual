import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Navbar from '../components/public/Navbar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, CheckCircle, XCircle, Clock, GraduationCap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

export default function FinalExam() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [phase, setPhase] = useState('intro');
  const [answers, setAnswers] = useState({});
  const [results, setResults] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const timerRef = useRef(null);

  useEffect(() => {
    async function load() {
      const u = await base44.auth.me();
      setUser(u);
    }
    load();
  }, []);

  const { data: exams = [], isLoading } = useQuery({
    queryKey: ['final-exam'],
    queryFn: () => base44.entities.FinalExam.list(),
  });

  const exam = exams[0];

  useEffect(() => {
    if (phase === 'exam' && exam?.time_limit_minutes > 0) {
      setTimeLeft(exam.time_limit_minutes * 60);
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            handleSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timerRef.current);
    }
  }, [phase]);

  const saveMutation = useMutation({
    mutationFn: (data) => base44.entities.PilotProgress.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my-progress'] }),
  });

  const handleSubmit = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    const questions = exam.questions || [];
    let correct = 0;
    questions.forEach((q, i) => {
      if (parseInt(answers[i]) === q.correct_index) correct++;
    });
    const score = Math.round((correct / questions.length) * 100);
    const passed = score >= (exam.passing_score || 80);

    setResults({ score, correct, total: questions.length, passed });
    setPhase('results');

    saveMutation.mutate({
      pilot_email: user.email,
      type: 'final_exam',
      score,
      passed,
      answers: Object.values(answers).map(Number),
    });

    toast[passed ? 'success' : 'error'](passed ? `Passed with ${score}%!` : `Failed with ${score}%.`);
  };

  const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">No final exam configured.</p>
      </div>
    );
  }

  const questions = exam.questions || [];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-28 pb-12 max-w-4xl mx-auto px-6">
        <Link to="/training" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Training
        </Link>

        {phase === 'intro' && (
          <Card className="p-8 text-center">
            <GraduationCap className="w-16 h-16 text-primary mx-auto mb-4" />
            <h1 className="font-heading text-3xl font-bold text-foreground mb-3">{exam.title}</h1>
            {exam.description && <p className="text-muted-foreground mb-4">{exam.description}</p>}
            <div className="flex justify-center gap-4 mb-6">
              <Badge variant="outline">{questions.length} questions</Badge>
              <Badge variant="outline">Pass: {exam.passing_score}%</Badge>
              {exam.time_limit_minutes > 0 && <Badge variant="outline">{exam.time_limit_minutes} min</Badge>}
            </div>
            <Button size="lg" onClick={() => setPhase('exam')}>Begin Exam</Button>
          </Card>
        )}

        {phase === 'exam' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between sticky top-24 bg-background/95 backdrop-blur-sm py-3 z-10">
              <h2 className="font-heading text-xl font-bold text-foreground">{exam.title}</h2>
              {timeLeft !== null && (
                <Badge variant={timeLeft < 60 ? 'destructive' : 'outline'} className="text-base px-3 py-1">
                  <Clock className="w-4 h-4 mr-1" /> {formatTime(timeLeft)}
                </Badge>
              )}
            </div>

            {questions.map((q, qi) => (
              <Card key={qi} className="p-6">
                <p className="font-medium text-foreground mb-4">{qi + 1}. {q.question}</p>
                <RadioGroup value={answers[qi] !== undefined ? String(answers[qi]) : ''} onValueChange={v => setAnswers(a => ({ ...a, [qi]: v }))}>
                  {q.options.map((opt, oi) => (
                    <div key={oi} className="flex items-center gap-3 py-1">
                      <RadioGroupItem value={String(oi)} id={`fq${qi}o${oi}`} />
                      <Label htmlFor={`fq${qi}o${oi}`} className="cursor-pointer">{opt}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </Card>
            ))}

            <Button
              className="w-full"
              size="lg"
              onClick={handleSubmit}
              disabled={Object.keys(answers).length < questions.length}
            >
              Submit Exam
            </Button>
          </div>
        )}

        {phase === 'results' && results && (
          <Card className={`p-8 text-center ${results.passed ? 'border-green-200' : 'border-destructive/20'}`}>
            {results.passed ? (
              <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
            ) : (
              <XCircle className="w-20 h-20 text-destructive mx-auto mb-4" />
            )}
            <h2 className="font-heading text-4xl font-bold text-foreground mb-2">
              {results.passed ? 'Certified!' : 'Not Yet'}
            </h2>
            <p className="text-xl text-muted-foreground mb-2">
              {results.score}% ({results.correct}/{results.total})
            </p>
            <p className="text-muted-foreground mb-6">
              {results.passed ? 'Congratulations, you are now a certified Thai Virtual pilot!' : `You need ${exam.passing_score}% to pass. Review the material and try again.`}
            </p>
            <div className="flex justify-center gap-3">
              <Link to="/training"><Button variant="outline">Back to Training</Button></Link>
              {!results.passed && (
                <Button onClick={() => { setPhase('intro'); setAnswers({}); setResults(null); }}>
                  Retry Exam
                </Button>
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}