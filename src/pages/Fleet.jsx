import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import Navbar from '../components/public/Navbar';
import Footer from '../components/public/Footer';
import { Plane } from 'lucide-react';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import FleetAircraftCard from '@/components/public/FleetAircraftCard';

export default function Fleet() {
  const { settings } = useSiteSettings();

  const { data: aircraft = [], isLoading } = useQuery({
    queryKey: ['fleet'],
    queryFn: () => base44.entities.FleetAircraft.filter({ active: true }, 'display_order'),
  });

  const fleetBadge = settings.fleet_badge || 'Our Fleet';
  const fleetHeading = settings.fleet_heading || 'Fleet Showcase';
  const fleetSubtext = settings.fleet_subtext || 'Explore the aircraft that make up our virtual airline fleet.';
  const section1Name = settings.fleet_section_1_name || 'Section 1';
  const section2Name = settings.fleet_section_2_name || 'Section 2';

  const section1 = aircraft.filter(a => a.section !== 2);
  const section2 = aircraft.filter(a => a.section === 2);

  const renderSection = (name, items) => {
    if (items.length === 0) return null;
    return (
      <div className="mb-14">
        <h2 className="font-heading text-2xl font-bold text-foreground mb-6">{name}</h2>
        <div className="grid md:grid-cols-2 gap-8">
          {items.map((ac, i) => <FleetAircraftCard key={ac.id} ac={ac} index={i} />)}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <span className="text-xs font-semibold uppercase tracking-widest text-primary mb-3 block">{fleetBadge}</span>
          <h1 className="font-heading text-4xl font-bold text-foreground mb-3">{fleetHeading}</h1>
          <p className="text-muted-foreground max-w-xl mx-auto">{fleetSubtext}</p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          </div>
        ) : aircraft.length === 0 ? (
          <div className="text-center py-20">
            <Plane className="w-16 h-16 text-muted-foreground/20 mx-auto mb-4" />
            <p className="text-muted-foreground">No aircraft in the fleet yet.</p>
          </div>
        ) : (
          <>
            {renderSection(section1Name, section1)}
            {renderSection(section2Name, section2)}
          </>
        )}
      </div>

      <Footer />
    </div>
  );
}