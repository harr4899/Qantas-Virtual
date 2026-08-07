import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import Navbar from '../components/public/Navbar';
import Footer from '../components/public/Footer';
import PilotAccessButton from '../components/public/PilotAccessButton';
import { useSiteSettings } from '../hooks/useSiteSettings';
import { motion } from 'framer-motion';
import { Users } from 'lucide-react';

export default function Team() {
  const { data: members = [], isLoading } = useQuery({
    queryKey: ['team-members'],
    queryFn: () => base44.entities.TeamMember.list('display_order'),
  });

  const { settings } = useSiteSettings();

  const bgColor = settings.team_bg_color || undefined;
  const headingColor = settings.team_heading_color || undefined;
  const textColor = settings.team_text_color || undefined;

  return (
    <div className="min-h-screen">
      <Navbar />

      <section
        className="pt-32 pb-12"
        style={bgColor
          ? { backgroundColor: bgColor }
          : { background: 'linear-gradient(to bottom, hsl(var(--primary)/0.05), hsl(var(--background)))' }
        }
      >
        <div className="max-w-7xl mx-auto px-6 text-center">
          <span
            className="font-medium text-sm uppercase tracking-[0.2em]"
            style={headingColor ? { color: headingColor } : { color: 'hsl(var(--secondary))' }}
          >
            {settings.team_badge || 'Our People'}
          </span>
          <h1
            className="font-heading text-5xl md:text-6xl font-bold mt-3 mb-4"
            style={headingColor ? { color: headingColor } : { color: 'hsl(var(--foreground))' }}
          >
            {settings.team_heading || 'Meet the Team'}
          </h1>
          <p
            className="text-lg max-w-2xl mx-auto"
            style={textColor ? { color: textColor } : { color: 'hsl(var(--muted-foreground))' }}
          >
            {settings.team_subtext || 'The dedicated individuals who keep Qantas Virtual running smoothly and ensure an exceptional experience for all our pilots.'}
          </p>
        </div>
      </section>

      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-6">
          {isLoading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            </div>
          ) : members.length === 0 ? (
            <div className="text-center py-20">
              <Users className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground text-lg">Team members will be displayed here.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {members.map((member, i) => (
                <motion.div
                  key={member.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="group"
                >
                  <div className="bg-card rounded-2xl overflow-hidden border border-border/50 hover:border-primary/30 hover:shadow-xl transition-all">
                    {member.photo_url ? (
                      <div className="h-64 overflow-hidden">
                        <img
                          src={member.photo_url}
                          alt={member.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                    ) : (
                      <div className="h-64 bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
                        <span className="text-6xl font-heading font-bold text-primary/20">
                          {member.name?.charAt(0)}
                        </span>
                      </div>
                    )}
                    <div className="p-6">
                      <h3 className="font-heading text-xl font-semibold text-foreground">{member.name}</h3>
                      <p className="text-secondary font-medium text-sm mt-1">{member.role}</p>
                      {member.bio && (
                        <p className="text-muted-foreground text-sm mt-3 leading-relaxed">{member.bio}</p>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
      <PilotAccessButton />
    </div>
  );
}
