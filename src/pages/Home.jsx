import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import Navbar from '../components/public/Navbar';
import Footer from '../components/public/Footer';
import FictionalMap from '../components/public/FictionalMap';
import LiveFlightsMap from '../components/public/LiveFlightsMap';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Plane, ArrowRight, Globe, Users, Star, TrendingUp, Award, CheckCircle, Clock, Shield, Map } from 'lucide-react';
import { motion } from 'framer-motion';

const iconMap = { Globe, Plane, Users, Star, TrendingUp, Award, Map, CheckCircle, Clock, Shield };

function PilotAccessButton() {
  return (
    <Link to="/pilot-login">
      <button className="fixed bottom-6 right-6 z-50 bg-primary text-primary-foreground rounded-full shadow-2xl px-5 py-3 flex items-center gap-2 text-sm font-semibold hover:bg-primary/90 transition-all hover:scale-105">
        <Plane className="w-4 h-4" /> Pilot Portal
      </button>
    </Link>
  );
}

function AdminButton() {
  return (
    <Link to="/admin">
      <button className="fixed bottom-6 right-44 z-50 bg-foreground text-background rounded-full shadow-xl px-4 py-3 flex items-center gap-2 text-xs font-semibold hover:bg-foreground/80 transition-all hover:scale-105">
        Admin
      </button>
    </Link>
  );
}

export default function Home() {
  const [selectedLocation, setSelectedLocation] = useState(null);
  const { settings } = useSiteSettings();

  const { data: stats = [] } = useQuery({
    queryKey: ['home-stats'],
    queryFn: () => base44.entities.HomeStats.list('order'),
  });

  const { data: locations = [] } = useQuery({
    queryKey: ['map-locations'],
    queryFn: () => base44.entities.MapLocation.filter({ active: true }),
  });

  const mapImageUrl = settings.map_image_url || null;

  // Hero settings from customizer
  const heroBadge = settings.hero_badge || 'VATSIM Virtual Airline';
  const heroLine1 = settings.hero_heading_line1 || 'Spirit of';
  const heroLine2 = settings.hero_heading_line2 || 'Australia';
  const heroSubtext = settings.hero_subtext || 'Experience the iconic flying kangaroo on the VATSIM network. Join Qantas Virtual and fly world-class routes across the globe.';
  const heroImage = settings.hero_image || 'https://images.unsplash.com/photo-1556388158-158ea5ccacbd?w=1800&auto=format&fit=crop';
  const heroOverlayOpacity = settings.hero_overlay_opacity != null ? Number(settings.hero_overlay_opacity) / 100 : (settings.hero_overlay_color ? undefined : 0.55);
  const heroOverlay = settings.hero_overlay_color && settings.hero_overlay_opacity == null
    ? settings.hero_overlay_color
    : `rgba(0,0,0,${heroOverlayOpacity})`;
  const heroH1Color = settings.hero_heading1_color || '#ffffff';
  const heroH2Color = settings.hero_heading2_color || '#C8102E';
  const heroBadgeBg = settings.hero_badge_color || 'rgba(200,16,46,0.18)';
  const heroBadgeTextColor = settings.hero_badge_text_color || '#ffffff';
  const heroSubtextColor = settings.hero_subtext_color || 'rgba(255,255,255,0.75)';

  // About settings
  const aboutBadge = settings.about_badge || 'Who We Are';
  const aboutHeading = settings.about_heading || 'What We Do';
  const aboutBody1 = settings.about_body1 || 'Qantas Virtual is a premier virtual airline operating on the VATSIM network. We recreate the authentic Qantas experience with professional pilot training and world-class routes.';
  const aboutBody2 = settings.about_body2 || 'Whether you\'re a seasoned simmer or new to flight simulation, our community welcomes you with comprehensive training programs and a passion for aviation.';
  const aboutImage = settings.about_image || 'https://images.unsplash.com/photo-1540339832862-474599807836?w=1200&auto=format&fit=crop';
  const aboutBgColor = settings.about_bg_color || '';
  const aboutHeadingColor = settings.about_heading_color || '';
  const aboutBadgeColor = settings.about_badge_color || '#C8102E';
  const aboutTextColor = settings.about_text_color || '';

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* ── HERO (full-width background) ── */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden" style={{ backgroundColor: '#0f0202' }}>
        {/* Full-width background image */}
        <div className="absolute inset-0">
          <img
            src={heroImage}
            alt="Hero"
            className="absolute inset-0 w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0" style={{ backgroundColor: heroOverlay }} />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 py-24 w-full flex flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-3xl"
          >
            {/* Logo */}
            {settings.site_logo && (
              <img src={settings.site_logo} alt="Logo" className="h-16 w-auto object-contain mb-8 mx-auto" />
            )}

            {/* Badge */}
            <span
              className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold tracking-widest uppercase mb-6"
              style={{ backgroundColor: heroBadgeBg, color: heroBadgeTextColor }}
            >
              {heroBadge}
            </span>

            {/* Heading */}
            <h1 className="font-heading text-6xl md:text-8xl font-bold leading-tight mb-6">
              <span style={{ color: heroH1Color }}>{heroLine1}</span>
              <br />
              <span style={{ color: heroH2Color }}>{heroLine2}</span>
            </h1>

            <p className="text-lg max-w-xl mx-auto mb-10 leading-relaxed" style={{ color: heroSubtextColor }}>
              {heroSubtext}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/routes">
                <Button size="lg" className="bg-secondary text-secondary-foreground hover:bg-secondary/90 font-semibold px-8">
                  Explore Routes <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── STATS ── */}
      {stats.length > 0 && (
        <section className="py-16 bg-foreground text-background">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, i) => {
                const Icon = iconMap[stat.icon] || Globe;
                return (
                  <motion.div
                    key={stat.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="text-center"
                  >
                    <div className="w-12 h-12 rounded-full bg-secondary/20 flex items-center justify-center mx-auto mb-4">
                      <Icon className="w-6 h-6 text-secondary" />
                    </div>
                    <p className="font-heading text-3xl font-bold text-background mb-1">{stat.value}</p>
                    <p className="text-sm text-background/60">{stat.label}</p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── ABOUT ── */}
      <section className="py-24" style={{ backgroundColor: aboutBgColor || undefined }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <span className="text-xs font-semibold uppercase tracking-widest mb-3 block" style={{ color: aboutBadgeColor }}>
                {aboutBadge}
              </span>
              <h2 className="font-heading text-4xl font-bold mb-6" style={{ color: aboutHeadingColor || undefined }}>
                {aboutHeading}
              </h2>
              <p className="leading-relaxed text-lg mb-4" style={{ color: aboutTextColor || undefined }}>
                {aboutBody1}
              </p>
              {aboutBody2 && (
                <p className="leading-relaxed" style={{ color: aboutTextColor ? `${aboutTextColor}99` : undefined }}>
                  {aboutBody2}
                </p>
              )}
              <div className="mt-8 flex gap-4">
                <Link to="/team">
                  <Button variant="outline">Meet the Team <ArrowRight className="w-4 h-4 ml-2" /></Button>
                </Link>
              </div>
            </motion.div>
            {aboutImage && (
              <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
                <img src={aboutImage} alt="About" className="w-full rounded-2xl shadow-2xl object-cover max-h-96" />
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* ── MAP ── */}
      {(mapImageUrl || locations.length > 0) && (
        <section className="py-20 bg-muted/30">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-12">
              <span className="text-xs font-semibold uppercase tracking-widest text-secondary mb-3 block">Explore</span>
              <h2 className="font-heading text-4xl font-bold text-foreground mb-4">Our Route Network</h2>
              <p className="text-muted-foreground max-w-xl mx-auto">Click any location on the map to learn more and book a flight.</p>
            </div>

            <FictionalMap
              mapImageUrl={mapImageUrl}
              locations={locations}
              onSelect={setSelectedLocation}
              selectedId={selectedLocation?.id}
            />

            {selectedLocation && (
              <Card className="mt-6 p-5 border-primary/30 bg-primary/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-heading text-lg font-bold text-foreground">{selectedLocation.name}</h3>
                    {selectedLocation.description && <p className="text-muted-foreground text-sm mt-1">{selectedLocation.description}</p>}
                    <Badge className="mt-2 capitalize">{selectedLocation.type}</Badge>
                  </div>
                </div>
                <div className="flex gap-3 shrink-0">
                  <Link to={`/book?destination=${encodeURIComponent(selectedLocation.name)}`}>
                    <Button><Plane className="w-4 h-4 mr-2" />Book a Flight</Button>
                  </Link>
                  <Button variant="outline" onClick={() => setSelectedLocation(null)}>Close</Button>
                </div>
              </Card>
            )}

            <div className="text-center mt-10">
              <Link to="/routes">
                <Button variant="outline" size="lg">
                  View All Routes <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      <LiveFlightsMap />

      <Footer />
      <PilotAccessButton />
      <AdminButton />
    </div>
  );
}