import React from 'react';
import { motion } from 'framer-motion';
import { Target, Heart, Globe, Shield } from 'lucide-react';
import { useSiteSettings } from '../../hooks/useSiteSettings';

const DEFAULT_IMAGE = 'https://media.base44.com/images/public/69df1958359b88c883afde49/eb3b19b7b_generated_3abe343e.png';

const values = [
  { icon: Target, title: 'Our Mission', text: 'To deliver the most authentic Thai Airways virtual flying experience on the VATSIM network, with dedication to realism and community.' },
  { icon: Heart, title: 'Our Passion', text: 'We are united by our love for aviation and the beauty of Thai hospitality. Every flight we operate carries the spirit of Thailand.' },
  { icon: Globe, title: 'Global Network', text: 'Fly Thai Airways routes connecting Bangkok to destinations worldwide — from London to Sydney, Tokyo to Los Angeles.' },
  { icon: Shield, title: 'Excellence', text: 'We strive for the highest standards in pilot training, operations, and professionalism on the VATSIM network.' },
];

export default function AboutSection() {
  const { settings } = useSiteSettings();

  const bgColor = settings.about_bg_color || undefined;
  const badgeColor = settings.about_badge_color || undefined;
  const headingColor = settings.about_heading_color || undefined;
  const textColor = settings.about_text_color || undefined;
  const image = settings.about_image || DEFAULT_IMAGE;

  return (
    <section className="py-28" style={bgColor ? { backgroundColor: bgColor } : {}}>
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center mb-24">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <span
              className="font-medium text-sm uppercase tracking-[0.2em]"
              style={badgeColor ? { color: badgeColor } : { color: 'hsl(var(--secondary))' }}
            >
              {settings.about_badge || 'Who We Are'}
            </span>
            <h2
              className="font-heading text-4xl md:text-5xl font-bold mt-3 mb-6 leading-tight"
              style={headingColor ? { color: headingColor } : { color: 'hsl(var(--foreground))' }}
            >
              {settings.about_heading || 'What We Do'}
            </h2>
            <p
              className="text-lg leading-relaxed mb-6"
              style={textColor ? { color: textColor } : { color: 'hsl(var(--muted-foreground))' }}
            >
              {settings.about_body1 || 'TG Virtual is a premier Thai Airways virtual airline operating on the VATSIM network.'}
            </p>
            <p
              className="leading-relaxed"
              style={textColor ? { color: textColor } : { color: 'hsl(var(--muted-foreground))' }}
            >
              {settings.about_body2 || "Whether you're a seasoned simmer or new to flight simulation, our community welcomes you."}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            <div className="rounded-2xl overflow-hidden shadow-2xl">
              <img src={image} alt="About Thai Airways VA" className="w-full h-80 object-cover" />
            </div>
            <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-secondary/20 rounded-2xl -z-10" />
            <div className="absolute -top-6 -right-6 w-24 h-24 bg-primary/10 rounded-2xl -z-10" />
          </motion.div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {values.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="bg-card rounded-2xl p-8 border border-border/50 hover:border-primary/30 hover:shadow-lg transition-all group"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/20 transition-colors">
                <item.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-heading text-lg font-semibold text-foreground mb-3">{item.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{item.text}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
