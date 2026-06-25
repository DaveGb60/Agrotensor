import { Sparkles, Shield, Zap, Users, TrendingUp } from 'lucide-react';

const ValuesSection = () => {
  const values = [
    { 
      icon: Sparkles, 
      title: 'Simplicity', 
      desc: 'Easy to use, easy to adopt.' 
    },
    { 
      icon: Shield, 
      title: 'Trust', 
      desc: 'Your data is secure and yours.' 
    },
    { 
      icon: Zap, 
      title: 'Innovation', 
      desc: 'Technology that solves real farm problems.' 
    },
    { 
      icon: Users, 
      title: 'Collaboration', 
      desc: 'Built for teams, partners, and communities.' 
    },
    { 
      icon: TrendingUp, 
      title: 'Growth', 
      desc: 'Insights today, better harvests tomorrow.' 
    },
  ];

  return (
    <section className="py-16 px-6 bg-gradient-to-b from-white to-green-50">
      <div className="max-w-6xl mx-auto">
        <h2 className="font-serif text-3xl font-bold text-center text-primary mb-10">
          Brand values
        </h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {values.map((value, idx) => (
            <div 
              key={idx}
              className="bg-white p-5 rounded-xl shadow-card flex gap-3 items-center hover:shadow-elevated transition-shadow"
            >
              <value.icon className="h-9 w-9 flex-shrink-0 text-primary" />
              <div>
                <strong className="block mb-1">{value.title}</strong>
                <p className="text-muted-foreground text-sm">{value.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ValuesSection;
