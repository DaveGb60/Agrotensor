import { Target, Eye, Rocket, Heart } from 'lucide-react';

const PhilosophySection = () => {
  const items = [
    { 
      icon: Target,
      title: 'Our Purpose', 
      text: 'Empowering farmers with data and tools to build productive, profitable and sustainable farms.' 
    },
    { 
      icon: Eye,
      title: 'Our Vision', 
      text: 'A world where every farmer, anywhere, can thrive through knowledge and technology.' 
    },
    { 
      icon: Rocket,
      title: 'Our Mission', 
      text: 'Deliver simple, reliable and intelligent digital solutions that transform how farms are managed.' 
    },
    { 
      icon: Heart,
      title: 'Our Promise', 
      text: 'Your farm, your data, our technology — together for a better future.' 
    },
  ];

  return (
    <section id="philosophy" className="py-16 px-6 bg-primary">
      <div className="max-w-6xl mx-auto">
        <h2 className="font-serif text-3xl font-bold text-center text-white mb-4">
          Our purpose, vision, mission, and promise
        </h2>
        <p className="text-center text-white/80 mb-10 max-w-2xl mx-auto">
          Built with farmers, for farmers, to transform agricultural operations.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {items.map((item, idx) => (
            <div 
              key={idx} 
              className="p-6 rounded-2xl bg-white/10 hover:bg-white/20 transition-all duration-300"
            >
              <item.icon className="h-10 w-10 text-white/90 mb-4" />
              <h4 className="font-bold text-white mb-2">{item.title}</h4>
              <p className="text-white/90 text-sm leading-relaxed">{item.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PhilosophySection;
