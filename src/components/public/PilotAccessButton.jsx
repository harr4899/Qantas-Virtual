import React from 'react';
import { Link } from 'react-router-dom';
import { Plane } from 'lucide-react';

export default function PilotAccessButton() {
  return (
    <Link
      to="/pilot-login"
      className="fixed bottom-6 left-6 z-50 flex items-center gap-2 bg-gradient-to-r from-primary to-primary/80 text-white px-4 py-2.5 rounded-full shadow-lg hover:from-primary/90 hover:to-primary/70 transition-all text-sm font-medium"
    >
      <Plane className="w-4 h-4" />
      Pilot Login
    </Link>
  );
}