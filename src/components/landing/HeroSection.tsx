import { Button } from '@/components/ui/button';
import { Database, Lock, RefreshCw, Leaf } from 'lucide-react';

const HeroSection = () => {
  return (
    <div className="max-w-6xl mx-auto px-6 py-8 pb-20">
      <div className="flex flex-wrap items-center gap-10">
        <div className="flex-1 min-w-[300px]">
          <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full mb-6">
            <Leaf className="h-4 w-4 text-green-200" />
            <span className="text-white font-bold">Run Your Farm. Grow Your Business.</span>
          </div>
          
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-white leading-tight mb-4">
            One platform to manage every part of your farm operations from anywhere.
          </h1>
          
          <p className="text-white/90 text-lg mb-6">
            Organize your data, monitor operations, analyze insights and grow profit — FarmDesk is your farm's digital office, built for farmers and farm teams.
          </p>
          
          <div className="flex flex-wrap gap-3 mb-6">
            <span className="bg-white/10 px-3 py-1.5 rounded-full font-bold text-white">Free</span>
            <span className="bg-white/10 px-3 py-1.5 rounded-full font-bold text-white">Offline-first</span>
            <span className="bg-white/10 px-3 py-1.5 rounded-full font-bold text-white">End-to-end encrypted</span>
          </div>
          
          <div className="flex flex-wrap gap-4 mb-8">
            <Button variant="hero" size="lg" asChild>
              <a href="/">Get started — it's free</a>
            </Button>
            <Button variant="default" size="lg" className="bg-transparent border-2 border-white/30 text-white hover:bg-white/10 hover:text-white" asChild>
              <a href="/">Request a demo</a>
            </Button>
          </div>
          
          <div className="flex flex-wrap gap-6 text-white/85">
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              <span>Organize your data</span>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              <span>Monitor every operation</span>
            </div>
            <div className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              <span>Analyze real insights</span>
            </div>
            <div className="flex items-center gap-2">
              <Leaf className="h-5 w-5" />
              <span>Grow your profit</span>
            </div>
          </div>
        </div>
        
        <div className="flex-1 min-w-[300px] flex justify-center">
          <div className="w-full max-w-[420px] rounded-xl shadow-elevated overflow-hidden">
            <img 
              src="/assets/landing/brand-hero-1.jpg" 
              alt="FarmDesk dashboard preview" 
              className="w-full object-cover"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
