import { Sparkles, Shield, Zap, Users, TrendingUp } from 'lucide-react';
import PatternBackdrop from './PatternBackdrop';

const values = [
  { icon: Sparkles, title: 'Simplicity', desc: 'Easy to use, easy to adopt.' },
  { icon: Shield, title: 'Trust', desc: 'Your data is secure and yours.' },
  { icon: Zap, title: 'Innovation', desc: 'Technology that solves real farm problems.' },
  { icon: Users, title: 'Collaboration', desc: 'Built for teams, partners and communities.' },
  { icon: TrendingUp, title: 'Growth', desc: 'Insights today, better harvests tomorrow.' },
];

const ValuesSection = () => {
  return (
    <PatternBackdrop variant="light" className="py-20 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <span className="uppercase tracking-[0.25em] text-xs font-semibold text-primary/70">
            Brand Values
          </span>
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-primary mt-2">
            What we stand for
          </h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {values.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="bg-white/90 backdrop-blur-sm border border-primary/10 p-5 rounded-2xl shadow-card hover:shadow-elevated hover:-translate-y-1 transition-all text-center"
            >
              <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-primary/10 text-primary mb-3">
                <Icon className="h-5 w-5" />
              </div>
              <strong className="block mb-1 font-serif text-primary">{title}</strong>
              <p className="text-muted-foreground text-xs leading-snug">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </PatternBackdrop>
  );
};

export default ValuesSection;
