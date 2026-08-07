import React from 'react';
import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { useSiteSettings } from '../../hooks/useSiteSettings';

const DEFAULT_IMAGE = 'https://media.base44.com/images/public/69df1958359b88c883afde49/b21d1ad54_generated_5ca56207.png';

export default function HeroSection() {
  const { settings, isLoading } = useSiteSettings();

  const image = settings.hero_image || DEFAULT_IMAGE;
  const heading1Color = settings.hero_heading1_color || '#ffffff';
  const heading2Color = settings.hero_heading2_color || '#C9A227';
  const badgeTextColor = settings.hero_badge_text_color || '#ffffff';
  const subtextColor = settings.hero_subtext_color || 'rgba(255,255,255,0.7)';
  const badgeBg = settings.hero_badge_color || 'rgba(255,255,255,0.1)';
  const overlay = settings.hero_overlay_color || 'rgba(0,0,0,0.4)';

  return (
    <section className="relative h-screen min-h-[700px] flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0">
        {isLoading ? (
          <div className="w-full h-full bg-slate-900" />
        ) : (
          <>
            <img src={image} alt="Hero background" className="w-full h-full object-cover" />
            <div
              className="absolute inset-0"
              style={{ background: `linear-gradient(to bottom, ${overlay} 0%, rgba(0,0,0,0.15) 40%, rgba(0,0,0,0.6) 100%)` }}
            />
          </>
        )}
      </div>

      <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: 'easeOut' }}
        >
          <span
            className="inline-block px-4 py-1.5 rounded-full border border-white/20 text-xs uppercase tracking-[0.3em] font-medium mb-6 backdrop-blur-sm"
            style={{ backgroundColor: badgeBg, color: badgeTextColor }}
          >
            {settings.hero_badge || 'VATSIM Virtual Airline'}
          </span>
          <h1 className="font-heading text-5xl md:text-7xl lg:text-8xl font-bold leading-[0.95] mb-6">
            <span style={{ color: heading1Color }}>{settings.hero_heading_line1 || 'Smooth as'}</span>
            <span className="block" style={{ color: heading2Color }}>{settings.hero_heading_line2 || 'Silk'}</span>
          </h1>
          <p className="text-lg md:text-xl max-w-2xl mx-auto font-light leading-relaxed" style={{ color: subtextColor }}>
            {settings.hero_subtext || 'Experience the elegance of Thai Airways on the VATSIM network. Join our virtual airline and fly iconic routes across the globe.'}
          </p>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 1 }}
        className="absolute bottom-12 left-1/2 -translate-x-1/2"
      >
        <ChevronDown className="w-6 h-6 animate-bounce" style={{ color: badgeTextColor }} />
      </motion.div>
    </section>
  );
}