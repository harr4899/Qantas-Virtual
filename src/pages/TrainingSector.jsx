import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Navbar from '../components/public/Navbar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ArrowRight, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

export default function TrainingSector() {
  const sectorId = window.location.pathname.split('/').pop();
  const queryClient = useQueryClient();

  const [user, setUser] = useState(null);
  const [phase, setPhase] = useState('slides'); // slides | test | results
  const [slideIndex, setSlideIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [results, setResults] = useState(null);

  useEffect(() => {
    async function load() {
      const u = await base44.auth.me();
      setUser(u);
    }
    load();
  }, []);

  const { data: sector, isLoading } = useQuery({
    queryKey: ['sector', sectorId],
    queryFn: async () => {
      const all = await base44.entities.TrainingSector.list();
      return all.find(s => s.id === sectorId);
    },
  });

  // Load failed attempts for this sector
  const { data: myProgress = [] } = useQuery({
    queryKey: ['my-sector-progress', sectorId, user?.email],
    queryFn: () => base44.entities.PilotProgress.filter({ pilot_email: user.email, sector_id: sectorId, type: 'sector_test' }),
    enabled: !!user,
  });

  // Load training config (max attempts)
  const { data: trainingConfig = [] } = useQuery({
    queryKey: ['training-settings'],
    queryFn: () => base44.entities.SiteSettings.filter({ key: 'training_config' }),
  });

  const getMaxAttempts = () => {
    if (trainingConfig.length > 0) {
      const config = JSON.parse(trainingConfig[0].value || '{}');
      return config.max_attempts || 3;
    }
    return 3;
  };

  const getStaffEmails = () => {
    if (trainingConfig.length > 0) {
      const config = JSON.parse(trainingConfig[0].value || '{}');
      return config.staff_emails || '';
    }
    return '';
  };

  const failedAttempts = myProgress.filter(p => !p.passed).length;
  const alreadyPassed = myProgress.some(p => p.passed);
  const maxAttempts = getMaxAttempts();
  const exceededLimit = failedAttempts >= maxAttempts && !alreadyPassed;

  const saveMutation = useMutation({
    mutationFn: (data) => base44.entities.PilotProgress.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-progress'] });
      queryClient.invalidateQueries({ queryKey: ['my-sector-progress', sectorId] });
    },
  });

  const notifyStaffMutation = useMutation({
    mutationFn: async ({ pilotEmail, sectorTitle, attempts, staffEmails }) => {
      const emails = staffEmails.split(',').map(e => e.trim()).filter(Boolean);
      for (const email of emails) {
        await base44.integrations.Core.SendEmail({
          to: email,
          subject: `Thai Virtual — Student Requires Assistance`,
          body: `A student pilot has exceeded the maximum number of attempts on a training sector and may require support.\n\nStudent: ${pilotEmail}\nSector: ${sectorTitle}\nFailed Attempts: ${attempts}\n\nPlease follow up with this student.`,
        });
      }
    },
  });

  const slides = sector?.slides || [];
  const questions = sector?.test_questions || [];

  const handleSubmitTest = async () => {
    let correct = 0;
    questions.forEach((q, i) => {
      if (parseInt(answers[i]) === q.correct_index) correct++;
    });
    const score = Math.round((correct / questions.length) * 100);
    const passed = score >= (sector.passing_score || 70);
    const newFailCount = passed ? failedAttempts : failedAttempts + 1;

    setResults({ score, correct, total: questions.length, passed });
    setPhase('results');

    await saveMutation.mutateAsync({
      pilot_email: user.email,
      sector_id: sectorId,
      type: 'sector_test',
      score,
      passed,
      answers: Object.values(answers).map(Number),
    });

    toast[passed ? 'success' : 'error'](passed ? `Passed with ${score}%!` : `Failed with ${score}%. Try again.`);

    // Check if student just hit or exceeded the attempt limit
    if (!passed && newFailCount >= maxAttempts) {
      const staffEmails = getStaffEmails();
      if (staffEmails) {
        notifyStaffMutation.mutate({
          pilotEmail: user.email,
          sectorTitle: sector.title,
          attempts: newFailCount,
          staffEmails,
        });
        toast.warning('Staff have been notified about your progress.');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!sector) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Sector not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-28 pb-12 max-w-4xl mx-auto px-6">
        <Link to="/training" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Training
        </Link>

        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="font-heading text-3xl font-bold text-foreground mb-2">{sector.title}</h1>
            {sector.description && <p className="text-muted-foreground">{sector.description}</p>}
          </div>
          {!alreadyPassed && myProgress.length > 0 && (
            <Badge variant={exceededLimit ? 'destructive' : 'outline'} className="shrink-0">
              {failedAttempts} failed attempt{failedAttempts !== 1 ? 's' : ''}
            </Badge>
          )}
        </div>

        {/* Staff notified warning */}
        {exceededLimit && phase !== 'results' && (
          <Card className="p-4 border-amber-200 bg-amber-50 flex items-start gap-3 mb-6">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-amber-800">Assistance Required</p>
              <p className="text-sm text-amber-700">You've exceeded the maximum attempts. Staff have been notified and will be in touch to help you.</p>
            </div>
          </Card>
        )}

        {phase === 'slides' && slides.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-muted-foreground">Slide {slideIndex + 1} of {slides.length}</span>
              <div className="flex gap-1">
                {slides.map((_, i) => (
                  <div key={i} className={`w-2 h-2 rounded-full ${i === slideIndex ? 'bg-primary' : i < slideIndex ? 'bg-primary/30' : 'bg-border'}`} />
                ))}
              </div>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={slideIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="p-8">
                  {slides[slideIndex].image_url && (
                    <img src={slides[slideIndex].image_url} alt="" className="w-full max-h-96 object-contain rounded-xl mb-6" />
                  )}
                  <h2 className="font-heading text-2xl font-bold text-foreground mb-4">{slides[slideIndex].title}</h2>
                  <div className="prose prose-sm max-w-none text-muted-foreground">
                    <ReactMarkdown>{slides[slideIndex].content}</ReactMarkdown>
                  </div>
                </Card>
              </motion.div>
            </AnimatePresence>

            <div className="flex justify-between mt-6">
              <Button variant="outline" onClick={() => setSlideIndex(i => i - 1)} disabled={slideIndex === 0}>
                <ArrowLeft className="w-4 h-4 mr-1" /> Previous
              </Button>
              {slideIndex < slides.length - 1 ? (
                <Button onClick={() => setSlideIndex(i => i + 1)}>
                  Next <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              ) : questions.length > 0 ? (
                <Button onClick={() => setPhase('test')}>
                  Start Test <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              ) : (
                <Link to="/training">
                  <Button>Complete <CheckCircle className="w-4 h-4 ml-1" /></Button>
                </Link>
              )}
            </div>
          </div>
        )}

        {phase === 'slides' && slides.length === 0 && questions.length > 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">No slides for this sector. Proceed to the test.</p>
            <Button onClick={() => setPhase('test')}>Start Test <ArrowRight className="w-4 h-4 ml-1" /></Button>
          </div>
        )}

        {phase === 'test' && (
          <div className="space-y-6">
            <Card className="p-6 bg-primary/5 border-primary/20">
              <h2 className="font-heading text-xl font-bold text-foreground">Sector Test</h2>
              <p className="text-sm text-muted-foreground">Pass mark: {sector.passing_score || 70}%</p>
            </Card>

            {questions.map((q, qi) => (
              <Card key={qi} className="p-6">
                <p className="font-medium text-foreground mb-4">{qi + 1}. {q.question}</p>
                <RadioGroup value={answers[qi] !== undefined ? String(answers[qi]) : ''} onValueChange={v => setAnswers(a => ({ ...a, [qi]: v }))}>
                  {q.options.map((opt, oi) => (
                    <div key={oi} className="flex items-center gap-3 py-1">
                      <RadioGroupItem value={String(oi)} id={`q${qi}o${oi}`} />
                      <Label htmlFor={`q${qi}o${oi}`} className="cursor-pointer">{opt}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </Card>
            ))}

            <Button
              className="w-full"
              size="lg"
              onClick={handleSubmitTest}
              disabled={Object.keys(answers).length < questions.length || saveMutation.isPending}
            >
              Submit Test
            </Button>
          </div>
        )}

        {phase === 'results' && results && (
          <Card className={`p-8 text-center ${results.passed ? 'border-green-200' : 'border-destructive/20'}`}>
            {results.passed ? (
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            ) : (
              <XCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
            )}
            <h2 className="font-heading text-3xl font-bold text-foreground mb-2">
              {results.passed ? 'Congratulations!' : 'Not Quite'}
            </h2>
            <p className="text-lg text-muted-foreground mb-2">
              You scored {results.score}% ({results.correct}/{results.total})
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              {results.passed ? 'You passed this sector!' : `You need ${sector.passing_score}% to pass.`}
            </p>
            {!results.passed && exceededLimit && (
              <div className="mb-6 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-700">You've reached the attempt limit. Staff have been notified to assist you.</p>
              </div>
            )}
            <div className="flex justify-center gap-3">
              <Link to="/training"><Button variant="outline">Back to Training</Button></Link>
              {!results.passed && (
                <Button onClick={() => { setPhase('test'); setAnswers({}); setResults(null); }}>
                  Retry Test
                </Button>
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}