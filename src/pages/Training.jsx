import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import Navbar from '../components/public/Navbar';
import Footer from '../components/public/Footer';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookOpen, CheckCircle, Lock, ArrowRight, GraduationCap, Shield } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Training() {
  const [user, setUser] = useState(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    async function check() {
      const isAuth = await base44.auth.isAuthenticated();
      if (!isAuth) { setChecking(false); return; }
      const u = await base44.auth.me();
      setUser(u);
      const approved = await base44.entities.ApprovedPilot.filter({ email: u.email, status: 'active' });
      setHasAccess(approved.length > 0);
      setChecking(false);
    }
    check();
  }, []);

  const { data: sectors = [] } = useQuery({
    queryKey: ['training-sectors'],
    queryFn: () => base44.entities.TrainingSector.list('order'),
    enabled: hasAccess,
  });

  const { data: progress = [] } = useQuery({
    queryKey: ['my-progress'],
    queryFn: () => base44.entities.PilotProgress.filter({ pilot_email: user?.email }),
    enabled: !!user && hasAccess,
  });

  const { data: exams = [] } = useQuery({
    queryKey: ['final-exam'],
    queryFn: () => base44.entities.FinalExam.list(),
    enabled: hasAccess,
  });

  const hasPassed = (sectorId) => {
    return progress.some(p => p.sector_id === sectorId && p.type === 'sector_test' && p.passed);
  };

  // A sector is unlocked if it's the first OR the previous sector has been passed
  const isUnlocked = (index) => {
    if (index === 0) return true;
    const prevSector = sectors[index - 1];
    return hasPassed(prevSector.id);
  };

  const allSectorsPassed = sectors.length > 0 && sectors.every(s => hasPassed(s.id));
  const finalExamPassed = progress.some(p => p.type === 'final_exam' && p.passed);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="pt-32 pb-20 flex items-center justify-center">
          <div className="text-center max-w-md">
            <Shield className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <h1 className="font-heading text-3xl font-bold text-foreground mb-3">Access Restricted</h1>
            <p className="text-muted-foreground">You don't have access to the pilot training portal. Please contact an administrator.</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <section className="pt-32 pb-12 bg-gradient-to-b from-primary/5 to-background">
        <div className="max-w-5xl mx-auto px-6">
          <span className="text-secondary font-medium text-sm uppercase tracking-[0.2em]">Pilot Training Portal</span>
          <h1 className="font-heading text-4xl md:text-5xl font-bold text-foreground mt-3 mb-4">Your Training Journey</h1>
          <p className="text-muted-foreground text-lg">Complete all training sectors in order and pass the final exam to earn your certification.</p>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-5xl mx-auto px-6 space-y-4">
          {sectors.map((sector, i) => {
            const passed = hasPassed(sector.id);
            const unlocked = isUnlocked(i);
            const bestAttempt = progress.filter(p => p.sector_id === sector.id && p.type === 'sector_test').sort((a, b) => b.score - a.score)[0];
            const failCount = progress.filter(p => p.sector_id === sector.id && p.type === 'sector_test' && !p.passed).length;

            return (
              <motion.div
                key={sector.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className={`p-6 border transition-all ${
                  passed ? 'border-green-200 bg-green-50/30' 
                  : !unlocked ? 'opacity-60 border-dashed bg-muted/20 cursor-not-allowed'
                  : 'hover:border-primary/30 hover:shadow-md'
                }`}>
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        passed ? 'bg-green-100' : !unlocked ? 'bg-muted' : 'bg-primary/10'
                      }`}>
                        {passed 
                          ? <CheckCircle className="w-6 h-6 text-green-600" />
                          : !unlocked 
                            ? <Lock className="w-6 h-6 text-muted-foreground" />
                            : <BookOpen className="w-6 h-6 text-primary" />
                        }
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-heading text-lg font-semibold text-foreground">
                            Sector {i + 1}: {sector.title}
                          </h3>
                          {!unlocked && (
                            <Badge variant="outline" className="text-xs">
                              <Lock className="w-3 h-3 mr-1" />Locked
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {sector.slides?.length || 0} slides · {sector.test_questions?.length || 0} questions · Pass: {sector.passing_score}%
                          {bestAttempt && <span className="ml-2">· Best: {bestAttempt.score}%</span>}
                          {!unlocked && <span className="ml-2">· Complete Sector {i} first</span>}
                        </p>
                      </div>
                    </div>
                    {unlocked && (
                      <Link to={`/training/sector/${sector.id}`}>
                        <Button variant={passed ? 'outline' : 'default'} size="sm">
                          {passed ? 'Review' : 'Start'} <ArrowRight className="w-4 h-4 ml-1" />
                        </Button>
                      </Link>
                    )}
                  </div>
                </Card>
              </motion.div>
            );
          })}

          {exams.length > 0 && (
            <Card className={`p-6 border-2 transition-all ${
              finalExamPassed ? 'border-green-300 bg-green-50/30' 
              : allSectorsPassed ? 'border-secondary hover:shadow-lg' 
              : 'border-dashed opacity-60'
            }`}>
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    finalExamPassed ? 'bg-green-100' : allSectorsPassed ? 'bg-secondary/20' : 'bg-muted'
                  }`}>
                    {finalExamPassed
                      ? <CheckCircle className="w-6 h-6 text-green-600" />
                      : allSectorsPassed
                        ? <GraduationCap className="w-6 h-6 text-secondary-foreground" />
                        : <Lock className="w-6 h-6 text-muted-foreground" />
                    }
                  </div>
                  <div>
                    <h3 className="font-heading text-lg font-semibold text-foreground">
                      {exams[0].title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {allSectorsPassed 
                        ? `${exams[0].questions?.length || 0} questions · Pass: ${exams[0].passing_score}%`
                        : 'Complete all sectors to unlock'}
                      {exams[0].time_limit_minutes > 0 && ` · ${exams[0].time_limit_minutes} min limit`}
                    </p>
                  </div>
                </div>
                {allSectorsPassed && (
                  <Link to="/training/final-exam">
                    <Button variant={finalExamPassed ? 'outline' : 'default'} size="sm">
                      {finalExamPassed ? 'Review' : 'Take Exam'} <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </Link>
                )}
              </div>
            </Card>
          )}
        </div>
      </section>
      <Footer />
    </div>
  );
}