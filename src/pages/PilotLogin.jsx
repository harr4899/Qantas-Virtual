import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card } from '@/components/ui/card';
import { Plane, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { useSiteSettings } from '@/hooks/useSiteSettings';

export default function PilotLogin() {
  const [checking, setChecking] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const { settings } = useSiteSettings();
  const welcomeHeading = settings.login_welcome_heading || 'Welcome Back';
  const welcomeSubtext = settings.login_welcome_subtext || 'The Spirit of Australia — Fly with excellence';
  const loginImage = settings.login_image || 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1600&auto=format&fit=crop';

  useEffect(() => {
    async function checkAuth() {
      const isAuth = await base44.auth.isAuthenticated();
      if (isAuth) {
        const user = await base44.auth.me();
        // Check if fast pass
        const approvedList = await base44.entities.ApprovedPilot.filter({ email: user.email, status: 'active' });
        if (approvedList.length > 0 && approvedList[0].fast_pass) {
          window.location.href = '/pilot-portal';
          return;
        }
        // Check if certified pilot via final exam
        const progress = await base44.entities.PilotProgress.filter({ 
          pilot_email: user.email, 
          type: 'final_exam', 
          passed: true 
        });
        if (progress.length > 0) {
          window.location.href = '/pilot-portal';
        } else {
          window.location.href = '/training';
        }
      } else {
        setChecking(false);
      }
    }
    checkAuth();
  }, []);

  const handleLogin = () => {
    base44.auth.redirectToLogin('/pilot-portal');
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f0505]">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-secondary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Login Form */}
      <div className="w-full lg:w-[480px] bg-gradient-to-b from-[#1a0202] to-[#0f0505] flex flex-col justify-center p-8 lg:p-12">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-sm mx-auto w-full"
        >
          {/* Logo */}
          <div className="flex items-center gap-3 mb-10">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/20">
              <Plane className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <span className="font-heading text-2xl font-bold text-white">Qantas Virtual</span>
            </div>
          </div>

          <h1 className="font-heading text-3xl font-bold text-white mb-2">{welcomeHeading}</h1>
          <p className="text-gray-400 mb-8">{welcomeSubtext}</p>

          <div className="space-y-5">
            <div>
              <Label className="text-gray-300 mb-2 block">Email Address</Label>
              <Input 
                type="email" 
                placeholder="pilot@example.com"
                className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 h-12 focus:border-secondary focus:ring-secondary"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-gray-300">Password</Label>
                <a href="#" className="text-sm text-secondary hover:text-secondary/80 transition-colors">
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <Input 
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••••••"
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 h-12 pr-10 focus:border-secondary focus:ring-secondary"
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox id="remember" className="border-white/20 data-[state=checked]:bg-secondary data-[state=checked]:border-secondary" />
              <Label htmlFor="remember" className="text-gray-400 text-sm cursor-pointer">
                Remember me
              </Label>
            </div>

            <Button 
              onClick={handleLogin}
              className="w-full h-12 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white font-semibold shadow-lg shadow-primary/20"
            >
              Sign In
            </Button>

            <p className="text-center text-gray-500 text-sm">
              Need access?{' '}
              <a href="/training" className="text-secondary hover:text-secondary/80 transition-colors">
                Start Training
              </a>
            </p>
          </div>

          <div className="mt-12 pt-6 border-t border-white/5">
            <p className="text-xs text-gray-600 text-center">
              {new Date().toUTCString().slice(0, -4) + 'z'} | © {new Date().getFullYear()} Qantas Virtual | Privacy Policy | Terms of Service
            </p>
          </div>
        </motion.div>
      </div>

      {/* Right Panel - Image */}
      <div className="hidden lg:block flex-1 relative">
        <img 
          src={loginImage}
          alt="Qantas Aircraft"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#1a0202] via-transparent to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1a0202]/50 via-transparent to-transparent" />
      </div>
    </div>
  );
}