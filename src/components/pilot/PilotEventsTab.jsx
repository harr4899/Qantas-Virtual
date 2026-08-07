import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CalendarDays, Clock, Plane, Users, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { format, isFuture } from 'date-fns';
import { toast } from 'sonner';

const typeColors = {
  group_flight: 'bg-blue-100 text-blue-800',
  long_haul_challenge: 'bg-purple-100 text-purple-800',
  atc_event: 'bg-amber-100 text-amber-800',
  speed_run: 'bg-green-100 text-green-800',
  other: 'bg-slate-100 text-slate-700',
};
const typeLabels = {
  group_flight: 'Group Flight', long_haul_challenge: 'Long-Haul Challenge',
  atc_event: 'ATC Event', speed_run: 'Speed Run', other: 'Other',
};

export default function PilotEventsTab({ user }) {
  const queryClient = useQueryClient();
  const [signupDialog, setSignupDialog] = useState(null);
  const [notes, setNotes] = useState('');
  const [signedUp, setSignedUp] = useState(false);

  const { data: events = [] } = useQuery({
    queryKey: ['pilot-events'],
    queryFn: () => base44.entities.VAEvent.filter({ active: true }, 'event_date'),
  });

  const { data: mySignups = [] } = useQuery({
    queryKey: ['my-event-signups', user?.email],
    queryFn: () => base44.entities.EventSignup.filter({ pilot_email: user?.email }),
    enabled: !!user?.email,
  });

  const { data: allSignups = [] } = useQuery({
    queryKey: ['all-event-signups'],
    queryFn: () => base44.entities.EventSignup.list(),
  });

  const signedUpEventIds = new Set(mySignups.map(s => s.event_id));

  const countMap = useMemo(() => {
    const m = {};
    for (const s of allSignups) m[s.event_id] = (m[s.event_id] || 0) + 1;
    return m;
  }, [allSignups]);

  const signupMutation = useMutation({
    mutationFn: (data) => base44.entities.EventSignup.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-event-signups', user?.email] });
      queryClient.invalidateQueries({ queryKey: ['all-event-signups'] });
      setSignedUp(true);
    },
  });

  const openSignup = (ev) => {
    setNotes('');
    setSignedUp(false);
    setSignupDialog(ev);
  };

  const handleSignup = () => {
    signupMutation.mutate({
      event_id: signupDialog.id,
      name: user?.full_name || user?.email,
      email: user?.email,
      pilot_email: user?.email,
      role: 'pilot',
      notes,
    });
  };

  const upcomingEvents = events.filter(ev => isFuture(new Date(ev.event_date)));
  const pastEvents = events.filter(ev => !isFuture(new Date(ev.event_date)));

  return (
    <div className="space-y-6">
      {upcomingEvents.length === 0 && pastEvents.length === 0 ? (
        <div className="text-center py-12">
          <CalendarDays className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">No events scheduled yet. Check back soon!</p>
        </div>
      ) : (
        <>
          {upcomingEvents.length > 0 && (
            <div>
              <h3 className="font-semibold text-foreground mb-3">Upcoming Events</h3>
              <div className="space-y-3">
                {upcomingEvents.map((ev, i) => {
                  const isSignedUp = signedUpEventIds.has(ev.id);
                  const count = countMap[ev.id] || 0;
                  const full = ev.max_participants && count >= ev.max_participants;
                  return (
                    <motion.div key={ev.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                      <Card className={`p-4 ${isSignedUp ? 'border-green-300 bg-green-50/50' : ''}`}>
                        {ev.banner_url && (
                          <div className="h-28 rounded-lg overflow-hidden mb-3">
                            <img src={ev.banner_url} alt={ev.title} className="w-full h-full object-cover" />
                          </div>
                        )}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex flex-wrap gap-1.5 mb-1.5">
                              <Badge className={`text-xs ${typeColors[ev.event_type]}`}>{typeLabels[ev.event_type]}</Badge>
                              {isSignedUp && <Badge className="text-xs bg-green-100 text-green-800">Signed Up ✓</Badge>}
                            </div>
                            <h4 className="font-heading font-bold text-foreground">{ev.title}</h4>
                            {ev.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{ev.description}</p>}
                            <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <CalendarDays className="w-3.5 h-3.5 text-primary" />
                                {format(new Date(ev.event_date), 'EEE, d MMM yyyy')}
                              </div>
                              {ev.event_time && (
                                <div className="flex items-center gap-1">
                                  <Clock className="w-3.5 h-3.5 text-primary" />
                                  {ev.event_time}Z
                                </div>
                              )}
                              {ev.route_from && ev.route_to && (
                                <div className="flex items-center gap-1">
                                  <Plane className="w-3.5 h-3.5 text-primary" />
                                  {ev.route_from} → {ev.route_to}
                                </div>
                              )}
                              <div className="flex items-center gap-1">
                                <Users className="w-3.5 h-3.5" />
                                {count}{ev.max_participants ? `/${ev.max_participants}` : ''} pilots
                              </div>
                            </div>
                          </div>
                          {!isSignedUp && (
                            <Button
                              size="sm"
                              className="bg-primary text-primary-foreground shrink-0"
                              disabled={full}
                              onClick={() => openSignup(ev)}
                            >
                              {full ? 'Full' : 'Sign Up'}
                            </Button>
                          )}
                        </div>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}
          {pastEvents.length > 0 && (
            <div>
              <h3 className="font-semibold text-muted-foreground mb-3 text-sm">Past Events</h3>
              <div className="space-y-2 opacity-60">
                {pastEvents.map(ev => (
                  <div key={ev.id} className="flex items-center gap-3 p-3 rounded-xl border">
                    <CalendarDays className="w-4 h-4 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{ev.title}</p>
                      <p className="text-xs text-muted-foreground">{format(new Date(ev.event_date), 'd MMM yyyy')}</p>
                    </div>
                    {signedUpEventIds.has(ev.id) && <Badge className="ml-auto text-xs bg-muted text-muted-foreground">Attended</Badge>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Signup Dialog */}
      <Dialog open={!!signupDialog} onOpenChange={open => !open && setSignupDialog(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>{signupDialog?.title}</DialogTitle></DialogHeader>
          {signedUp ? (
            <div className="text-center py-6">
              <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-2" />
              <p className="font-semibold text-foreground">You're in!</p>
              <p className="text-sm text-muted-foreground mt-1">See you at the event, pilot.</p>
              <Button className="mt-4 w-full" onClick={() => setSignupDialog(null)}>Done</Button>
            </div>
          ) : (
            <div className="space-y-3 mt-2">
              <p className="text-sm text-muted-foreground">Signing up as: <strong>{user?.full_name || user?.email}</strong></p>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Notes (optional)</label>
                <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Aircraft preference, callsign, etc." />
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