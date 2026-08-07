import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Save, Eye, Home, Users, Palette, RotateCcw, Image, Plane, Map, Calendar, SlidersHorizontal, Layers, Radio, CalendarDays } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
import ColorPicker from '../../components/admin/ColorPicker';
import ImageUploader from '../../components/admin/ImageUploader';
import { useSiteSettings } from '../../hooks/useSiteSettings';

const DEFAULTS = {
  site_logo: '',
  hero_badge: 'VATSIM Virtual Airline',
  hero_heading_line1: 'Spirit of',
  hero_heading_line2: 'Australia',
  hero_subtext: 'Experience the iconic flying kangaroo on the VATSIM network. Join Qantas Virtual and fly world-class routes across the globe.',
  hero_image: 'https://images.unsplash.com/photo-1556388158-158ea5ccacbd?w=1800&auto=format&fit=crop',
  hero_heading1_color: '#ffffff',
  hero_heading2_color: '#C8102E',
  hero_badge_text_color: '#ffffff',
  hero_subtext_color: 'rgba(255,255,255,0.75)',
  hero_badge_color: 'rgba(200,16,46,0.18)',
  hero_overlay_opacity: '55',
  about_badge: 'Who We Are',
  about_heading: 'What We Do',
  about_body1: 'Qantas Virtual is a premier virtual airline operating on the VATSIM network. We recreate the authentic Qantas experience, operating scheduled flights with accurate procedures, realistic aircraft configurations, and professional pilot training.',
  about_body2: 'Whether you\'re a seasoned simmer or new to flight simulation, our community welcomes you. We provide comprehensive training programs, regular group flights, and a supportive environment to develop your virtual aviation skills.',
  about_image: 'https://images.unsplash.com/photo-1540339832862-474599807836?w=1200&auto=format&fit=crop',
  about_bg_color: '',
  about_heading_color: '',
  about_badge_color: '#C8102E',
  about_text_color: '',
  team_badge: 'Our People',
  team_heading: 'Meet the Team',
  team_subtext: 'The dedicated individuals who keep Qantas Virtual running smoothly and ensure an exceptional experience for all our pilots.',
  team_bg_color: '',
  team_heading_color: '',
  team_text_color: '',
  login_welcome_heading: 'Welcome Back',
  login_welcome_subtext: 'The Spirit of Australia — Fly with excellence',
  login_image: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1600&auto=format&fit=crop',
  routes_badge: 'Our Network',
  routes_heading: 'Flight Routes',
  routes_subtext: 'Explore our route network. Click a location on the map to learn more and book a flight.',
  routes_bg_color: '',
  routes_heading_color: '',
  booking_badge: 'Passenger Booking',
  booking_heading: 'Book a Flight',
  booking_subtext: 'Search for available flights operated by our pilots.',
  booking_bg_color: '',
  fleet_badge: 'Our Fleet',
  fleet_heading: 'Fleet Showcase',
  fleet_subtext: 'Explore the aircraft that make up our virtual fleet.',
  fleet_bg_color: '',
  crew_badge: 'Our Pilots',
  crew_heading: 'Meet the Crew',
  crew_subtext: 'The certified pilots who fly our routes on the VATSIM network.',
  crew_bg_color: '',
  events_badge: 'Community Events',
  events_heading: 'Upcoming Events',
  events_subtext: 'Join group flights, challenges, and special events with the Qantas Virtual community.',
  events_bg_color: '',
  live_badge: 'Live Operations',
  live_heading: 'Live Flights',
  live_subtext: 'Track our pilots in real-time as they fly the VATSIM network.',
  live_bg_color: '',
};

function FieldRow({ label, hint, children }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">{label}</Label>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      {children}
    </div>
  );
}

function SectionHeader({ icon: Icon, title, description }) {
  return (
    <div className="flex items-start gap-3 mb-6">
      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
        <Icon className="w-4 h-4 text-primary" />
      </div>
      <div>
        <h3 className="font-heading text-lg font-semibold text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

export default function SiteCustomizer() {
  const { settings, isLoading, save, isSaving } = useSiteSettings();
  const [draft, setDraft] = useState(DEFAULTS);
  const [activeTab, setActiveTab] = useState('logo');

  useEffect(() => {
    if (!isLoading && Object.keys(settings).length > 0) {
      setDraft(d => ({ ...d, ...settings }));
    }
  }, [isLoading, JSON.stringify(settings)]);

  const set = (key, val) => setDraft(d => ({ ...d, [key]: val }));

  const saveSection = async (keys) => {
    for (const key of keys) {
      await save(key, draft[key]);
    }
    toast.success('Changes saved!');
  };

  const resetSection = (keys) => {
    const reset = {};
    keys.forEach(k => { reset[k] = DEFAULTS[k]; });
    setDraft(d => ({ ...d, ...reset }));
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const logoKeys = ['site_logo'];
  const heroKeys = ['hero_badge','hero_heading_line1','hero_heading_line2','hero_subtext','hero_image','hero_heading1_color','hero_heading2_color','hero_badge_text_color','hero_subtext_color','hero_badge_color','hero_overlay_opacity'];
  const aboutKeys = ['about_badge','about_heading','about_body1','about_body2','about_image','about_bg_color','about_heading_color','about_badge_color','about_text_color'];
  const teamKeys = ['team_badge','team_heading','team_subtext','team_bg_color','team_heading_color','team_text_color'];
  const loginKeys = ['login_welcome_heading','login_welcome_subtext','login_image'];
  const routesKeys = ['routes_badge','routes_heading','routes_subtext','routes_bg_color','routes_heading_color'];
  const bookingKeys = ['booking_badge','booking_heading','booking_subtext','booking_bg_color'];
  const fleetKeys = ['fleet_badge','fleet_heading','fleet_subtext','fleet_bg_color'];
  const crewKeys = ['crew_badge','crew_heading','crew_subtext','crew_bg_color'];
  const eventsKeys = ['events_badge','events_heading','events_subtext','events_bg_color'];
  const liveKeys = ['live_badge','live_heading','live_subtext','live_bg_color'];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-heading text-3xl font-bold text-foreground">Site Customizer</h1>
          <p className="text-muted-foreground mt-1">Edit text, colors, and images for each page.</p>
        </div>
        <a href="/" target="_blank" rel="noopener noreferrer">
          <Button variant="outline" size="sm">
            <Eye className="w-4 h-4 mr-2" />Preview Site
          </Button>
        </a>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6 flex flex-wrap h-auto gap-1">
          <TabsTrigger value="logo"><Image className="w-4 h-4 mr-1" />Logo</TabsTrigger>
          <TabsTrigger value="hero"><Home className="w-4 h-4 mr-1" />Hero</TabsTrigger>
          <TabsTrigger value="about"><Palette className="w-4 h-4 mr-1" />About</TabsTrigger>
          <TabsTrigger value="team"><Users className="w-4 h-4 mr-1" />Team</TabsTrigger>
          <TabsTrigger value="login"><Plane className="w-4 h-4 mr-1" />Pilot Login</TabsTrigger>
          <TabsTrigger value="routes"><Map className="w-4 h-4 mr-1" />Routes</TabsTrigger>
          <TabsTrigger value="booking"><Calendar className="w-4 h-4 mr-1" />Booking</TabsTrigger>
          <TabsTrigger value="fleet"><Layers className="w-4 h-4 mr-1" />Fleet</TabsTrigger>
          <TabsTrigger value="crew"><Users className="w-4 h-4 mr-1" />Crew</TabsTrigger>
          <TabsTrigger value="events"><CalendarDays className="w-4 h-4 mr-1" />Events</TabsTrigger>
          <TabsTrigger value="live"><Radio className="w-4 h-4 mr-1" />Live</TabsTrigger>
        </TabsList>

        {/* ───── LOGO ───── */}
        <TabsContent value="logo">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card className="overflow-hidden border">
              <div className="p-8 flex flex-col items-center justify-center gap-6 bg-gradient-to-br from-primary/5 to-secondary/5 min-h-[200px]">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-3">Navbar (light bg)</p>
                  <div className="bg-white rounded-xl p-4 shadow-sm inline-flex items-center gap-3">
                    {draft.site_logo
                      ? <img src={draft.site_logo} alt="Logo" className="h-10 w-auto object-contain" />
                      : <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center"><span className="text-white font-bold text-xs">QV</span></div>
                    }
                    {!draft.site_logo && <span className="font-heading font-bold text-foreground">Qantas Virtual</span>}
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-3">Dark background (e.g. footer, sidebar)</p>
                  <div className="bg-[#0f0202] rounded-xl p-4 shadow-sm inline-flex items-center gap-3">
                    {draft.site_logo
                      ? <img src={draft.site_logo} alt="Logo" className="h-10 w-auto object-contain" />
                      : <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center"><span className="text-white font-bold text-xs">QV</span></div>
                    }
                    {!draft.site_logo && <span className="font-heading font-bold text-white">Qantas Virtual</span>}
                  </div>
                </div>
              </div>
              <div className="p-3 bg-muted/50 text-center">
                <span className="text-xs text-muted-foreground">Logo Preview — no filters applied</span>
              </div>
            </Card>
            <div className="space-y-5">
              <SectionHeader icon={Image} title="Site Logo" description="Upload your logo — it appears in the navbar, footer, hero, and pilot portal on every page. No color filters are applied." />
              <ImageUploader label="Logo Image" value={draft.site_logo} onChange={v => set('site_logo', v)} />
              <p className="text-xs text-muted-foreground">Recommended: PNG with transparent background. Your logo will display exactly as uploaded — no brightness or color filters are applied.</p>
              {draft.site_logo && (
                <Button variant="outline" size="sm" onClick={() => set('site_logo', '')}>
                  <RotateCcw className="w-3 h-3 mr-2" />Remove Logo
                </Button>
              )}
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <Button onClick={() => saveSection(logoKeys)} disabled={isSaving} className="flex-1">
              <Save className="w-4 h-4 mr-2" />{isSaving ? 'Saving...' : 'Save Logo'}
            </Button>
          </div>
        </TabsContent>

        {/* ───── HERO ───── */}
        <TabsContent value="hero">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card className="overflow-hidden border">
              <div
                className="relative h-64 flex flex-col items-start justify-center px-8"
                style={{ backgroundColor: '#0f0202' }}
              >
                {draft.hero_image && (
                  <img src={draft.hero_image} alt="" className="absolute right-0 top-0 h-full w-1/2 object-cover opacity-60" />
                )}
                <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, #0f0202 50%, transparent 80%)' }} />
                <div className="absolute inset-0" style={{ backgroundColor: `rgba(0,0,0,${(Number(draft.hero_overlay_opacity ?? 55)) / 100})` }} />
                <div className="relative z-10">
                  <span className="inline-block px-3 py-1 rounded-full text-xs mb-3" style={{ backgroundColor: draft.hero_badge_color || 'rgba(200,16,46,0.18)', color: draft.hero_badge_text_color || '#fff' }}>
                    {draft.hero_badge}
                  </span>
                  <h2 className="font-heading text-2xl font-bold leading-tight">
                    <span style={{ color: draft.hero_heading1_color || '#fff' }}>{draft.hero_heading_line1}</span>
                    <br />
                    <span style={{ color: draft.hero_heading2_color || '#C8102E' }}>{draft.hero_heading_line2}</span>
                  </h2>
                  <p className="text-xs mt-2 max-w-xs" style={{ color: draft.hero_subtext_color || 'rgba(255,255,255,0.7)' }}>
                    {draft.hero_subtext}
                  </p>
                </div>
              </div>
              <div className="p-3 bg-muted/50 text-center">
                <span className="text-xs text-muted-foreground">Live Preview</span>
              </div>
            </Card>
            <div className="space-y-5">
              <SectionHeader icon={Home} title="Hero Section" description="The full-screen banner at the top of the home page." />
              <FieldRow label="Badge Text">
                <Input value={draft.hero_badge} onChange={e => set('hero_badge', e.target.value)} />
              </FieldRow>
              <FieldRow label="Heading Line 1">
                <Input value={draft.hero_heading_line1} onChange={e => set('hero_heading_line1', e.target.value)} />
              </FieldRow>
              <FieldRow label="Heading Line 2 (accent)">
                <Input value={draft.hero_heading_line2} onChange={e => set('hero_heading_line2', e.target.value)} />
              </FieldRow>
              <FieldRow label="Subtext">
                <Textarea value={draft.hero_subtext} onChange={e => set('hero_subtext', e.target.value)} rows={3} />
              </FieldRow>
              <Separator />
              <p className="text-sm font-medium text-foreground">Right Side Image</p>
              <ImageUploader value={draft.hero_image} onChange={v => set('hero_image', v)} />
              <Separator />
              <p className="text-sm font-medium text-foreground">Colors</p>
              <div className="grid grid-cols-2 gap-4">
                <ColorPicker label="Heading Line 1 Color" value={draft.hero_heading1_color} onChange={v => set('hero_heading1_color', v)} />
                <ColorPicker label="Heading Line 2 Color" value={draft.hero_heading2_color} onChange={v => set('hero_heading2_color', v)} />
                <ColorPicker label="Badge Text Color" value={draft.hero_badge_text_color} onChange={v => set('hero_badge_text_color', v)} />
                <ColorPicker label="Subtext Color" value={draft.hero_subtext_color} onChange={v => set('hero_subtext_color', v)} />
                <ColorPicker label="Badge Background" value={draft.hero_badge_color} onChange={v => set('hero_badge_color', v)} />
              </div>
              <FieldRow label={`Image Overlay Darkness — ${draft.hero_overlay_opacity ?? 55}%`} hint="0% = fully visible image, 100% = completely dark">
                <Slider
                  min={0} max={100} step={1}
                  value={[Number(draft.hero_overlay_opacity ?? 55)]}
                  onValueChange={([v]) => set('hero_overlay_opacity', String(v))}
                  className="mt-2"
                />
              </FieldRow>
              <div className="grid grid-cols-2 gap-4 hidden">
              </div>
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <Button onClick={() => saveSection(heroKeys)} disabled={isSaving} className="flex-1">
              <Save className="w-4 h-4 mr-2" />{isSaving ? 'Saving...' : 'Save Hero'}
            </Button>
            <Button variant="outline" onClick={() => resetSection(heroKeys)}>
              <RotateCcw className="w-4 h-4 mr-2" />Reset
            </Button>
          </div>
        </TabsContent>

        {/* ───── ABOUT ───── */}
        <TabsContent value="about">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card className="overflow-hidden border">
              <div className="p-6" style={{ backgroundColor: draft.about_bg_color || undefined }}>
                <span className="text-xs font-medium uppercase tracking-wider" style={{ color: draft.about_badge_color || '#C8102E' }}>
                  {draft.about_badge}
                </span>
                <h2 className="font-heading text-xl font-bold mt-1 mb-3" style={{ color: draft.about_heading_color || undefined }}>
                  {draft.about_heading}
                </h2>
                <p className="text-xs leading-relaxed mb-2" style={{ color: draft.about_text_color || '#6b7280' }}>
                  {draft.about_body1}
                </p>
                {draft.about_image && (
                  <img src={draft.about_image} alt="" className="w-full h-28 object-cover rounded-xl mt-3" />
                )}
              </div>
              <div className="p-3 bg-muted/50 text-center">
                <span className="text-xs text-muted-foreground">Live Preview</span>
              </div>
            </Card>
            <div className="space-y-5">
              <SectionHeader icon={Palette} title="About Section" description="The 'Who We Are' section on the home page." />
              <FieldRow label="Badge Text">
                <Input value={draft.about_badge} onChange={e => set('about_badge', e.target.value)} />
              </FieldRow>
              <FieldRow label="Heading">
                <Input value={draft.about_heading} onChange={e => set('about_heading', e.target.value)} />
              </FieldRow>
              <FieldRow label="Body Paragraph 1">
                <Textarea value={draft.about_body1} onChange={e => set('about_body1', e.target.value)} rows={3} />
              </FieldRow>
              <FieldRow label="Body Paragraph 2">
                <Textarea value={draft.about_body2} onChange={e => set('about_body2', e.target.value)} rows={3} />
              </FieldRow>
              <Separator />
              <p className="text-sm font-medium text-foreground">Section Image</p>
              <ImageUploader value={draft.about_image} onChange={v => set('about_image', v)} />
              <Separator />
              <p className="text-sm font-medium text-foreground">Colors</p>
              <div className="grid grid-cols-2 gap-4">
                <ColorPicker label="Section Background" value={draft.about_bg_color} onChange={v => set('about_bg_color', v)} />
                <ColorPicker label="Badge Color" value={draft.about_badge_color} onChange={v => set('about_badge_color', v)} />
                <ColorPicker label="Heading Color" value={draft.about_heading_color} onChange={v => set('about_heading_color', v)} />
                <ColorPicker label="Body Text Color" value={draft.about_text_color} onChange={v => set('about_text_color', v)} />
              </div>
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <Button onClick={() => saveSection(aboutKeys)} disabled={isSaving} className="flex-1">
              <Save className="w-4 h-4 mr-2" />{isSaving ? 'Saving...' : 'Save About'}
            </Button>
            <Button variant="outline" onClick={() => resetSection(aboutKeys)}>
              <RotateCcw className="w-4 h-4 mr-2" />Reset
            </Button>
          </div>
        </TabsContent>

        {/* ───── TEAM ───── */}
        <TabsContent value="team">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card className="overflow-hidden border">
              <div className="p-8 text-center" style={{ backgroundColor: draft.team_bg_color || undefined }}>
                <span className="text-xs font-medium uppercase tracking-wider" style={{ color: draft.team_heading_color || '#C8102E' }}>
                  {draft.team_badge}
                </span>
                <h1 className="font-heading text-2xl font-bold mt-2 mb-3" style={{ color: draft.team_heading_color || undefined }}>
                  {draft.team_heading}
                </h1>
                <p className="text-xs leading-relaxed" style={{ color: draft.team_text_color || '#6b7280' }}>
                  {draft.team_subtext}
                </p>
              </div>
              <div className="p-3 bg-muted/50 text-center">
                <span className="text-xs text-muted-foreground">Live Preview</span>
              </div>
            </Card>
            <div className="space-y-5">
              <SectionHeader icon={Users} title="Team Page" description="The header section of the Meet the Team page." />
              <FieldRow label="Badge Text">
                <Input value={draft.team_badge} onChange={e => set('team_badge', e.target.value)} />
              </FieldRow>
              <FieldRow label="Heading">
                <Input value={draft.team_heading} onChange={e => set('team_heading', e.target.value)} />
              </FieldRow>
              <FieldRow label="Subtext">
                <Textarea value={draft.team_subtext} onChange={e => set('team_subtext', e.target.value)} rows={3} />
              </FieldRow>
              <Separator />
              <p className="text-sm font-medium text-foreground">Colors</p>
              <div className="grid grid-cols-2 gap-4">
                <ColorPicker label="Page Background" value={draft.team_bg_color} onChange={v => set('team_bg_color', v)} />
                <ColorPicker label="Badge & Heading Color" value={draft.team_heading_color} onChange={v => set('team_heading_color', v)} />
                <ColorPicker label="Subtext Color" value={draft.team_text_color} onChange={v => set('team_text_color', v)} />
              </div>
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <Button onClick={() => saveSection(teamKeys)} disabled={isSaving} className="flex-1">
              <Save className="w-4 h-4 mr-2" />{isSaving ? 'Saving...' : 'Save Team Page'}
            </Button>
            <Button variant="outline" onClick={() => resetSection(teamKeys)}>
              <RotateCcw className="w-4 h-4 mr-2" />Reset
            </Button>
          </div>
        </TabsContent>

        {/* ───── PILOT LOGIN ───── */}
        <TabsContent value="login">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card className="overflow-hidden border">
              <div className="bg-gradient-to-b from-[#1a0202] to-[#0f0505] p-8 text-center min-h-[200px] flex flex-col justify-center">
                <h2 className="font-heading text-2xl font-bold text-white mb-2">{draft.login_welcome_heading}</h2>
                <p className="text-gray-400 text-sm">{draft.login_welcome_subtext}</p>
                {draft.login_image && (
                  <img src={draft.login_image} alt="" className="w-full h-28 object-cover rounded-xl mt-4 opacity-60" />
                )}
              </div>
              <div className="p-3 bg-muted/50 text-center">
                <span className="text-xs text-muted-foreground">Live Preview</span>
              </div>
            </Card>
            <div className="space-y-5">
              <SectionHeader icon={Plane} title="Pilot Login Page" description="The login page that pilots see when signing in." />
              <FieldRow label="Welcome Heading">
                <Input value={draft.login_welcome_heading} onChange={e => set('login_welcome_heading', e.target.value)} />
              </FieldRow>
              <FieldRow label="Subtext">
                <Input value={draft.login_welcome_subtext} onChange={e => set('login_welcome_subtext', e.target.value)} />
              </FieldRow>
              <Separator />
              <p className="text-sm font-medium text-foreground">Right Side Image</p>
              <ImageUploader value={draft.login_image} onChange={v => set('login_image', v)} />
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <Button onClick={() => saveSection(loginKeys)} disabled={isSaving} className="flex-1">
              <Save className="w-4 h-4 mr-2" />{isSaving ? 'Saving...' : 'Save Pilot Login'}
            </Button>
            <Button variant="outline" onClick={() => resetSection(loginKeys)}>
              <RotateCcw className="w-4 h-4 mr-2" />Reset
            </Button>
          </div>
        </TabsContent>

        {/* ───── ROUTES ───── */}
        <TabsContent value="routes">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card className="overflow-hidden border">
              <div className="p-8 text-center" style={{ backgroundColor: draft.routes_bg_color || undefined }}>
                <span className="text-xs font-semibold uppercase tracking-widest mb-2 block" style={{ color: draft.routes_heading_color || '#C8102E' }}>
                  {draft.routes_badge}
                </span>
                <h1 className="font-heading text-2xl font-bold mb-3" style={{ color: draft.routes_heading_color || undefined }}>
                  {draft.routes_heading}
                </h1>
                <p className="text-xs text-muted-foreground">{draft.routes_subtext}</p>
              </div>
              <div className="p-3 bg-muted/50 text-center">
                <span className="text-xs text-muted-foreground">Live Preview</span>
              </div>
            </Card>
            <div className="space-y-5">
              <SectionHeader icon={Map} title="Routes Page" description="The public routes listing page (/routes)." />
              <FieldRow label="Badge Text">
                <Input value={draft.routes_badge} onChange={e => set('routes_badge', e.target.value)} />
              </FieldRow>
              <FieldRow label="Heading">
                <Input value={draft.routes_heading} onChange={e => set('routes_heading', e.target.value)} />
              </FieldRow>
              <FieldRow label="Subtext">
                <Textarea value={draft.routes_subtext} onChange={e => set('routes_subtext', e.target.value)} rows={2} />
              </FieldRow>
              <Separator />
              <p className="text-sm font-medium text-foreground">Colors</p>
              <div className="grid grid-cols-2 gap-4">
                <ColorPicker label="Page Background" value={draft.routes_bg_color} onChange={v => set('routes_bg_color', v)} />
                <ColorPicker label="Heading & Badge Color" value={draft.routes_heading_color} onChange={v => set('routes_heading_color', v)} />
              </div>
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <Button onClick={() => saveSection(routesKeys)} disabled={isSaving} className="flex-1">
              <Save className="w-4 h-4 mr-2" />{isSaving ? 'Saving...' : 'Save Routes Page'}
            </Button>
            <Button variant="outline" onClick={() => resetSection(routesKeys)}>
              <RotateCcw className="w-4 h-4 mr-2" />Reset
            </Button>
          </div>
        </TabsContent>

        {/* ───── BOOKING ───── */}
        <TabsContent value="booking">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card className="overflow-hidden border">
              <div className="p-8 text-center" style={{ backgroundColor: draft.booking_bg_color || undefined }}>
                <span className="text-xs font-semibold uppercase tracking-widest text-secondary mb-2 block">
                  {draft.booking_badge}
                </span>
                <h1 className="font-heading text-2xl font-bold mb-3 text-foreground">
                  {draft.booking_heading}
                </h1>
                <p className="text-xs text-muted-foreground">{draft.booking_subtext}</p>
                <div className="mt-4 border rounded-xl p-4 text-left text-xs space-y-2">
                  <p className="font-semibold">Search for flights</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-muted rounded px-2 py-1">Departure…</div>
                    <div className="bg-muted rounded px-2 py-1">Arrival…</div>
                  </div>
                </div>
              </div>
              <div className="p-3 bg-muted/50 text-center">
                <span className="text-xs text-muted-foreground">Live Preview</span>
              </div>
            </Card>
            <div className="space-y-5">
              <SectionHeader icon={Calendar} title="Booking Page" description="The public flight booking page (/book)." />
              <FieldRow label="Badge Text">
                <Input value={draft.booking_badge} onChange={e => set('booking_badge', e.target.value)} />
              </FieldRow>
              <FieldRow label="Heading">
                <Input value={draft.booking_heading} onChange={e => set('booking_heading', e.target.value)} />
              </FieldRow>
              <FieldRow label="Subtext">
                <Textarea value={draft.booking_subtext} onChange={e => set('booking_subtext', e.target.value)} rows={2} />
              </FieldRow>
              <Separator />
              <p className="text-sm font-medium text-foreground">Colors</p>
              <ColorPicker label="Page Background" value={draft.booking_bg_color} onChange={v => set('booking_bg_color', v)} />
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <Button onClick={() => saveSection(bookingKeys)} disabled={isSaving} className="flex-1">
              <Save className="w-4 h-4 mr-2" />{isSaving ? 'Saving...' : 'Save Booking Page'}
            </Button>
            <Button variant="outline" onClick={() => resetSection(bookingKeys)}>
              <RotateCcw className="w-4 h-4 mr-2" />Reset
            </Button>
          </div>
        </TabsContent>
        {/* ───── FLEET ───── */}
        <TabsContent value="fleet">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card className="overflow-hidden border">
              <div className="p-8 text-center" style={{ backgroundColor: draft.fleet_bg_color || undefined }}>
                <span className="text-xs font-semibold uppercase tracking-widest text-primary mb-2 block">{draft.fleet_badge}</span>
                <h1 className="font-heading text-2xl font-bold mb-3 text-foreground">{draft.fleet_heading}</h1>
                <p className="text-xs text-muted-foreground">{draft.fleet_subtext}</p>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  {['B787-9','A380','B737-800','A330-300'].map(t => (
                    <div key={t} className="border rounded-lg p-2 text-xs font-mono text-left">{t}</div>
                  ))}
                </div>
              </div>
              <div className="p-3 bg-muted/50 text-center">
                <span className="text-xs text-muted-foreground">Live Preview</span>
              </div>
            </Card>
            <div className="space-y-5">
              <SectionHeader icon={Layers} title="Fleet Page" description="The public fleet showcase page (/fleet)." />
              <FieldRow label="Badge Text">
                <Input value={draft.fleet_badge} onChange={e => set('fleet_badge', e.target.value)} />
              </FieldRow>
              <FieldRow label="Heading">
                <Input value={draft.fleet_heading} onChange={e => set('fleet_heading', e.target.value)} />
              </FieldRow>
              <FieldRow label="Subtext">
                <Textarea value={draft.fleet_subtext} onChange={e => set('fleet_subtext', e.target.value)} rows={2} />
              </FieldRow>
              <Separator />
              <p className="text-sm font-medium text-foreground">Colors</p>
              <ColorPicker label="Page Background" value={draft.fleet_bg_color} onChange={v => set('fleet_bg_color', v)} />
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <Button onClick={() => saveSection(fleetKeys)} disabled={isSaving} className="flex-1">
              <Save className="w-4 h-4 mr-2" />{isSaving ? 'Saving...' : 'Save Fleet Page'}
            </Button>
            <Button variant="outline" onClick={() => resetSection(fleetKeys)}>
              <RotateCcw className="w-4 h-4 mr-2" />Reset
            </Button>
          </div>
        </TabsContent>

        {/* ───── CREW ───── */}
        <TabsContent value="crew">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card className="overflow-hidden border">
              <div className="p-8 text-center bg-sidebar" style={{ backgroundColor: draft.crew_bg_color || undefined }}>
                <span className="text-xs font-semibold uppercase tracking-widest text-primary mb-2 block">{draft.crew_badge}</span>
                <h1 className="font-heading text-2xl font-bold mb-3 text-foreground">{draft.crew_heading}</h1>
                <p className="text-xs text-muted-foreground">{draft.crew_subtext}</p>
              </div>
              <div className="p-3 bg-muted/50 text-center"><span className="text-xs text-muted-foreground">Live Preview</span></div>
            </Card>
            <div className="space-y-5">
              <SectionHeader icon={Users} title="Crew Page" description="The pilot roster/crew page (/crew)." />
              <FieldRow label="Badge Text"><Input value={draft.crew_badge} onChange={e => set('crew_badge', e.target.value)} /></FieldRow>
              <FieldRow label="Heading"><Input value={draft.crew_heading} onChange={e => set('crew_heading', e.target.value)} /></FieldRow>
              <FieldRow label="Subtext"><Textarea value={draft.crew_subtext} onChange={e => set('crew_subtext', e.target.value)} rows={2} /></FieldRow>
              <Separator />
              <ColorPicker label="Page Background" value={draft.crew_bg_color} onChange={v => set('crew_bg_color', v)} />
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <Button onClick={() => saveSection(crewKeys)} disabled={isSaving} className="flex-1"><Save className="w-4 h-4 mr-2" />{isSaving ? 'Saving...' : 'Save Crew Page'}</Button>
            <Button variant="outline" onClick={() => resetSection(crewKeys)}><RotateCcw className="w-4 h-4 mr-2" />Reset</Button>
          </div>
        </TabsContent>

        {/* ───── EVENTS ───── */}
        <TabsContent value="events">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card className="overflow-hidden border">
              <div className="p-8 text-center" style={{ backgroundColor: draft.events_bg_color || undefined }}>
                <span className="text-xs font-semibold uppercase tracking-widest text-primary mb-2 block">{draft.events_badge}</span>
                <h1 className="font-heading text-2xl font-bold mb-3 text-foreground">{draft.events_heading}</h1>
                <p className="text-xs text-muted-foreground">{draft.events_subtext}</p>
              </div>
              <div className="p-3 bg-muted/50 text-center"><span className="text-xs text-muted-foreground">Live Preview</span></div>
            </Card>
            <div className="space-y-5">
              <SectionHeader icon={CalendarDays} title="Events Page" description="The public events page (/events)." />
              <FieldRow label="Badge Text"><Input value={draft.events_badge} onChange={e => set('events_badge', e.target.value)} /></FieldRow>
              <FieldRow label="Heading"><Input value={draft.events_heading} onChange={e => set('events_heading', e.target.value)} /></FieldRow>
              <FieldRow label="Subtext"><Textarea value={draft.events_subtext} onChange={e => set('events_subtext', e.target.value)} rows={2} /></FieldRow>
              <Separator />
              <ColorPicker label="Page Background" value={draft.events_bg_color} onChange={v => set('events_bg_color', v)} />
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <Button onClick={() => saveSection(eventsKeys)} disabled={isSaving} className="flex-1"><Save className="w-4 h-4 mr-2" />{isSaving ? 'Saving...' : 'Save Events Page'}</Button>
            <Button variant="outline" onClick={() => resetSection(eventsKeys)}><RotateCcw className="w-4 h-4 mr-2" />Reset</Button>
          </div>
        </TabsContent>

        {/* ───── LIVE ───── */}
        <TabsContent value="live">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card className="overflow-hidden border">
              <div className="p-8 text-center" style={{ backgroundColor: draft.live_bg_color || undefined }}>
                <span className="text-xs font-semibold uppercase tracking-widest text-primary mb-2 block">{draft.live_badge}</span>
                <h1 className="font-heading text-2xl font-bold mb-3 text-foreground">{draft.live_heading}</h1>
                <p className="text-xs text-muted-foreground">{draft.live_subtext}</p>
                <div className="mt-4 flex items-center justify-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-xs text-muted-foreground">Live tracking active</span>
                </div>
              </div>
              <div className="p-3 bg-muted/50 text-center"><span className="text-xs text-muted-foreground">Live Preview</span></div>
            </Card>
            <div className="space-y-5">
              <SectionHeader icon={Radio} title="Live Flights Page" description="The public live tracking page (/live)." />
              <FieldRow label="Badge Text"><Input value={draft.live_badge} onChange={e => set('live_badge', e.target.value)} /></FieldRow>
              <FieldRow label="Heading"><Input value={draft.live_heading} onChange={e => set('live_heading', e.target.value)} /></FieldRow>
              <FieldRow label="Subtext"><Textarea value={draft.live_subtext} onChange={e => set('live_subtext', e.target.value)} rows={2} /></FieldRow>
              <Separator />
              <ColorPicker label="Page Background" value={draft.live_bg_color} onChange={v => set('live_bg_color', v)} />
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <Button onClick={() => saveSection(liveKeys)} disabled={isSaving} className="flex-1"><Save className="w-4 h-4 mr-2" />{isSaving ? 'Saving...' : 'Save Live Page'}</Button>
            <Button variant="outline" onClick={() => resetSection(liveKeys)}><RotateCcw className="w-4 h-4 mr-2" />Reset</Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}