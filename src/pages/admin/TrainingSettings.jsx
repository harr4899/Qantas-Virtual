import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Settings, Save } from 'lucide-react';
import { toast } from 'sonner';

export default function TrainingSettings() {
  const queryClient = useQueryClient();
  const [maxAttempts, setMaxAttempts] = useState(3);
  const [staffEmails, setStaffEmails] = useState('');
  const [settingsId, setSettingsId] = useState(null);

  const { data: settings = [], isLoading } = useQuery({
    queryKey: ['training-settings'],
    queryFn: () => base44.entities.SiteSettings.filter({ key: 'training_config' }),
  });

  useEffect(() => {
    if (settings.length > 0) {
      const config = JSON.parse(settings[0].value || '{}');
      setMaxAttempts(config.max_attempts || 3);
      setStaffEmails(config.staff_emails || '');
      setSettingsId(settings[0].id);
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: (data) => {
      const value = JSON.stringify(data);
      if (settingsId) {
        return base44.entities.SiteSettings.update(settingsId, { value });
      }
      return base44.entities.SiteSettings.create({ key: 'training_config', value });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training-settings'] });
      toast.success('Training settings saved');
    },
  });

  const handleSave = () => {
    saveMutation.mutate({
      max_attempts: parseInt(maxAttempts) || 3,
      staff_emails: staffEmails,
    });
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold text-foreground">Training Settings</h1>
        <p className="text-muted-foreground mt-1">Configure training attempt limits and staff notifications.</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-6 max-w-xl">
          <Card className="p-6 space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <Settings className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-foreground">Attempt Limits</h3>
            </div>
            <div>
              <Label>Maximum Failed Attempts Per Sector</Label>
              <p className="text-sm text-muted-foreground mb-2">
                If a student fails a sector test more than this number of times, staff will be notified via email.
              </p>
              <Input 
                type="number" 
                min={1} 
                value={maxAttempts} 
                onChange={e => setMaxAttempts(e.target.value)} 
                className="w-32"
              />
            </div>
          </Card>

          <Card className="p-6 space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <Settings className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-foreground">Staff Notification Emails</h3>
            </div>
            <div>
              <Label>Email Addresses (comma-separated)</Label>
              <p className="text-sm text-muted-foreground mb-2">
                These emails will receive a notification when a student exceeds the max attempt limit.
              </p>
              <Textarea 
                value={staffEmails} 
                onChange={e => setStaffEmails(e.target.value)} 
                placeholder="admin@example.com, instructor@example.com"
                rows={3}
              />
            </div>
          </Card>

          <Button onClick={handleSave} disabled={saveMutation.isPending}>
            <Save className="w-4 h-4 mr-2" />
            {saveMutation.isPending ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      )}
    </div>
  );
}