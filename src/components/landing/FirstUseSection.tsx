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
        <h2 className="font-serif text-3xl font-bold text-center text-primary mb-4">
          First time using FarmDesk — quick start
        </h2>
        <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
          Get up and running in minutes with our simple guided process.
        </p>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <ol className="space-y-3">
              {steps.map((step, idx) => (
                <li key={idx} className="flex items-start gap-3 p-4 bg-green-50 rounded-xl border border-green-100">
                  <div className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold text-sm">
                    {idx + 1}
                  </div>
                  <div>
                    <strong className="text-primary block">{step.split(' — ')[0]}</strong>
                    <span className="text-muted-foreground text-sm">{step.split(' — ')[1]}</span>
                  </div>
                </li>
              ))}
            </ol>

            <div className="mt-8 p-6 bg-muted rounded-2xl">
              <h4 className="font-bold text-lg mb-3 flex items-center gap-2">
                <svg className="h-6 w-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Why people love FarmDesk
              </h4>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {benefits.map((benefit, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <svg className="h-4 w-4 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="lg:col-span-1">
            <Card className="shadow-card h-full">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <svg className="h-5 w-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Security & sync
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 gap-3">
                  <div className="p-4 bg-green-50 rounded-xl text-center">
                    <div className="font-semibold text-primary mb-1">End-to-end encrypted backups</div>
                  </div>
                  <div className="p-4 bg-green-50 rounded-xl text-center">
                    <div className="font-semibold text-primary mb-1">Device pairing & secure sync</div>
                  </div>
                  <div className="p-4 bg-green-50 rounded-xl text-center">
                    <div className="font-semibold text-primary mb-1">Tamper-evident audit trails</div>
                  </div>
                </div>
                
                <h4 className="font-bold">Quick gallery</h4>
                <div className="flex flex-wrap gap-3">
                  <img 
                    src="/assets/landing/brand-feature-1.jpg" 
                    alt="FarmDesk feature" 
                    className="w-20 h-20 rounded-xl object-cover shadow-card hover:shadow-elevated transition-all duration-300"
                  />
                  <img 
                    src="/assets/landing/brand-feature-2.jpg" 
                    alt="FarmDesk feature" 
                    className="w-20 h-20 rounded-xl object-cover shadow-card hover:shadow-elevated transition-all duration-300"
                  />
                  <img 
                    src="/assets/landing/brand-feature-3.jpg" 
                    alt="FarmDesk feature" 
                    className="w-20 h-20 rounded-xl object-cover shadow-card hover:shadow-elevated transition-all duration-300"
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
