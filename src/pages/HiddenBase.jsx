import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Plane, Code2, Lock, Unlock, Globe, Mail, User, Github, Shield, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

const CREATOR_INFO = {
  name: 'Harry',
  email: 'harr4899@gmail.com',
  role: 'Developer & Founder – Qantas Virtual',
  note: 'This app was designed and built by the above individual. If you are running a cloned or modified version of this app, please provide full credit.',
  year: 2026,
};

const LOCKOUT_KEY = 'site_lockout';

export default function HiddenBase() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [lockMessage, setLockMessage] = useState('');
  const [savingLock, setSavingLock] = useState(false);

  React.useEffect(() => {
    async function check() {
      const isAuth = await base44.auth.isAuthenticated();
      if (isAuth) {
        const u = await base44.auth.me();
        setUser(u);
        setIsAdmin(u?.role === 'admin');
      }
      setAuthChecked(true);
    }
    check();
  }, []);

  const { data: lockoutSettingRaw = [] } = useQuery({
    queryKey: ['site-lockout-setting'],
    queryFn: () => base44.entities.SiteSettings.filter({ key: LOCKOUT_KEY }),
  });

  const lockoutSetting = React.useMemo(() => {
    if (lockoutSettingRaw.length === 0) return { enabled: false, message: '' };
    try { return JSON.parse(lockoutSettingRaw[0].value || '{}'); } catch { return { enabled: false, message: '' }; }
  }, [lockoutSettingRaw]);

  const settingId = lockoutSettingRaw[0]?.id;

  // Init local message from DB
  React.useEffect(() => {
    if (lockoutSetting.message && !lockMessage) {
      setLockMessage(lockoutSetting.message);
    }
  }, [lockoutSetting.message]);

  const saveLockout = async (enabled, message) => {
    setSavingLock(true);
    const value = JSON.stringify({ enabled, message: message ?? lockMessage });
    if (settingId) {
      await base44.entities.SiteSettings.update(settingId, { value });
    } else {
      await base44.entities.SiteSettings.create({ key: LOCKOUT_KEY, value });
    }
    queryClient.invalidateQueries({ queryKey: ['site-lockout-setting'] });
    setSavingLock(false);
    toast.success(enabled ? 'Site locked!' : 'Site unlocked');
  };

  const toggleLock = () => saveLockout(!lockoutSetting.enabled, lockMessage);
  const saveMessage = () => saveLockout(lockoutSetting.enabled, lockMessage);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex flex-col items-center justify-center px-6 py-16">
      {/* Background pattern */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_#1a0a1a_0%,_#0a0a0f_70%)] pointer-events-none" />

      <div className="relative z-10 w-full max-w-2xl space-y-8">

        {/* Header */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center mx-auto mb-4">
            <Plane className="w-8 h-8 text-primary" />
          </div>
          <h1 className="font-heading text-3xl font-bold text-white">App Origin</h1>
          <p className="text-white/50 text-sm">This page is hardcoded into the application source. It is always accessible, regardless of site lockout or cloning.</p>
        </div>

        {/* Creator card */}
        <Card className="bg-white/5 border-white/10 text-white p-6 space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-heading font-bold text-lg text-white">{CREATOR_INFO.name}</p>
              <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">{CREATOR_INFO.role}</Badge>
            </div>
          </div>

          <div className="grid gap-3 text-sm">
            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
              <Mail className="w-4 h-4 text-primary/70 shrink-0" />
              <span className="text-white/80">{CREATOR_INFO.email}</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
              <Code2 className="w-4 h-4 text-primary/70 shrink-0" />
              <span className="text-white/80">Built {CREATOR_INFO.year} · Qantas Virtual</span>
            </div>
          </div>

          <div className="border-t border-white/10 pt-4">
            <div className="flex items-start gap-3 p-3 bg-amber-500/10 rounded-xl border border-amber-500/20">
              <Shield className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-200/80">{CREATOR_INFO.note}</p>
            </div>
          </div>
        </Card>

        {/* Lockout control — only visible to admins */}
        {authChecked && isAdmin && (
          <Card className="bg-white/5 border-white/10 text-white p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                <Lock className="w-4 h-4 text-red-400" />
              </div>
              <div>
                <h2 className="font-heading font-bold text-white">Site Lockout</h2>
                <p className="text-xs text-white/50">Instantly lock the entire public site with a custom message.</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-white/60 uppercase tracking-wider">Lockout Message</Label>
              <Textarea
                value={lockMessage}
                onChange={e => setLockMessage(e.target.value)}
                placeholder="e.g. The site is currently under maintenance. We'll be back shortly."
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30 resize-none"
                rows={3}
              />
            </div>

            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Switch
                  checked={lockoutSetting.enabled}
                  onCheckedChange={toggleLock}
                  disabled={savingLock}
                />
                <span className="text-sm text-white/70">
                  Site is currently{' '}
                  <span className={lockoutSetting.enabled ? 'text-red-400 font-semibold' : 'text-green-400 font-semibold'}>
                    {lockoutSetting.enabled ? 'LOCKED' : 'LIVE'}
                  </span>
                </span>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10"
                onClick={saveMessage}
                disabled={savingLock}
              >
                Save Message
              </Button>
            </div>

            {lockoutSetting.enabled && (
              <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                <p className="text-xs text-red-300">Lockout is active. Visitors see your lockout message instead of the site.</p>
              </div>
            )}
          </Card>
        )}

        {authChecked && !isAdmin && (
          <p className="text-center text-white/30 text-xs">Admin controls hidden. Log in as admin to manage site lockout.</p>
        )}

        <p className="text-center text-white/20 text-xs">
          /hb · Qantas Virtual · {CREATOR_INFO.year}
        </p>
      </div>
    </div>
  );
}