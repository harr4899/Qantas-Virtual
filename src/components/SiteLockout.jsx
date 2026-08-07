import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Lock, Plane } from 'lucide-react';

const LOCKOUT_KEY = 'site_lockout';

// Wraps all public content — if site is locked, shows lockout screen instead.
// /hb and /admin routes are always accessible.
export default function SiteLockout({ children }) {
  const { pathname } = useLocation();

  // These paths are never locked
  const exempt = pathname.startsWith('/hb') || pathname.startsWith('/admin');

  const { data: settingRaw = [] } = useQuery({
    queryKey: ['site-lockout-check'],
    queryFn: () => base44.entities.SiteSettings.filter({ key: LOCKOUT_KEY }),
    refetchInterval: 30000,
    enabled: !exempt,
  });

  const lockout = React.useMemo(() => {
    if (settingRaw.length === 0) return { enabled: false, message: '' };
    try { return JSON.parse(settingRaw[0].value || '{}'); } catch { return { enabled: false, message: '' }; }
  }, [settingRaw]);

  if (!exempt && lockout.enabled) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-6">
        <div className="text-center max-w-md space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center mx-auto">
            <Lock className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h1 className="font-heading text-2xl font-bold text-white mb-3">Site Unavailable</h1>
            <p className="text-white/60 text-sm leading-relaxed">
              {lockout.message || 'This site is currently unavailable. Please check back later.'}
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 text-white/20 text-xs">
            <Plane className="w-3 h-3" />
            <span>Qantas Virtual</span>
          </div>
        </div>
      </div>
    );
  }

  return children;
}