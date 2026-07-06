import { Button } from '@/components/ui/button';
import { brand } from './brandAssets';

const LandingNav = () => {
  return (
    <nav className="flex items-center justify-between max-w-6xl mx-auto px-6 py-6">
      <div className="flex items-center gap-3">
        <img
          src={brand.icon}
          alt="AgroTensor"
          className="h-11 w-11 rounded-xl object-contain drop-shadow"
        />
        <div className="flex flex-col leading-tight">
          <span className="font-serif text-xl font-bold text-white tracking-wide">AgroTensor</span>
          <span className="text-[10px] uppercase tracking-[0.22em] text-green-200/80">
            Manage today. Grow every day.
          </span>
        </div>
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
          <a href="/app">Open App</a>
        </Button>
      </div>
    </nav>
  );
};

export default LandingNav;
