import LandingNav from '@/components/landing/LandingNav';
import HeroSection from '@/components/landing/HeroSection';
import FeaturesSection from '@/components/landing/FeaturesSection';
import PhilosophySection from '@/components/landing/PhilosophySection';
import FirstUseSection from '@/components/landing/FirstUseSection';
import ValuesSection from '@/components/landing/ValuesSection';
import LandingFooter from '@/components/landing/Footer';

const Landing = () => {
  return (
    <div className="min-h-screen">
      {/* Hero Section with Background */}
      <header 
        className="relative"
        style={{
          backgroundImage: `linear-gradient(rgba(8,18,8,0.35),rgba(8,18,8,0.12)), url('/assets/landing/hero_wide.svg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <LandingNav />
        <HeroSection />
      </header>

      {/* Main Content */}
      <FeaturesSection />
      <PhilosophySection />
      <FirstUseSection />
      <ValuesSection />

      {/* Footer */}
      <LandingFooter />
    </div>
  );
};

export default Landing;
