import { Button } from '@/components/ui/button';
import { CheckCircle, Leaf, ClipboardCheck, Eye, BarChart3, TrendingUp } from 'lucide-react';
import { brand } from './brandAssets';

const pillars = [
  { icon: ClipboardCheck, label: 'Organize', sub: 'Your data' },
  { icon: Eye, label: 'Monitor', sub: 'Every operation' },
  { icon: BarChart3, label: 'Analyze', sub: 'Real insights' },
  { icon: TrendingUp, label: 'Grow', sub: 'Your profit' },
];

const HeroSection = () => {
  return (
    <div className="max-w-6xl mx-auto px-6 pt-6 pb-20">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
        {/* Copy */}
        <div className="lg:col-span-6 space-y-6">
          <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-1.5 rounded-full border border-white/20 backdrop-blur-sm">
            <Leaf className="h-4 w-4 text-green-200" />
            <span className="text-white/95 text-sm font-medium tracking-wide">
              Farm operations, beautifully organized
            </span>
          </div>

          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-[1.05]">
            Run Your Farm.{' '}
            <span className="text-green-300">Grow Your Business.</span>
          </h1>

          <p className="text-white/85 text-lg leading-relaxed max-w-xl">
            One platform to manage every part of your farm — from crops and livestock to
            expenses and reports — from anywhere, even offline.
          </p>

          <div className="flex flex-wrap gap-2">
            {['Free', 'Offline-first', 'End-to-end encrypted'].map((t) => (
              <div
                key={t}
                className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full text-white/90 text-sm border border-white/15"
              >
                <CheckCircle className="h-3.5 w-3.5 text-green-300" />
                {t}
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <Button variant="hero" size="lg" asChild className="text-base shadow-elevated">
              <a href="/app">Get started — it's free</a>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="bg-transparent border-white/40 text-white hover:bg-white/10 hover:text-white"
              asChild
            >
              <a href="#features">Explore features</a>
            </Button>
          </div>

          <div className="grid grid-cols-4 gap-3 pt-6 max-w-md">
            {pillars.map(({ icon: Icon, label, sub }) => (
              <div key={label} className="text-white/90">
                <Icon className="h-6 w-6 text-green-300 mb-1.5" />
                <div className="font-semibold text-sm leading-tight">{label}</div>
                <div className="text-[11px] text-white/60 leading-tight">{sub}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Visual */}
        <div className="lg:col-span-6 relative">
          <div className="absolute -inset-6 bg-green-500/20 blur-3xl rounded-full pointer-events-none" />
          <div className="relative rounded-3xl overflow-hidden border border-white/20 shadow-elevated ring-1 ring-green-300/20">
            <img
              src={brand.hero}
              alt="Farmer using AgroTensor dashboard to manage the farm"
              className="w-full h-auto object-cover"
              loading="eager"
            />
          </div>
          <div className="hidden md:block absolute -bottom-6 -left-6 w-28 h-28 rounded-2xl overflow-hidden border-2 border-white/40 shadow-elevated bg-primary">
            <img src={brand.icon} alt="AgroTensor icon" className="w-full h-full object-contain p-2" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
