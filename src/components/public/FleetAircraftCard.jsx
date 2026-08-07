import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Plane, Zap, Users, Navigation } from 'lucide-react';
import { motion } from 'framer-motion';

export default function FleetAircraftCard({ ac, index = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow"
    >
      {ac.image_url ? (
        <div className="relative h-56 overflow-hidden">
          <img src={ac.image_url} alt={ac.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-4 left-4 right-4">
            <h2 className="font-heading text-xl font-bold text-white">{ac.name}</h2>
            {ac.registration && (
              <Badge className="mt-1 bg-white/20 text-white border-white/30 backdrop-blur-sm">
                {ac.registration}
              </Badge>
            )}
          </div>
        </div>
      ) : (
        <div className="h-56 bg-gradient-to-br from-primary/10 to-secondary/20 flex flex-col items-center justify-center">
          <Plane className="w-16 h-16 text-primary/40 mb-3" />
          <h2 className="font-heading text-xl font-bold text-foreground">{ac.name}</h2>
          {ac.registration && <Badge variant="outline" className="mt-1">{ac.registration}</Badge>}
        </div>
      )}

      <div className="p-5">
        {ac.description && (
          <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{ac.description}</p>
        )}

        <div className="grid grid-cols-2 gap-3">
          {ac.icao_code && (
            <div className="flex items-center gap-2 text-sm">
              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Plane className="w-3.5 h-3.5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Type</p>
                <p className="font-semibold text-foreground">{ac.icao_code}</p>
              </div>
            </div>
          )}
          {ac.range_nm > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Navigation className="w-3.5 h-3.5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Range</p>
                <p className="font-semibold text-foreground">{ac.range_nm.toLocaleString()} NM</p>
              </div>
            </div>
          )}
          {ac.cruise_speed_kts > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Zap className="w-3.5 h-3.5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Cruise Speed</p>
                <p className="font-semibold text-foreground">{ac.cruise_speed_kts} kts</p>
              </div>
            </div>
          )}
          {ac.capacity > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Users className="w-3.5 h-3.5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Capacity</p>
                <p className="font-semibold text-foreground">{ac.capacity} pax</p>
              </div>
            </div>
          )}
        </div>

        {ac.engines && (
          <div className="mt-3 pt-3 border-t">
            <p className="text-xs text-muted-foreground">Engines: <span className="text-foreground font-medium">{ac.engines}</span></p>
          </div>
        )}
      </div>
    </motion.div>
  );
}