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
        className="relative overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(135deg, rgba(61,107,79,0.95) 0%, rgba(28,59,38,0.98) 100%), url('/assets/landing/brand-hero-2.jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/90 to-green-900/95"></div>
        <div className="relative z-10">
          <LandingNav />
          <HeroSection />
        </div>
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
