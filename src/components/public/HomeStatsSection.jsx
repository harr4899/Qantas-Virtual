import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Globe, Plane, Users, Star, TrendingUp, Award, Map, CheckCircle, Clock, Shield } from 'lucide-react';

const iconMap = { Globe, Plane, Users, Star, TrendingUp, Award, Map, CheckCircle, Clock, Shield };

export default function HomeStatsSection() {
  const { data: stats = [] } = useQuery({
    queryKey: ['home-stats'],
    queryFn: () => base44.entities.HomeStats.list('order'),
  });

  if (stats.length === 0) return null;

  return (
    <section className="py-16 bg-foreground text-background">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map(stat => {
            const Icon = iconMap[stat.icon] || Globe;
            return (
              <div key={stat.id} className="text-center">
                <div className="w-12 h-12 rounded-full bg-secondary/20 flex items-center justify-center mx-auto mb-4">
                  <Icon className="w-6 h-6 text-secondary" />
                </div>
                <p className="font-heading text-3xl font-bold text-background mb-1">{stat.value}</p>
                <p className="text-sm text-background/60">{stat.label}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}