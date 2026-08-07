import React from 'react';
import PilotFlightStats from '@/components/pilot/PilotFlightStats';
import { BarChart3 } from 'lucide-react';

export default function FlightReports() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <BarChart3 className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Flight Reports & Analytics</h1>
          <p className="text-sm text-muted-foreground">Overview of all completed post-flight reports</p>
        </div>
      </div>
      <PilotFlightStats isAdmin={true} />
    </div>
  );
}