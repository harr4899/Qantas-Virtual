import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { 
  LayoutDashboard, Users, GraduationCap, Mail, BookOpen, FileText, 
  Plane, ArrowLeft, Paintbrush, Bell, Map, Settings, ShieldCheck, 
  Star, BarChart3, Globe, Inbox, MapPin, Layers, Radio, CalendarDays,
  ChevronDown, ChevronRight, Award
} from 'lucide-react';

const navSections = [
  {
    label: 'General',
    items: [
      { label: 'Dashboard', path: '/admin', icon: LayoutDashboard },
      { label: 'Site Customizer', path: '/admin/customizer', icon: Paintbrush },
      { label: 'Team Members', path: '/admin/team', icon: Users },
    ]
  },
  {
    label: 'Student Pilot',
    items: [
      { label: 'Student Access', path: '/admin/pilots', icon: Mail },
      { label: 'Training Sectors', path: '/admin/sectors', icon: BookOpen },
      { label: 'Final Exam', path: '/admin/exam', icon: FileText },
      { label: 'Student Progress', path: '/admin/progress', icon: GraduationCap },
      { label: 'Training Settings', path: '/admin/training-settings', icon: Settings },
    ]
  },
  {
    label: 'Pilot Roster',
    items: [
      { label: 'Pilot Roster', path: '/admin/roster', icon: Users },
      { label: 'Pilot Ranks', path: '/admin/ranks', icon: Star },
      { label: 'Pilot Badges', path: '/admin/badges', icon: Award },
      { label: 'Ops Settings', path: '/admin/pilot-ops', icon: Settings },
    ]
  },
  {
    label: 'Flight Operations',
    items: [
      { label: 'Routes', path: '/admin/routes', icon: Map },
      { label: 'Airports', path: '/admin/airports', icon: MapPin },
      { label: 'NOTAMs', path: '/admin/notams', icon: Bell },
      { label: 'Live Tracking', path: '/admin/live-tracking', icon: Radio },
      { label: 'Flight Reports', path: '/admin/flight-reports', icon: BarChart3 },
      { label: 'Events', path: '/admin/events', icon: CalendarDays },
    ]
  },
  {
    label: 'Public Site',
    items: [
      { label: 'Map Locations', path: '/admin/map', icon: Globe },
      { label: 'Home Stats', path: '/admin/stats', icon: BarChart3 },
      { label: 'Fleet', path: '/admin/fleet', icon: Layers },
      { label: 'Public Bookings', path: '/admin/public-bookings', icon: Inbox },
    ]
  },
  {
    label: 'Security',
    items: [
      { label: 'Admin Access', path: '/admin/access', icon: ShieldCheck },
    ]
  },
];

function NavSection({ section, location, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  const isAnyActive = section.items.some(i => location.pathname === i.path);

  return (
    <div>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-3 py-1.5 mb-1 group"
      >
        <p className="text-[10px] uppercase tracking-[0.15em] text-sidebar-foreground/40 font-semibold group-hover:text-sidebar-foreground/60 transition-colors">
          {section.label}
        </p>
        {open
          ? <ChevronDown className="w-3 h-3 text-sidebar-foreground/30" />
          : <ChevronRight className="w-3 h-3 text-sidebar-foreground/30" />
        }
      </button>
      {open && (
        <div className="space-y-0.5">
          {section.items.map(item => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  active
                    ? 'bg-sidebar-accent text-sidebar-primary'
                    : 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50'
                }`}
              >
                <item.icon className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function AdminSidebar() {
  const location = useLocation();
  const { settings } = useSiteSettings();

  return (
    <aside className="w-60 min-h-screen bg-sidebar text-sidebar-foreground border-r border-sidebar-border flex flex-col">
      <div className="p-5 border-b border-sidebar-border">
        <Link to="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
          {settings.site_logo ? (
            <img src={settings.site_logo} alt="Logo" className="h-8 w-auto object-contain" />
          ) : (
            <>
              <div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center">
                <Plane className="w-3.5 h-3.5 text-sidebar-primary-foreground" />
              </div>
              <div>
                <span className="font-heading text-sm font-bold">Qantas Virtual</span>
                <span className="block text-[9px] uppercase tracking-[0.2em] text-sidebar-foreground/50">Admin</span>
              </div>
            </>
          )}
        </Link>
      </div>

      <nav className="flex-1 p-3 space-y-3 overflow-y-auto">
        {navSections.map(section => (
          <NavSection key={section.label} section={section} location={location} defaultOpen={true} />
        ))}
      </nav>

      <div className="p-3 border-t border-sidebar-border">
        <Link
          to="/"
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Site
        </Link>
      </div>
    </aside>
  );
}