import LandingNav from '@/components/landing/LandingNav';
import HeroSection from '@/components/landing/HeroSection';
import FeaturesSection from '@/components/landing/FeaturesSection';
import PhilosophySection from '@/components/landing/PhilosophySection';
import FirstUseSection from '@/components/landing/FirstUseSection';
import ValuesSection from '@/components/landing/ValuesSection';
import LandingFooter from '@/components/landing/Footer';
import { brand } from '@/components/landing/brandAssets';

const Landing = () => {
  return (
    <div className="min-h-screen">
      {/* Hero — deep farm-green with layered brand graphics */}
      <header
        className="relative overflow-hidden"
        style={{
          backgroundImage: `
            radial-gradient(120% 90% at 85% -10%, hsl(160 70% 30% / 0.55) 0%, transparent 60%),
            radial-gradient(90% 70% at 5% 110%, hsl(200 75% 32% / 0.45) 0%, transparent 60%),
            linear-gradient(135deg, hsl(150 55% 11% / 0.94) 0%, hsl(155 60% 7% / 0.97) 55%, hsl(190 55% 9% / 0.95) 100%),
            url(${brand.bgPattern})
          `,
          backgroundSize: 'cover, cover, cover, 620px auto',
          backgroundRepeat: 'no-repeat, no-repeat, no-repeat, repeat',
        }}
      >
        {/* Fine tech grid */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.13]"
          style={{
            backgroundImage:
              'linear-gradient(to right, hsl(150 60% 70% / 0.25) 1px, transparent 1px), linear-gradient(to bottom, hsl(150 60% 70% / 0.25) 1px, transparent 1px)',
            backgroundSize: '52px 52px',
            maskImage: 'radial-gradient(120% 80% at 50% 0%, #000 20%, transparent 80%)',
            WebkitMaskImage: 'radial-gradient(120% 80% at 50% 0%, #000 20%, transparent 80%)',
          }}
        />

        {/* Aurora glows */}
        <div className="absolute -top-40 -right-24 w-[560px] h-[560px] bg-emerald-400/20 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute -bottom-40 -left-24 w-[560px] h-[560px] bg-sky-400/15 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[420px] h-[420px] bg-lime-300/10 blur-[140px] rounded-full pointer-events-none" />

        {/* Soft bottom fade into the page */}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-background/90 pointer-events-none" />

        <div className="relative z-10">
          <LandingNav />
          <HeroSection />
        </div>
      </header>


      <FeaturesSection />
      <PhilosophySection />
      <FirstUseSection />
      <ValuesSection />

      <LandingFooter />
    </div>
  );
};

export default Landing;
