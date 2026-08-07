import React, { useState } from 'react';
import { MapPin } from 'lucide-react';

const typeColors = {
  hub: 'text-purple-600 drop-shadow-lg',
  destination: 'text-sky-500 drop-shadow-lg',
  waypoint: 'text-amber-500 drop-shadow-lg',
};

const typeBg = {
  hub: 'bg-purple-600',
  destination: 'bg-sky-500',
  waypoint: 'bg-amber-500',
};

export default function FictionalMap({ mapImageUrl, locations = [], onSelect, selectedId }) {
  const [hovered, setHovered] = useState(null);

  if (!mapImageUrl) {
    return (
      <div className="w-full aspect-[16/9] rounded-2xl border-2 border-dashed border-border bg-muted/40 flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <MapPin className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No map image uploaded yet.</p>
          <p className="text-xs mt-1">Upload a map image in the admin panel → Map Manager.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-border shadow-lg select-none"
         style={{ aspectRatio: '16/9' }}>
      <img
        src={mapImageUrl}
        alt="Route Map"
        className="w-full h-full object-cover"
        draggable={false}
      />
      {locations.map(loc => (
        <button
          key={loc.id}
          className="absolute transform -translate-x-1/2 -translate-y-1/2 group focus:outline-none"
          style={{ left: `${loc.x}%`, top: `${loc.y}%` }}
          onMouseEnter={() => setHovered(loc.id)}
          onMouseLeave={() => setHovered(null)}
          onClick={() => onSelect && onSelect(loc)}
        >
          {/* Pulse ring for hub */}
          {loc.type === 'hub' && (
            <span className="absolute inline-flex h-5 w-5 rounded-full bg-purple-400 opacity-40 animate-ping -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2" />
          )}
          <MapPin
            className={`w-7 h-7 transition-transform duration-150 group-hover:scale-125 ${
              selectedId === loc.id ? 'scale-125' : ''
            } ${typeColors[loc.type] || 'text-primary'}`}
            fill={selectedId === loc.id ? 'currentColor' : 'white'}
            strokeWidth={1.5}
          />
          {/* Tooltip */}
          {(hovered === loc.id) && (
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 pointer-events-none z-10">
              <div className="bg-foreground text-background text-xs rounded-lg px-3 py-1.5 whitespace-nowrap shadow-xl">
                <span className={`inline-block w-2 h-2 rounded-full mr-1.5 ${typeBg[loc.type]}`} />
                {loc.name}
              </div>
              <div className="w-2 h-2 bg-foreground rotate-45 mx-auto -mt-1" />
            </div>
          )}
        </button>
      ))}
    </div>
  );
}