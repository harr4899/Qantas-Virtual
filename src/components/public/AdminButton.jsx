import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';

export default function AdminButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    async function check() {
      const isAuth = await base44.auth.isAuthenticated();
      if (!isAuth) return;
      const user = await base44.auth.me();
      if (user.role === 'admin') {
        setVisible(true);
        return;
      }
      const entries = await base44.entities.AdminAccess.filter({ email: user.email });
      if (entries.length > 0) setVisible(true);
    }
    check();
  }, []);

  if (!visible) return null;

  return (
    <Link
      to="/admin"
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-sidebar text-sidebar-foreground px-4 py-2.5 rounded-full shadow-lg border border-sidebar-border hover:bg-sidebar-accent transition-all text-sm font-medium"
    >
      <ShieldCheck className="w-4 h-4 text-sidebar-primary" />
      Admin Panel
    </Link>
  );
}