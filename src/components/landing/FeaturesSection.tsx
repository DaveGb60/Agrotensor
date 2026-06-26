import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Cog, TrendingUp, Users, Shield } from 'lucide-react';

const FeaturesSection = () => {
  const features = [
    { 
      icon: Cog,
      title: 'Manage Livestock & Crops', 
      desc: 'Track animals, breeding, treatments, and crop cycles in one place so nothing slips through the cracks.',
      image: '/assets/landing/brand-feature-2.jpg'
    },
    { 
      icon: TrendingUp,
      title: 'Finance & Inventory', 
      desc: 'Control costs, record purchases, manage inventory and forecast profitability with clear reports.',
      image: '/assets/landing/brand-feature-3.jpg'
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
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* First feature with image */}
          <div className="flex flex-col gap-4">
            <Card 
              className="shadow-card border-0 hover:shadow-elevated transition-all duration-300 hover:-translate-y-1 overflow-hidden"
            >
              <div className="h-48 overflow-hidden">
                <img 
                  src={features[0].image} 
                  alt="Manage Livestock & Crops" 
                  className="w-full h-full object-cover"
                />
              </div>
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  {(() => { const Icon = features[0].icon; return <Icon className="h-8 w-8 text-primary" />; })()}
                  <CardTitle className="text-primary font-serif">{features[0].title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{features[0].desc}</p>
              </CardContent>
            </Card>
          </div>

          {/* Second feature with image */}
          <div className="flex flex-col gap-4">
            <Card 
              className="shadow-card border-0 hover:shadow-elevated transition-all duration-300 hover:-translate-y-1 overflow-hidden"
            >
              <div className="h-48 overflow-hidden">
                <img 
                  src={features[1].image} 
                  alt="Finance & Inventory" 
                  className="w-full h-full object-cover"
                />
              </div>
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  {(() => { const Icon = features[1].icon; return <Icon className="h-8 w-8 text-primary" />; })()}
                  <CardTitle className="text-primary font-serif">{features[1].title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{features[1].desc}</p>
              </CardContent>
            </Card>
          </div>

          {/* Third and fourth features */}
          <div className="flex flex-col gap-4">
            <Card 
              className="shadow-card border-0 hover:shadow-elevated transition-all duration-300 hover:-translate-y-1"
            >
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  {(() => { const Icon = features[2].icon; return <Icon className="h-8 w-8 text-primary" />; })()}
                  <CardTitle className="text-primary font-serif">{features[2].title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{features[2].desc}</p>
              </CardContent>
            </Card>
          </div>
          <div className="flex flex-col gap-4">
            <Card 
              className="shadow-card border-0 hover:shadow-elevated transition-all duration-300 hover:-translate-y-1"
            >
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  {(() => { const Icon = features[3].icon; return <Icon className="h-8 w-8 text-primary" />; })()}
                  <CardTitle className="text-primary font-serif">{features[3].title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{features[3].desc}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
