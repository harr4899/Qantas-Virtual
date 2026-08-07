import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Plane, ArrowRight } from 'lucide-react';
import FictionalMap from './FictionalMap';

export default function HomeMapSection() {
  const [selected, setSelected] = useState(null);
  const { settings } = useSiteSettings();

  const { data: locations = [] } = useQuery({
    queryKey: ['map-locations'],
    queryFn: () => base44.entities.MapLocation.filter({ active: true }),
  });

  const mapImageUrl = settings.map_image_url || null;

  if (!mapImageUrl && locations.length === 0) return null;

  return (
    <section className="py-20 bg-background">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-12">
          <span className="text-xs font-semibold uppercase tracking-widest text-secondary mb-3 block">Explore</span>
          <h2 className="font-heading text-4xl font-bold text-foreground mb-4">Our Route Network</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">Click any location on the map to learn more and book a flight.</p>
        </div>

        <FictionalMap
          mapImageUrl={mapImageUrl}
          locations={locations}
          onSelect={setSelected}
          selectedId={selected?.id}
        />

        {selected && (
          <Card className="mt-6 p-5 border-primary/30 bg-primary/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <MapPin className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-heading text-lg font-bold text-foreground">{selected.name}</h3>
                {selected.description && <p className="text-muted-foreground text-sm mt-1">{selected.description}</p>}
                <Badge className="mt-2 capitalize">{selected.type}</Badge>
              </div>
            </div>
            <div className="flex gap-3 shrink-0">
              <Link to={`/book?destination=${encodeURIComponent(selected.name)}`}>
                <Button><Plane className="w-4 h-4 mr-2" />Book a Flight</Button>
              </Link>
              <Button variant="outline" onClick={() => setSelected(null)}>Close</Button>
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
  );
}