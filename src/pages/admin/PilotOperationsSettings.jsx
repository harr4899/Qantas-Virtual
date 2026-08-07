import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Settings, Save, Plane, Navigation } from 'lucide-react';
import { toast } from 'sonner';

const CONFIG_KEY = 'pilot_operations_config';

export default function PilotOperationsSettings() {
  const queryClient = useQueryClient();
  const [settingsId, setSettingsId] = useState(null);
  const [enforceHub, setEnforceHub] = useState(false);
  const [enforceProgressive, setEnforceProgressive] = useState(false);
  const [enforceRankRestrictions, setEnforceRankRestrictions] = useState(false);
  const [hubIcao, setHubIcao] = useState('');

  const { data: settings = [], isLoading } = useQuery({
    queryKey: ['pilot-ops-settings'],
    queryFn: () => base44.entities.SiteSettings.filter({ key: CONFIG_KEY }),
  });

  useEffect(() => {
    if (settings.length > 0) {
      const config = JSON.parse(settings[0].value || '{}');
      setEnforceHub(config.enforce_hub_start || false);
      setEnforceProgressive(config.enforce_progressive_routing || false);
      setEnforceRankRestrictions(config.enforce_rank_restrictions || false);
      setHubIcao(config.hub_icao || '');
      setSettingsId(settings[0].id);
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: (data) => {
      const value = JSON.stringify(data);
      if (settingsId) {
        return base44.entities.SiteSettings.update(settingsId, { value });
      }
      return base44.entities.SiteSettings.create({ key: CONFIG_KEY, value });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pilot-ops-settings'] });
      toast.success('Pilot operations settings saved');
    },
  });

  const handleSave = () => {
    saveMutation.mutate({
      enforce_hub_start: enforceHub,
      enforce_progressive_routing: enforceProgressive,
      enforce_rank_restrictions: enforceRankRestrictions,
      hub_icao: hubIcao.trim().toUpperCase(),
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold text-foreground">Pilot Operations Settings</h1>
        <p className="text-muted-foreground mt-1">Control how pilots can book and fly routes.</p>
      </div>

      <div className="space-y-6 max-w-xl">
        {/* Hub & Progressive Routing */}
        <Card className="p-6 space-y-5">
          <div className="flex items-center gap-3 mb-2">
            <Navigation className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">Route Progression Rules</h3>
          </div>

          <div className="space-y-2">
            <Label>Hub Airport (ICAO)</Label>
            <p className="text-sm text-muted-foreground">
              The home hub airport. Pilots must start their first flight from here when hub-start is enforced.
            </p>
            <Input
              value={hubIcao}
              onChange={e => setHubIcao(e.target.value)}
              placeholder="e.g. YSSY"
              className="w-40 uppercase"
            />
          </div>

          <div className="flex items-start gap-4 pt-2 border-t">
            <Switch checked={enforceHub} onCheckedChange={setEnforceHub} id="enforce-hub" />
            <div>
              <Label htmlFor="enforce-hub" className="cursor-pointer font-medium">Enforce Hub Start</Label>
              <p className="text-sm text-muted-foreground mt-0.5">
                A pilot's first booked flight must depart from the hub airport.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 pt-2 border-t">
            <Switch checked={enforceProgressive} onCheckedChange={setEnforceProgressive} id="enforce-prog" />
            <div>
              <Label htmlFor="enforce-prog" className="cursor-pointer font-medium">Enforce Progressive Routing</Label>
              <p className="text-sm text-muted-foreground mt-0.5">
                After the first flight, pilots can only book routes departing from their last completed destination.
              </p>
            </div>
          </div>
        </Card>

        {/* Rank Restrictions */}
        <Card className="p-6 space-y-5">
          <div className="flex items-center gap-3 mb-2">
            <Plane className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">Rank-Based Route Restrictions</h3>
          </div>

          <div className="flex items-start gap-4">
            <Switch checked={enforceRankRestrictions} onCheckedChange={setEnforceRankRestrictions} id="enforce-rank" />
            <div>
              <Label htmlFor="enforce-rank" className="cursor-pointer font-medium">Enforce Rank Restrictions</Label>
              <p className="text-sm text-muted-foreground mt-0.5">
                When enabled, routes with a "Required Rank" set in the Route Manager will only be bookable by pilots who hold that rank. Set required ranks per route in the Route Manager.
              </p>
            </div>
          </div>
        </Card>

        <Button onClick={handleSave} disabled={saveMutation.isPending}>
          <Save className="w-4 h-4 mr-2" />
          {saveMutation.isPending ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </div>
  );
}