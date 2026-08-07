import React from 'react';
import { Link } from 'react-router-dom';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { Plane } from 'lucide-react';

export default function Footer() {
  const { settings } = useSiteSettings();

  return (
    <footer className="bg-foreground text-background/80 py-12">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          {settings.site_logo ? (
              <img src={settings.site_logo} alt="Logo" className="h-8 w-auto object-contain brightness-0 invert" />
            ) : (
            <>
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Plane className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-heading text-base font-bold text-background">Qantas Virtual</span>
            </>
          )}
        </div>
        <div className="flex gap-6 text-sm">
          <Link to="/" className="hover:text-background transition-colors">Home</Link>
          <Link to="/fleet" className="hover:text-background transition-colors">Fleet</Link>
          <Link to="/routes" className="hover:text-background transition-colors">Routes</Link>
          <Link to="/book" className="hover:text-background transition-colors">Book</Link>
          <Link to="/live" className="hover:text-background transition-colors">Live</Link>
          <Link to="/events" className="hover:text-background transition-colors">Events</Link>
          <Link to="/crew" className="hover:text-background transition-colors">Crew</Link>
          <Link to="/team" className="hover:text-background transition-colors">Team</Link>
        </div>
        <p className="text-xs text-background/40">© {new Date().getFullYear()} Qantas Virtual. All rights reserved.</p>
      </div>
    </footer>
  );
}