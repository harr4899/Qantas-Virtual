import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import {
  Users, BookOpen, GraduationCap, Mail, CheckCircle2, XCircle,
  Paintbrush, ArrowRight, TrendingUp, Clock, Award, AlertCircle, Bell, Map
} from 'lucide-react';
import { format } from 'date-fns';

const StatCard = ({ icon: Icon, label, value, sub, accent }) => (
  <Card className="p-6 border-0 shadow-sm overflow-hidden relative">
    <div className="absolute inset-0 opacity-5" style={{ backgroundColor: accent }} />
    <div className="relative flex items-start justify-between">
      <div>
        <p className="text-sm text-muted-foreground font-medium">{label}</p>
        <p className="text-4xl font-heading font-bold mt-1" style={{ color: accent }}>{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </div>
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: accent + '20' }}>
        <Icon className="w-6 h-6" style={{ color: accent }} />
      </div>
    </div>
  </Card>
);

const QuickLink = ({ to, icon: Icon, label, description, accent }) => (
  <Link to={to}>
    <Card className="p-5 border hover:shadow-md transition-all group cursor-pointer hover:border-primary/30">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: accent + '20' }}>
          <Icon className="w-5 h-5" style={{ color: accent }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground text-sm">{label}</p>
          <p className="text-xs text-muted-foreground truncate">{description}</p>
        </div>
        <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
      </div>
    </Card>
  </Link>
);

export default function Dashboard() {
  const { data: team = [] } = useQuery({ queryKey: ['admin-team'], queryFn: () => base44.entities.TeamMember.list() });
  const { data: pilots = [] } = useQuery({ queryKey: ['admin-pilots'], queryFn: () => base44.entities.ApprovedPilot.list() });
  const { data: sectors = [] } = useQuery({ queryKey: ['admin-sectors'], queryFn: () => base44.entities.TrainingSector.list() });
  const { data: progress = [] } = useQuery({ queryKey: ['admin-progress'], queryFn: () => base44.entities.PilotProgress.list('-created_date', 50) });
  const { data: exams = [] } = useQuery({ queryKey: ['admin-exam'], queryFn: () => base44.entities.FinalExam.list() });

  const activePilots = pilots.filter(p => p.status === 'active').length;
  const revokedPilots = pilots.filter(p => p.status === 'revoked').length;
  const passedFinal = progress.filter(p => p.type === 'final_exam' && p.passed).length;
  const failedFinal = progress.filter(p => p.type === 'final_exam' && !p.passed).length;
  const sectorTests = progress.filter(p => p.type === 'sector_test');
  const passedSectors = sectorTests.filter(p => p.passed).length;
  const totalSlides = sectors.reduce((acc, s) => acc + (s.slides?.length || 0), 0);
  const totalQuestions = sectors.reduce((acc, s) => acc + (s.test_questions?.length || 0), 0);
  const finalExam = exams[0];
  const recentActivity = progress.slice(0, 6);

  // Unique pilots who have started training
  const uniqueTrainees = [...new Set(progress.map(p => p.pilot_email))].length;
  const certifiedPilots = [...new Set(progress.filter(p => p.type === 'final_exam' && p.passed).map(p => p.pilot_email))].length;

  // Qantas brand colors
  const purple = '#C8102E';
  const gold = '#6B7280';
  const teal = '#0E7490';
  const rose = '#374151';

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold text-foreground">Operations Dashboard</h1>
          <p className="text-muted-foreground mt-1">Qantas Virtual · {format(new Date(), 'EEEE, d MMMM yyyy')}</p>
        </div>
        <a href="/" target="_blank" rel="noopener noreferrer">
          <Button variant="outline" size="sm" className="border-primary/30 text-primary hover:bg-primary/5">
            View Live Site <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </a>
      </div>

      {/* Stat Cards */}
      <div>
        <h2 className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-semibold mb-3">Pilots & Access</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Mail} label="Active Pilots" value={activePilots} sub={`${revokedPilots} revoked`} accent={purple} />
          <StatCard icon={Users} label="Trainees Started" value={uniqueTrainees} sub="unique pilots in system" accent={gold} />
          <StatCard icon={Award} label="Certified Pilots" value={certifiedPilots} sub="passed final exam" accent={teal} />
          <StatCard icon={TrendingUp} label="Sector Pass Rate" value={sectorTests.length ? `${Math.round((passedSectors/sectorTests.length)*100)}%` : '—'} sub={`${passedSectors}/${sectorTests.length} attempts`} accent={rose} />
        </div>
      </div>

      <div>
        <h2 className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-semibold mb-3">Training Content</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={BookOpen} label="Training Sectors" value={sectors.length} sub={`${totalSlides} slides total`} accent={purple} />
          <StatCard icon={GraduationCap} label="Test Questions" value={totalQuestions} sub="across all sectors" accent={gold} />
          <StatCard icon={CheckCircle2} label="Final Exam Passes" value={passedFinal} sub={`${failedFinal} failed attempts`} accent={teal} />
          <StatCard icon={Users} label="Team Members" value={team.length} sub="staff profiles" accent={rose} />
        </div>
      </div>

      {/* Middle row */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <h2 className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-semibold mb-3">Recent Test Activity</h2>
          <Card className="divide-y divide-border">
            {recentActivity.length === 0 ? (
              <div className="p-8 text-center">
                <Clock className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No activity yet</p>
              </div>
            ) : recentActivity.map((p, i) => (
              <div key={p.id || i} className="flex items-center gap-3 px-5 py-3.5">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${p.passed ? 'bg-green-100' : 'bg-red-100'}`}>
                  {p.passed
                    ? <CheckCircle2 className="w-4 h-4 text-green-600" />
                    : <XCircle className="w-4 h-4 text-red-500" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{p.pilot_email}</p>
                  <p className="text-xs text-muted-foreground">
                    {p.type === 'final_exam' ? 'Final Exam' : 'Sector Test'} · {p.score}%
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <Badge variant={p.passed ? 'default' : 'destructive'} className="text-xs">
                    {p.passed ? 'Pass' : 'Fail'}
                  </Badge>
                  {p.created_date && (
                    <p className="text-xs text-muted-foreground mt-1">{format(new Date(p.created_date), 'MMM d')}</p>
                  )}
                </div>
              </div>
            ))}
            {recentActivity.length > 0 && (
              <div className="px-5 py-3">
                <Link to="/admin/progress" className="text-xs text-primary font-medium hover:underline">
                  View all progress →
                </Link>
              </div>
            )}
          </Card>
        </div>

        {/* Site Status & Quick Links */}
        <div className="space-y-4">
          {/* Site Status */}
          <div>
            <h2 className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-semibold mb-3">Site Status</h2>
            <Card className="p-5 space-y-3">
              {[
                { label: 'Team Profiles', ok: team.length > 0, hint: team.length === 0 ? 'No members added' : `${team.length} profiles live` },
                { label: 'Training Content', ok: sectors.length > 0, hint: sectors.length === 0 ? 'No sectors created' : `${sectors.length} sectors active` },
                { label: 'Final Exam', ok: !!finalExam && (finalExam.questions?.length || 0) > 0, hint: !finalExam ? 'Not configured' : `${finalExam.questions?.length || 0} questions` },
                { label: 'Pilot Access', ok: activePilots > 0, hint: activePilots === 0 ? 'No pilots approved' : `${activePilots} approved` },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-3">
                  {item.ok
                    ? <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                    : <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                  }
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.hint}</p>
                  </div>
                </div>
              ))}
            </Card>
          </div>

          {/* Quick Links */}
          <div>
            <h2 className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-semibold mb-3">Quick Actions</h2>
            <div className="space-y-2">
              <QuickLink to="/admin/customizer" icon={Paintbrush} label="Site Customizer" description="Edit colors, text & images" accent={purple} />
              <QuickLink to="/admin/sectors" icon={BookOpen} label="Training Sectors" description="Add or edit training modules" accent={gold} />
              <QuickLink to="/admin/pilots" icon={Mail} label="Student Pilot Access" description="Approve student emails" accent={teal} />
              <QuickLink to="/admin/team" icon={Users} label="Team Manager" description="Manage staff profiles" accent={rose} />
              <QuickLink to="/admin/routes" icon={Map} label="Route Manager" description="Create pilot routes" accent={purple} />
              <QuickLink to="/admin/notams" icon={Bell} label="NOTAM Manager" description="Publish notices to pilots" accent={gold} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}