import React, { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';

const STORAGE_KEY = 'qv-theme-mode';

export function applyTheme(mode) {
  const root = document.documentElement;
  // Clean up any legacy multi-theme style tag
  const oldStyle = document.getElementById('qv-theme-style');
  if (oldStyle) oldStyle.remove();
  localStorage.removeItem('qv_active_theme');

  if (mode === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
  localStorage.setItem(STORAGE_KEY, mode);
}

export function initTheme() {
  const saved = localStorage.getItem(STORAGE_KEY) || 'light';
  applyTheme(saved);
}

export default function ThemeSwitcher() {
  const [mode, setMode] = useState(() => localStorage.getItem(STORAGE_KEY) || 'light');

  useEffect(() => {
    applyTheme(mode);
  }, []);

  const toggle = () => {
    const newMode = mode === 'dark' ? 'light' : 'dark';
    setMode(newMode);
    applyTheme(newMode);
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
      className="h-9 w-9 text-foreground hover:bg-muted shrink-0"
      aria-label="Toggle light/dark theme"
    >
      {mode === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </Button>
  );
}