import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Award, Trophy, Star, Zap, Medal, Shield, Plane, Globe, Heart, Flame } from 'lucide-react';

const iconMap = { Award, Trophy, Star, Zap, Medal, Shield, Plane, Globe, Heart, Flame };

export default function PilotBadgesDisplay({ pilotEmail }) {
  const { data: awards = [] } = useQuery({
    queryKey: ['my-badges', pilotEmail],
    queryFn: () => base44.entities.PilotBadgeAward.filter({ pilot_email: pilotEmail }),
    enabled: !!pilotEmail,
  });

  const { data: badges = [] } = useQuery({
    queryKey: ['all-badges-display'],
    queryFn: () => base44.entities.PilotBadge.filter({ active: true }),
  });

  if (awards.length === 0) return null;

  const awardedBadges = awards.map(award => {
    const badge = badges.find(b => b.id === award.badge_id);
    return { ...award, badge };
  });

  return (
    <Card className="p-4">
      <h3 className="font-semibold text-foreground mb-3 text-sm">Your Badges</h3>
      <div className="flex flex-wrap gap-2">
        {awardedBadges.map(({ id, badge, badge_name, note }) => {
          const color = badge?.color || '#6b21a8';
          const iconName = badge?.icon || 'Award';
          const IconComp = iconMap[iconName] || Award;
          return (
            <div
              key={id}
              title={`${badge_name}${note ? ` — ${note}` : ''}`}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-medium cursor-default"
              style={{ backgroundColor: color + '15', borderColor: color + '40', color }}
            >
              <IconComp className="w-3.5 h-3.5" />
              <span>{badge_name}</span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}