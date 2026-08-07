import React, { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import { base44 } from '@/api/base44Client';
import { Shield } from 'lucide-react';

export default function AdminLayout() {
  const [status, setStatus] = useState('checking'); // 'checking' | 'allowed' | 'denied'

  useEffect(() => {
    async function check() {
      const isAuth = await base44.auth.isAuthenticated();
      if (!isAuth) {
        setStatus('denied');
        return;
      }
      const user = await base44.auth.me();
      // App owner (role=admin) always has access
      if (user.role === 'admin') {
        setStatus('allowed');
        return;
      }
      // Check AdminAccess list
      const entries = await base44.entities.AdminAccess.filter({ email: user.email });
      setStatus(entries.length > 0 ? 'allowed' : 'denied');
    }
    check();
  }, []);

  if (status === 'checking') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (status === 'denied') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background text-center px-6">
        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
          <Shield className="w-8 h-8 text-destructive" />
        </div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Access Denied</h1>
        <p className="text-muted-foreground max-w-sm">You don't have permission to access the admin panel.</p>
        <a href="/" className="text-primary underline text-sm">Return to homepage</a>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <main className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
