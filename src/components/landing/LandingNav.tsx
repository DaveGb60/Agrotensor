import { Button } from '@/components/ui/button';

const LandingNav = () => {
  return (
    <nav className="flex items-center justify-between max-w-6xl mx-auto px-6 py-8">
      <div className="flex items-center gap-3">
        <img 
          src="/assets/landing/logo-new-1.png" 
          alt="FarmDesk Logo" 
          className="h-12 w-12 rounded-xl object-contain"
        />
        <span className="font-serif text-xl font-bold text-white">FarmDesk</span>
      </div>
      
      <div className="hidden md:flex items-center gap-8">
        <a href="#features" className="text-white/90 hover:text-white font-semibold transition-colors">
          Features
        </a>
        <a href="#philosophy" className="text-white/90 hover:text-white font-semibold transition-colors">
          Philosophy
        </a>
        <a href="#first-use" className="text-white/90 hover:text-white font-semibold transition-colors">
          First Use
        </a>
        <a href="#contact" className="text-white/90 hover:text-white font-semibold transition-colors">
          Contact
        </a>
        <Button variant="hero" size="sm" asChild>
          <a href="/">Open App</a>
        </Button>
      </div>
    </nav>
  );
};

export default LandingNav;
