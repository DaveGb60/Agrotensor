import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const FirstUseSection = () => {
  const steps = [
    'Install & open — Download FarmDesk on your device and open the app. No signup required to explore.',
    'Create your farm — Add your farm name and basic details. This creates a local database on your device.',
    'Work offline — Enter livestock, crop, and financial records even without internet. FarmDesk is offline-first and fast.',
    'Back up securely — Create encrypted backups stored locally or to your preferred cloud (end-to-end encryption protects your data).',
    'Sync devices — Connect other devices with a secure pairing code to keep teams in sync. Syncs are encrypted and tamper-evident.',
    'Invite your team — Add users and set roles for the right level of access across the farm.',
    'Get insights — Access financial summaries, productivity reports, and tamper-proof activity logs to support decision-making.',
  ];

  const benefits = [
    'Completely free to start — core features remain free.',
    'Offline-first: work on the field without network coverage.',
    'End-to-end encrypted backups and device sync for privacy and safety.',
    'Tamper-proof records with audit trails for accountability.',
    'Classic, easy-to-use interface designed for touch devices.',
  ];

  return (
    <section id="first-use" className="py-16 px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        <h2 className="font-serif text-3xl font-bold text-center text-primary mb-10">
          First time using FarmDesk — quick start
        </h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <ol className="space-y-4 list-decimal list-inside">
              {steps.map((step, idx) => (
                <li key={idx} className="text-foreground leading-relaxed">
                  <strong className="text-primary">{step.split(' — ')[0]}</strong> — {step.split(' — ')[1]}
                </li>
              ))}
            </ol>

            <div className="mt-8">
              <h4 className="font-bold text-lg mb-3">Why people love FarmDesk</h4>
              <ul className="space-y-2 list-disc list-inside">
                {benefits.map((benefit, idx) => (
                  <li key={idx} className="text-muted-foreground">{benefit}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="lg:col-span-1">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="text-lg">Security & sync</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-3 mb-6">
                  <div className="p-3 bg-muted rounded-lg text-center text-sm">
                    End-to-end encrypted backups
                  </div>
                  <div className="p-3 bg-muted rounded-lg text-center text-sm">
                    Device pairing & secure sync
                  </div>
                  <div className="p-3 bg-muted rounded-lg text-center text-sm">
                    Tamper-evident audit logs
                  </div>
                </div>
                
                <h4 className="font-bold mb-3">Quick gallery</h4>
                <div className="flex flex-wrap gap-3">
                  <img 
                    src="/assets/landing/brand-feature-1.jpg" 
                    alt="FarmDesk feature" 
                    className="w-18 h-18 rounded-xl object-cover"
                  />
                  <img 
                    src="/assets/landing/brand-feature-2.jpg" 
                    alt="FarmDesk feature" 
                    className="w-18 h-18 rounded-xl object-cover"
                  />
                  <img 
                    src="/assets/landing/brand-feature-3.jpg" 
                    alt="FarmDesk feature" 
                    className="w-18 h-18 rounded-xl object-cover"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FirstUseSection;
