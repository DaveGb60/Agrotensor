import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldCheck, RefreshCw, FileCheck2 } from 'lucide-react';
import PatternBackdrop from './PatternBackdrop';
import { brand } from './brandAssets';

const FirstUseSection = () => {
  const steps = [
    'Install & open — Download AgroTensor and open the app. No signup required to explore.',
    'Create your farm — Add your farm name and basic details to spin up a local database.',
    'Work offline — Enter livestock, crop and financial records with or without internet.',
    'Back up securely — Encrypted backups stored locally or in your cloud of choice.',
    'Sync devices — Pair devices with a secure code to keep the team in sync.',
    'Invite your team — Add users and set roles for the right level of access.',
    'Get insights — Financial summaries, productivity reports and tamper-proof logs.',
  ];

  return (
    <PatternBackdrop id="first-use" variant="light" className="py-20 px-6">
      <div className="max-w-6xl mx-auto">
        {/* App preview showcase */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center mb-16">
          <div className="lg:col-span-6">
            <span className="uppercase tracking-[0.25em] text-xs font-semibold text-primary/70">
              See it in action
            </span>
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-primary mt-2 leading-tight">
              A dashboard that speaks the language of your farm.
            </h2>
            <p className="text-muted-foreground mt-4 text-lg leading-relaxed">
              Fields, herds, expenses and activities — all in one clear view.
              Designed for touch, tuned for the field.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6">
              {[
                { icon: ShieldCheck, label: 'End-to-end encrypted' },
                { icon: RefreshCw, label: 'Secure device sync' },
                { icon: FileCheck2, label: 'Tamper-proof logs' },
              ].map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="flex items-center gap-2 bg-white/85 border border-primary/10 rounded-xl px-3 py-2.5 shadow-card"
                >
                  <Icon className="h-4 w-4 text-primary flex-shrink-0" />
                  <span className="text-xs font-semibold text-primary leading-tight">{label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-6 relative">
            <div className="absolute -inset-6 bg-primary/10 blur-3xl rounded-full pointer-events-none" />
            <div className="relative rounded-2xl overflow-hidden shadow-elevated border border-primary/10 bg-white">
              <img
                src={brand.appPreview}
                alt="AgroTensor dashboard on laptop and mobile"
                className="w-full h-auto object-cover"
                loading="lazy"
              />
            </div>
          </div>
        </div>

        {/* Quick start */}
        <div className="text-center mb-10">
          <h3 className="font-serif text-2xl md:text-3xl font-bold text-primary">
            First time using AgroTensor? Start here.
          </h3>
          <p className="text-muted-foreground max-w-2xl mx-auto mt-2">
            Up and running in minutes — a simple, guided path from install to insight.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <ol className="space-y-3">
              {steps.map((step, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-4 p-4 bg-white/85 backdrop-blur-sm rounded-xl border border-primary/10 hover:border-primary/30 transition-colors"
                >
                  <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-sm">
                    {idx + 1}
                  </div>
                  <div>
                    <strong className="text-primary block font-serif">
                      {step.split(' — ')[0]}
                    </strong>
                    <span className="text-muted-foreground text-sm">
                      {step.split(' — ')[1]}
                    </span>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="lg:col-span-1 space-y-4">
            {/* Service scape visual */}
            <div className="rounded-2xl overflow-hidden shadow-elevated border border-primary/10 relative">
              <img
                src={brand.serviceScape}
                alt="A living seedling ringed with data — the AgroTensor way"
                className="w-full h-56 object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/70 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 text-primary-foreground">
                <p className="font-serif font-bold leading-tight">
                  Data that grows with your farm.
                </p>
              </div>
            </div>

            <Card className="shadow-card border-primary/10 bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-base font-serif text-primary">
                  Why people love AgroTensor
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {[
                    'Free to start — core features stay free',
                    'Works offline in the field',
                    'Encrypted backup & sync',
                    'Tamper-proof audit trail',
                    'Simple, touch-friendly interface',
                  ].map((b) => (
                    <li key={b} className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                      {b}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PatternBackdrop>
  );
};

export default FirstUseSection;
