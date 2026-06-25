import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Cog, TrendingUp, Users, Shield } from 'lucide-react';

const FeaturesSection = () => {
  const features = [
    { 
      icon: Cog,
      title: 'Manage Livestock & Crops', 
      desc: 'Track animals, breeding, treatments, and crop cycles in one place so nothing slips through the cracks.' 
    },
    { 
      icon: TrendingUp,
      title: 'Finance & Inventory', 
      desc: 'Control costs, record purchases, manage inventory and forecast profitability with clear reports.' 
    },
    { 
      icon: Shield,
      title: 'Analytics & Reporting', 
      desc: 'Turn field data into actionable insights — improve yields and reduce waste with smart analytics.' 
    },
    { 
      icon: Users,
      title: 'Team & Tasks', 
      desc: 'Coordinate crews, assign tasks and keep communication organized across your farm operations.' 
    },
  ];

  return (
    <section id="features" className="py-16 px-6 bg-gradient-to-b from-white to-green-50">
      <div className="max-w-6xl mx-auto">
        <h2 className="font-serif text-3xl font-bold text-center text-primary mb-4">
          What FarmDesk helps you do
        </h2>
        <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
          Comprehensive tools designed specifically for farmers to run operations smarter, not harder.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, idx) => (
            <Card 
              key={idx} 
              className="shadow-card border-0 hover:shadow-elevated transition-all duration-300 hover:-translate-y-1"
            >
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <feature.icon className="h-8 w-8 text-primary" />
                  <CardTitle className="text-primary font-serif">{feature.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{feature.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
