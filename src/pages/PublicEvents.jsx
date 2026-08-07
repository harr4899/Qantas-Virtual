import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarDays, ArrowRight, Users, Clock, Plane, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { format, isFuture, isPast } from 'date-fns';
import Navbar from '@/components/public/Navbar';
import Footer from '@/components/public/Footer';
import { toast } from 'sonner';

const typeColors = {
  group_flight: 'bg-blue-100 text-blue-800 border-blue-200',
  long_haul_challenge: 'bg-purple-100 text-purple-800 border-purple-200',
  atc_event: 'bg-amber-100 text-amber-800 border-amber-200',
  speed_run: 'bg-green-100 text-green-800 border-green-200',
  other: 'bg-slate-100 text-slate-700 border-slate-200',
};
const typeLabels = {
  group_flight: 'Group Flight', long_haul_challenge: 'Long-Haul Challenge',
  atc_event: 'ATC Event', speed_run: 'Speed Run', other: 'Other',
};

export default function PublicEvents() {
  const queryClient = useQueryClient();
  const [signupDialog, setSignupDialog] = useState(null);
  const [signupForm, setSignupForm] = useState({ name: '', email: '', role: 'passenger', notes: '' });
  const [signedUp, setSignedUp] = useState(false);
  const [filter, setFilter] = useState('upcoming');

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['public-events'],
    queryFn: () => base44.entities.VAEvent.filter({ active: true }, 'event_date'),
  });

  const { data: signupCounts = [] } = useQuery({
    queryKey: ['public-signup-counts'],
    queryFn: () => base44.entities.EventSignup.list(),
  });

  const countMap = useMemo(() => {
    const m = {};
    for (const s of signupCounts) {
      m[s.event_id] = (m[s.event_id] || 0) + 1;
    }
    return m;
  }, [signupCounts]);

  const signupMutation = useMutation({
    mutationFn: (data) => base44.entities.EventSignup.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['public-signup-counts'] });
      setSignedUp(true);
    },
  });

  const handleSignup = () => {
    if (!signupForm.name || !signupForm.email) { toast.error('Please fill in your name and email.'); return; }
    signupMutation.mutate({ ...signupForm, event_id: signupDialog.id });
  };

  const openSignup = (ev) => {
    setSignupForm({ name: '', email: '', role: 'passenger', notes: '' });
    setSignedUp(false);
    setSignupDialog(ev);
  };

  const filteredEvents = useMemo(() => {
    return events.filter(ev => {
      const date = new Date(ev.event_date);
      if (filter === 'upcoming') return isFuture(date) || format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
      if (filter === 'past') return isPast(date) && format(date, 'yyyy-MM-dd') !== format(new Date(), 'yyyy-MM-dd');
      return true;
    });
  }, [events, filter]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      {/* Header */}
      <div className="bg-sidebar py-14 text-center">
        <span className="inline-block text-xs font-semibold uppercase tracking-widest text-primary mb-3">Virtual Events</span>
        <h1 className="font-heading text-4xl font-bold text-sidebar-foreground mb-3">Events Calendar</h1>
        <p className="text-sidebar-foreground/60 text-sm max-w-md mx-auto">
          Join group flights, long-haul challenges, ATC events and more.
        </p>
      </div>

      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-10">
        {/* Filter tabs */}
        <div className="flex gap-2 mb-8">
          {['upcoming', 'past', 'all'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
                filter === f ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-20">
            <CalendarDays className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">No {filter} events found.</p>
          </div>
        ) : (
          <div className="space-y-5">
            {filteredEvents.map((ev, i) => {
              const isPastEvent = isPast(new Date(ev.event_date)) && format(new Date(ev.event_date), 'yyyy-MM-dd') !== format(new Date(), 'yyyy-MM-dd');
              const count = countMap[ev.id] || 0;
              const full = ev.max_participants && count >= ev.max_participants;
              return (
                <motion.div key={ev.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <Card className={`overflow-hidden ${isPastEvent ? 'opacity-60' : ''}`}>
                    {ev.banner_url && (
                      <div className="h-40 overflow-hidden">
                        <img src={ev.banner_url} alt={ev.title} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="p-6">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex flex-wrap gap-2 mb-2">
                            <Badge className={`text-xs ${typeColors[ev.event_type]}`}>{typeLabels[ev.event_type]}</Badge>
                            {ev.audience !== 'all' && (
                              <Badge variant="outline" className="text-xs text-foreground capitalize">{ev.audience} only</Badge>
                            )}
                            {isPastEvent && <Badge variant="secondary" className="text-xs">Past Event</Badge>}
                            {full && !isPastEvent && <Badge className="text-xs bg-red-100 text-red-800 border-red-200">Full</Badge>}
                          </div>
                          <h2 className="font-heading font-bold text-xl text-foreground mb-1">{ev.title}</h2>
                          {ev.description && <p className="text-muted-foreground text-sm mb-3">{ev.description}</p>}

                          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1.5">
                              <CalendarDays className="w-4 h-4 text-primary" />
                              <span>{format(new Date(ev.event_date), 'EEE, d MMMM yyyy')}</span>
                            </div>
                            {ev.event_time && (
                              <div className="flex items-center gap-1.5">
                                <Clock className="w-4 h-4 text-primary" />
                                <span>{ev.event_time}Z</span>
                              </div>
                            )}
                            {ev.route_from && ev.route_to && (
                              <div className="flex items-center gap-1.5">
                                <Plane className="w-4 h-4 text-primary" />
                                <span>{ev.route_from} → {ev.route_to}</span>
                              </div>
                            )}
                            {ev.aircraft && (
                              <span className="flex items-center gap-1">Aircraft: <strong>{ev.aircraft}</strong></span>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-2 shrink-0">
                          <div className="text-right text-sm text-muted-foreground">
                            <div className="flex items-center gap-1 justify-end">
                              <Users className="w-3.5 h-3.5" />
                              <span>{count}{ev.max_participants ? `/${ev.max_participants}` : ''} signed up</span>
                            </div>
                          </div>
                          {!isPastEvent && (
                            <Button
                              className="bg-primary text-primary-foreground"
                              disabled={full}
                              onClick={() => openSignup(ev)}
                            >
                              {full ? 'Event Full' : 'Sign Up'}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>

      <Footer />

      {/* Signup Dialog */}
      <Dialog open={!!signupDialog} onOpenChange={open => !open && setSignupDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{signupDialog?.title}</DialogTitle>
          </DialogHeader>
          {signedUp ? (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <h3 className="font-heading font-bold text-lg text-foreground">You're signed up!</h3>
              <p className="text-muted-foreground text-sm mt-1">We'll see you at the event. Keep an eye on your email for updates.</p>
              <Button className="mt-4" onClick={() => setSignupDialog(null)}>Done</Button>
            </div>
          ) : (
            <div className="space-y-3 mt-2">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Your Name *</label>
                <Input value={signupForm.name} onChange={e => setSignupForm(f => ({ ...f, name: e.target.value }))} placeholder="John Smith" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Email *</label>
                <Input type="email" value={signupForm.email} onChange={e => setSignupForm(f => ({ ...f, email: e.target.value }))} placeholder="john@example.com" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">I'm joining as</label>
                <Select value={signupForm.role} onValueChange={v => setSignupForm(f => ({ ...f, role: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="passenger">Passenger</SelectItem>
                    <SelectItem value="pilot">Pilot</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Notes (optional)</label>
                <Input value={signupForm.notes} onChange={e => setSignupForm(f => ({ ...f, notes: e.target.value }))} placeholder="Anything we should know?" />
              </div>
              <Button className="w-full" onClick={handleSignup} disabled={signupMutation.isPending}>
                {signupMutation.isPending ? 'Signing up...' : 'Confirm Sign Up'}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}