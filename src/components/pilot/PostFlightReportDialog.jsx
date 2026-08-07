import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Upload, ImageIcon, X, Star, Plane } from 'lucide-react';
import { toast } from 'sonner';

const emptyReport = {
  landing_fpm: '',
  overall_rating: 5,
  flight_feeling: 'good',
  turbulence: 'none',
  fuel_remaining_kg: '',
  remarks: '',
  issues_encountered: '',
  passenger_feedback: '',
  tracker_screenshot_url: '',
};

export default function PostFlightReportDialog({ open, booking, user, onComplete, onCancel }) {
  const [form, setForm] = useState(emptyReport);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Reset form every time dialog opens for a new booking
  useEffect(() => {
    if (open) {
      setForm(emptyReport);
      setUploading(false);
      setSubmitting(false);
    }
  }, [open, booking?.id]);

  const handleScreenshotUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(f => ({ ...f, tracker_screenshot_url: file_url }));
    setUploading(false);
    toast.success('Screenshot uploaded!');
  };

  const handleSubmit = async () => {
    if (!form.landing_fpm && form.landing_fpm !== 0) {
      toast.error('Landing FPM is required');
      return;
    }
    if (!form.tracker_screenshot_url) {
      toast.error('PF Tracker screenshot is required as proof of flight');
      return;
    }

    setSubmitting(true);
    try {
      // 1. Save the post-flight report
      await base44.entities.PostFlightReport.create({
        pilot_email: user.email,
        pilot_name: user.full_name || user.email,
        booking_id: booking.id,
        flight_number: booking.flight_number,
        origin: booking.origin,
        destination: booking.destination,
        aircraft: booking.aircraft || '',
        flight_date: booking.scheduled_date,
        landing_fpm: Number(form.landing_fpm),
        overall_rating: form.overall_rating,
        flight_feeling: form.flight_feeling,
        turbulence: form.turbulence,
        fuel_remaining_kg: form.fuel_remaining_kg ? Number(form.fuel_remaining_kg) : null,
        remarks: form.remarks,
        issues_encountered: form.issues_encountered,
        passenger_feedback: form.passenger_feedback,
        tracker_screenshot_url: form.tracker_screenshot_url,
      });

      // 2. Mark booking as completed
      await base44.entities.FlightBooking.update(booking.id, { status: 'completed' });

      // 3. Increment pilot flight count on roster
      const rosterEntries = await base44.entities.PilotRoster.filter({ pilot_email: booking.pilot_email, active: true });
      if (rosterEntries.length > 0) {
        const entry = rosterEntries[0];
        await base44.entities.PilotRoster.update(entry.id, {
          flights_completed: (entry.flights_completed || 0) + 1,
        });
      }

      toast.success('Flight completed! Great work, pilot.');
      onComplete();
    } finally {
      setSubmitting(false);
    }
  };

  const fpmColor = () => {
    const v = Number(form.landing_fpm);
    if (!v) return 'text-foreground';
    if (v > -100) return 'text-green-600';
    if (v > -200) return 'text-blue-600';
    if (v > -400) return 'text-amber-600';
    return 'text-red-600';
  };

  const fpmLabel = () => {
    const v = Number(form.landing_fpm);
    if (!v) return '';
    if (v > -100) return '✨ Butter smooth!';
    if (v > -200) return '👍 Great landing';
    if (v > -300) return '😐 Acceptable';
    if (v > -500) return '😬 Hard landing';
    return '💥 Crash landing!';
  };

  return (
    <Dialog open={open} onOpenChange={o => !o && !submitting && onCancel()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plane className="w-4 h-4 text-primary" />
            Post-Flight Report — {booking?.flight_number}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 mt-2">
          {/* Flight summary */}
          <div className="bg-muted/40 rounded-xl p-3 text-sm flex items-center justify-between">
            <span className="font-semibold text-foreground">{booking?.origin} → {booking?.destination}</span>
            <span className="text-muted-foreground">{booking?.aircraft}</span>
          </div>

          {/* Overall rating */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">Overall Self-Rating</label>
            <div className="flex gap-2">
              {[1,2,3,4,5].map(n => (
                <button key={n} type="button" onClick={() => setForm(f => ({ ...f, overall_rating: n }))}
                  className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${form.overall_rating >= n ? 'bg-amber-400 text-white' : 'bg-muted text-muted-foreground'}`}>
                  <Star className="w-4 h-4" />
                </button>
              ))}
              <span className="text-sm text-muted-foreground ml-2 flex items-center">{form.overall_rating}/5</span>
            </div>
          </div>

          {/* How it felt */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">How did the flight go?</label>
              <Select value={form.flight_feeling} onValueChange={v => setForm(f => ({ ...f, flight_feeling: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="excellent">Excellent</SelectItem>
                  <SelectItem value="good">Good</SelectItem>
                  <SelectItem value="average">Average</SelectItem>
                  <SelectItem value="poor">Poor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Turbulence Encountered</label>
              <Select value={form.turbulence} onValueChange={v => setForm(f => ({ ...f, turbulence: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="moderate">Moderate</SelectItem>
                  <SelectItem value="severe">Severe</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Landing FPM */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">
              Landing Rate (FPM) * <span className="text-muted-foreground/60">negative = descent e.g. -150</span>
            </label>
            <Input
              type="number"
              value={form.landing_fpm}
              onChange={e => setForm(f => ({ ...f, landing_fpm: e.target.value }))}
              placeholder="-150"
              className={`font-mono ${fpmColor()}`}
            />
            {form.landing_fpm && (
              <p className={`text-xs mt-1 font-medium ${fpmColor()}`}>{fpmLabel()}</p>
            )}
          </div>

          {/* Fuel remaining */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Fuel Remaining on Landing (kg)</label>
            <Input
              type="number"
              value={form.fuel_remaining_kg}
              onChange={e => setForm(f => ({ ...f, fuel_remaining_kg: e.target.value }))}
              placeholder="3500"
            />
          </div>

          {/* Remarks */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Remarks / Notes</label>
            <Textarea
              value={form.remarks}
              onChange={e => setForm(f => ({ ...f, remarks: e.target.value }))}
              placeholder="How did the flight go overall? Any notable observations..."
              rows={3}
            />
          </div>

          {/* Issues */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Issues / Problems Encountered</label>
            <Input
              value={form.issues_encountered}
              onChange={e => setForm(f => ({ ...f, issues_encountered: e.target.value }))}
              placeholder="None / Describe any technical or operational issues"
            />
          </div>

          {/* PF Tracker Screenshot — REQUIRED */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
              PF Tracker Screenshot <span className="text-red-500 font-bold">*Required</span>
            </label>
            <p className="text-xs text-muted-foreground mb-2">Upload your PF Tracker/SimBrief/flight tracker screenshot as proof of the completed flight.</p>
            {form.tracker_screenshot_url ? (
              <div className="relative rounded-xl overflow-hidden border border-primary/30">
                <img src={form.tracker_screenshot_url} alt="Tracker screenshot" className="w-full max-h-48 object-cover" />
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, tracker_screenshot_url: '' }))}
                  className="absolute top-2 right-2 w-7 h-7 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className={`flex flex-col items-center gap-2 px-4 py-8 rounded-xl border-2 border-dashed border-border cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all ${uploading ? 'opacity-60 pointer-events-none' : ''}`}>
                <ImageIcon className="w-8 h-8 text-muted-foreground/50" />
                <div className="text-center">
                  <p className="text-sm font-medium text-foreground">{uploading ? 'Uploading...' : 'Click to upload screenshot'}</p>
                  <p className="text-xs text-muted-foreground">PNG, JPG, JPEG accepted</p>
                </div>
                <input type="file" accept="image/*" className="hidden" onChange={handleScreenshotUpload} disabled={uploading} />
              </label>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={onCancel} disabled={submitting}>Cancel</Button>
            <Button className="flex-1" onClick={handleSubmit} disabled={submitting || uploading}>
              {submitting ? 'Submitting...' : 'Submit Report & Complete Flight'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}