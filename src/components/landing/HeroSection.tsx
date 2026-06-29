import { Button } from '@/components/ui/button';
import { Database, Lock, RefreshCw, Leaf, CheckCircle } from 'lucide-react';

const HeroSection = () => {
  return (
    <div className="max-w-6xl mx-auto px-6 py-16 pb-24">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 bg-white/15 px-4 py-2 rounded-full border border-white/20 backdrop-blur-sm">
            <Leaf className="h-4 w-4 text-green-200" />
            <span className="text-white font-semibold">Run Your Farm. Grow Your Business.</span>
          </div>
          
          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
            One platform to manage every part of your farm operations from anywhere.
          </h1>
          
          <p className="text-white/90 text-lg md:text-xl leading-relaxed">
            Organize your data, monitor operations, analyze insights and grow profit — AgroTensor is your farm's digital office, built for farmers and farm teams.
          </p>
          
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2 bg-white/15 px-3 py-1.5 rounded-full text-white font-semibold">
              <CheckCircle className="h-4 w-4 text-green-300" />
              Free
            </div>
            <div className="flex items-center gap-2 bg-white/15 px-3 py-1.5 rounded-full text-white font-semibold">
              <CheckCircle className="h-4 w-4 text-green-300" />
              Offline-first
            </div>
            <div className="flex items-center gap-2 bg-white/15 px-3 py-1.5 rounded-full text-white font-semibold">
              <CheckCircle className="h-4 w-4 text-green-300" />
              End-to-end encrypted
            </div>
          </div>
          
          <div className="flex flex-wrap gap-4 pt-2">
            <Button variant="hero" size="lg" asChild className="text-lg">
              <a href="/">Get started — it's free</a>
            </Button>
            <Button variant="default" size="lg" className="bg-transparent border-2 border-white/30 text-white hover:bg-white/10 hover:text-white" asChild>
              <a href="#features">Explore features</a>
            </Button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
            <div className="flex items-center gap-2 text-white/90">
              <Database className="h-5 w-5" />
              <span className="text-sm">Organize your data</span>
            </div>
            <div className="flex items-center gap-2 text-white/90">
              <Lock className="h-5 w-5" />
              <span className="text-sm">Monitor every operation</span>
            </div>
            <div className="flex items-center gap-2 text-white/90">
              <RefreshCw className="h-5 w-5" />
              <span className="text-sm">Analyze real insights</span>
            </div>
            <div className="flex items-center gap-2 text-white/90">
              <Leaf className="h-5 w-5" />
              <span className="text-sm">Grow your profit</span>
            </div>
          </div>
        </div>
        
        <div className="flex justify-center">
          <div className="relative">
            <div className="w-full max-w-md rounded-2xl shadow-elevated overflow-hidden border-4 border-white/30">
              <img 
                src="/assets/landing/brand-hero-3.jpg" 
                alt="AgroTensor dashboard" 
                className="w-full h-auto object-cover"
              />
            </div>
            <div className="absolute -bottom-4 -left-4 w-24 h-24 rounded-xl overflow-hidden border-2 border-white/30 shadow-lg">
              <img 
                src="/assets/landing/brand-hero-4.jpg" 
                alt="AgroTensor mobile" 
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
