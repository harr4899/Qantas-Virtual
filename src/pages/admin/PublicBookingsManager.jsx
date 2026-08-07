import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Inbox } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

const statusColors = {
  pending: 'bg-amber-100 text-amber-700',
  confirmed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

export default function PublicBookingsManager() {
  const queryClient = useQueryClient();

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ['public-bookings-admin'],
    queryFn: () => base44.entities.PublicBooking.list('-created_date'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.PublicBooking.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['public-bookings-admin'] });
      toast.success('Booking updated');
    },
  });

  const activeBookings = bookings.filter(b => b.status !== 'cancelled');
  const cancelledBookings = bookings.filter(b => b.status === 'cancelled');

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold text-foreground">Public Bookings</h1>
        <p className="text-muted-foreground mt-1">Manage passenger booking requests from the public site.</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-16">
          <Inbox className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">No bookings yet.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Active bookings */}
          {activeBookings.length > 0 && (
            <div>
              <h2 className="font-semibold text-foreground mb-3">Active Bookings ({activeBookings.length})</h2>
              <div className="space-y-3">
                {activeBookings.map(b => (
                  <Card key={b.id} className="px-5 py-4">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <p className="font-semibold text-foreground">{b.passenger_name}</p>
                          <Badge className={statusColors[b.status] || ''}>{b.status}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{b.passenger_email}</p>
                        <p className="text-sm mt-1">
                          <span className="font-medium">{b.flight_number}</span>
                          {b.origin && <span className="text-muted-foreground"> · {b.origin} → {b.destination}</span>}
                          {b.travel_date && (
                            <span className="text-muted-foreground"> · {format(new Date(b.travel_date), 'EEE, d MMM yyyy')}</span>
                          )}
                        </p>
                        {b.notes && <p className="text-xs text-muted-foreground mt-1 italic">"{b.notes}"</p>}
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        {b.status === 'pending' && (
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => updateMutation.mutate({ id: b.id, status: 'confirmed' })}
                            disabled={updateMutation.isPending}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />Confirm
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-destructive border-destructive/30"
                          onClick={() => updateMutation.mutate({ id: b.id, status: 'cancelled' })}
                          disabled={updateMutation.isPending}
                        >
                          <XCircle className="w-4 h-4 mr-1" />Cancel
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Cancelled bookings */}
          {cancelledBookings.length > 0 && (
            <div>
              <h2 className="font-semibold text-muted-foreground mb-3">Cancelled ({cancelledBookings.length})</h2>
              <div className="space-y-2 opacity-60">
                {cancelledBookings.map(b => (
                  <Card key={b.id} className="px-5 py-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-3">
                          <p className="font-medium text-foreground text-sm">{b.passenger_name}</p>
                          <Badge className={statusColors[b.status] || ''}>{b.status}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {b.flight_number} · {b.origin} → {b.destination}
                          {b.travel_date && ` · ${format(new Date(b.travel_date), 'EEE, d MMM')}`}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateMutation.mutate({ id: b.id, status: 'pending' })}
                        disabled={updateMutation.isPending}
                      >
                        Restore
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}