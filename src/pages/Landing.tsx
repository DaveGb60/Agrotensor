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
      {/* Hero — deep farm-green with brand pattern */}
      <header
        className="relative overflow-hidden"
        style={{
          backgroundImage: `
            linear-gradient(135deg, hsl(150 55% 12% / 0.94) 0%, hsl(150 60% 8% / 0.97) 100%),
            url(${brand.bgPattern})
          `,
          backgroundSize: 'cover, 520px auto',
          backgroundRepeat: 'no-repeat, repeat',
        }}
      >
        {/* Warm accent glow */}
        <div className="absolute -top-32 -right-20 w-[500px] h-[500px] bg-green-500/15 blur-3xl rounded-full pointer-events-none" />
        <div className="absolute -bottom-32 -left-20 w-[500px] h-[500px] bg-emerald-400/10 blur-3xl rounded-full pointer-events-none" />

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
