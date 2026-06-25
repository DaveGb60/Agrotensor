import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const FeaturesSection = () => {
  const features = [
    { 
      title: 'Manage Livestock & Crops', 
      desc: 'Track animals, breeding, treatments, and crop cycles in one place so nothing slips through the cracks.' 
    },
    { 
      title: 'Finance & Inventory', 
      desc: 'Control costs, record purchases, manage inventory and forecast profitability with clear reports.' 
    },
    { 
      title: 'Analytics & Reporting', 
      desc: 'Turn field data into actionable insights — improve yields and reduce waste with smart analytics.' 
    },
    { 
      title: 'Team & Tasks', 
      desc: 'Coordinate crews, assign tasks and keep communication organized across your farm operations.' 
    },
  ];

  return (
    <section id="features" className="py-16 px-6 bg-gradient-to-b from-white to-green-50">
      <div className="max-w-6xl mx-auto">
        <h2 className="font-serif text-3xl font-bold text-center text-primary mb-12">
          What FarmDesk helps you do
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, idx) => (
            <Card key={idx} className="shadow-card border-0 hover:shadow-elevated transition-shadow">
              <CardHeader>
                <CardTitle className="text-primary font-serif">{feature.title}</CardTitle>
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
