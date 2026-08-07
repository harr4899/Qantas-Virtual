import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { Plane, Menu, X, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ThemeSwitcher from '@/components/ThemeSwitcher';

const primaryLinks = [
  { label: 'Home', path: '/' },
  { label: 'Routes', path: '/routes' },
  { label: 'Fleet', path: '/fleet' },
];

const moreLinks = [
  { label: 'Live', path: '/live' },
  { label: 'Events', path: '/events' },
  { label: 'Crew', path: '/crew' },
  { label: 'Team', path: '/team' },
];

export default function Navbar() {
  const { settings } = useSiteSettings();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const location = useLocation();

  const isActive = (path) => location.pathname === path;
  const moreActive = moreLinks.some(l => isActive(l.path));

  return (
    <nav className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border">
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 shrink-0">
          {settings.site_logo ? (
            <img src={settings.site_logo} alt="Logo" className="h-9 w-auto object-contain" />
          ) : (
            <>
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Plane className="w-3.5 h-3.5 text-primary-foreground" />
              </div>
              <span className="font-heading text-base font-bold text-foreground">Qantas Virtual</span>
            </>
          )}
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-0.5">
          {primaryLinks.map(link => (
            <Link
              key={link.path}
              to={link.path}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                isActive(link.path)
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              {link.label}
            </Link>
          ))}

          {/* More dropdown */}
          <div className="relative">
            <button
              onClick={() => setMoreOpen(o => !o)}
              onBlur={() => setTimeout(() => setMoreOpen(false), 150)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                moreActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              More <ChevronDown className={`w-3.5 h-3.5 transition-transform ${moreOpen ? 'rotate-180' : ''}`} />
            </button>
            {moreOpen && (
              <div className="absolute right-0 top-full mt-1 w-44 bg-background border border-border rounded-xl shadow-lg overflow-hidden z-50">
                {moreLinks.map(link => (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setMoreOpen(false)}
                    className={`block px-4 py-2.5 text-sm font-medium transition-colors ${
                      isActive(link.path)
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        <ThemeSwitcher />

        {/* Mobile hamburger */}
        <Button variant="ghost" size="icon" className="md:hidden h-8 w-8" onClick={() => setMobileOpen(o => !o)}>
          {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </Button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-background px-4 py-3 grid grid-cols-2 gap-1">
          {[...primaryLinks, ...moreLinks].map(link => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setMobileOpen(false)}
              className={`px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive(link.path)
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}