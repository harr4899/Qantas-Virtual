import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Palette, Check, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { applyTheme } from '@/components/ThemeSwitcher';

// All Qantas-themed colour palettes
const THEMES = [
  {
    id: 'qantas_classic',
    name: 'Qantas Classic',
    description: 'The iconic red and white — the original Qantas brand.',
    primary: '#C8102E',
    preview: ['#C8102E', '#ffffff', '#1a1a1a'],
  },
  {
    id: 'qantas_dark_red',
    name: 'Deep Red',
    description: 'A deeper, more dramatic Qantas red with dark accents.',
    primary: '#8B0D1C',
    preview: ['#8B0D1C', '#f8f8f8', '#0f0202'],
  },
  {
    id: 'qantas_crimson',
    name: 'Crimson',
    description: 'Warm crimson tones — bold and modern.',
    primary: '#DC143C',
    preview: ['#DC143C', '#fff5f5', '#1c0808'],
  },
  {
    id: 'qantas_outback',
    name: 'Outback Gold',
    description: 'Red primary with warm amber/gold accents inspired by the Australian outback.',
    primary: '#C8102E',
    accent: '#d97706',
    preview: ['#C8102E', '#d97706', '#1a1200'],
  },
  {
    id: 'qantas_platinum',
    name: 'Platinum',
    description: 'Sophisticated silver and grey with Qantas red highlights.',
    primary: '#C8102E',
    accent: '#9ca3af',
    preview: ['#C8102E', '#9ca3af', '#1f2937'],
  },
  {
    id: 'qantas_midnight',
    name: 'Midnight Sky',
    description: 'Dark navy sky tones with Qantas red — great for a sleek night feel.',
    primary: '#C8102E',
    accent: '#1e3a5f',
    preview: ['#C8102E', '#1e3a5f', '#0a0f1e'],
  },
];

// CSS variable maps per theme
const THEME_CSS = {
  qantas_classic: {
    '--primary': '354 85% 40%',
    '--primary-foreground': '0 0% 100%',
    '--sidebar-background': '0 0% 8%',
    '--sidebar-primary': '354 85% 50%',
    '--ring': '354 85% 40%',
    '--accent': '354 40% 92%',
    '--accent-foreground': '354 85% 30%',
  },
  qantas_dark_red: {
    '--primary': '351 84% 29%',
    '--primary-foreground': '0 0% 100%',
    '--sidebar-background': '351 50% 5%',
    '--sidebar-primary': '351 84% 40%',
    '--ring': '351 84% 29%',
    '--accent': '351 30% 90%',
    '--accent-foreground': '351 84% 20%',
  },
  qantas_crimson: {
    '--primary': '348 83% 47%',
    '--primary-foreground': '0 0% 100%',
    '--sidebar-background': '348 40% 6%',
    '--sidebar-primary': '348 83% 55%',
    '--ring': '348 83% 47%',
    '--accent': '348 60% 94%',
    '--accent-foreground': '348 83% 30%',
  },
  qantas_outback: {
    '--primary': '354 85% 40%',
    '--primary-foreground': '0 0% 100%',
    '--sidebar-background': '30 50% 6%',
    '--sidebar-primary': '354 85% 50%',
    '--ring': '354 85% 40%',
    '--accent': '38 92% 92%',
    '--accent-foreground': '38 92% 30%',
  },
  qantas_platinum: {
    '--primary': '354 85% 40%',
    '--primary-foreground': '0 0% 100%',
    '--sidebar-background': '220 15% 12%',
    '--sidebar-primary': '354 85% 50%',
    '--ring': '354 85% 40%',
    '--accent': '220 15% 92%',
    '--accent-foreground': '220 15% 20%',
  },
  qantas_midnight: {
    '--primary': '354 85% 40%',
    '--primary-foreground': '0 0% 100%',
    '--sidebar-background': '214 50% 8%',
    '--sidebar-primary': '354 85% 50%',
    '--ring': '354 85% 40%',
    '--accent': '214 50% 92%',
    '--accent-foreground': '214 50% 20%',
  },
};

export default function ThemeSettings() {
  const [active, setActive] = useState(() => localStorage.getItem('qv_active_theme') || 'qantas_classic');

  const handleApply = (themeId) => {
    applyTheme(themeId);
    setActive(themeId);
    toast.success('Theme applied!');
  };

  const handleReset = () => {
    handleApply('qantas_classic');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Theme Settings</h1>
          <p className="text-muted-foreground text-sm mt-1">Choose a Qantas colour palette for the site</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleReset} className="border-border bg-background text-foreground hover:bg-muted">
          <RotateCcw className="w-3.5 h-3.5 mr-2" />Reset to Default
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {THEMES.map(theme => {
          const isActive = active === theme.id;
          return (
            <Card
              key={theme.id}
              className={`p-4 cursor-pointer transition-all ${isActive ? 'ring-2 ring-primary shadow-md' : 'hover:shadow-md hover:border-primary/30'}`}
              onClick={() => handleApply(theme.id)}
            >
              {/* Color swatches */}
              <div className="flex gap-1.5 mb-3">
                {theme.preview.map((color, i) => (
                  <div key={i} className="w-8 h-8 rounded-lg shadow-sm border border-black/10" style={{ backgroundColor: color }} />
                ))}
              </div>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-sm text-foreground">{theme.name}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{theme.description}</p>
                </div>
                {isActive && (
                  <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5 text-white" />
                  </div>
                )}
              </div>
              {isActive && (
                <Badge className="mt-2 text-xs bg-primary/10 text-primary border-primary/20">Active</Badge>
              )}
            </Card>
          );
        })}
      </div>

      <Card className="p-4 bg-amber-50 border-amber-200">
        <div className="flex gap-3">
          <Palette className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Theme applies instantly</p>
            <p className="text-xs text-amber-700 mt-0.5">
              The theme is applied to your browser and saved locally. All colours are Qantas-brand aligned variations. 
              Theme resets on clear cache — for permanent changes, contact your developer.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}