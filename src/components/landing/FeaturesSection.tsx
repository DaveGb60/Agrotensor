import { Sprout, Beef, ClipboardList, LineChart, Wallet, WifiOff, ShieldCheck, Sparkles, BarChart3, CloudUpload, FileDown, Trash2 } from 'lucide-react';
import PatternBackdrop from './PatternBackdrop';
import { brand } from './brandAssets';

const features = [
  { icon: Sprout, title: 'Crop Management', desc: 'Plan, monitor and record every crop activity.' },
  { icon: Beef, title: 'Livestock & Breeding', desc: 'Track animals, breeding cycles and production.' },
  { icon: ClipboardList, title: 'Farm Records', desc: 'Keep expenses, sales and notes organized.' },
  { icon: Wallet, title: 'Profit & Loss', desc: 'Monthly statements, costs and profitability.' },
  { icon: Sparkles, title: 'AI Farm Advisor', desc: 'Chat with AgroTensor AI — text or photos.' },
  { icon: BarChart3, title: 'AI Farm Insights', desc: 'Audit any project with charts and tables.' },
  { icon: WifiOff, title: 'Offline First', desc: 'Works fully offline; syncs when connected.' },
  { icon: CloudUpload, title: 'Cloud Backup', desc: 'Back up and restore your data safely.' },
  { icon: FileDown, title: 'Share & Import', desc: 'Send projects as files, import them anywhere.' },
  { icon: Trash2, title: 'Trash & Recovery', desc: 'Deleted projects restorable for 30 days.' },
  { icon: LineChart, title: 'Reports & Analytics', desc: 'Turn field data into clear insights.' },
  { icon: ShieldCheck, title: 'Private & Secure', desc: 'Your data is private, safe and yours.' },
];

const FeaturesSection = () => {
  return (
    <PatternBackdrop id="features" variant="light" className="py-20 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <span className="uppercase tracking-[0.25em] text-xs font-semibold text-primary/70">
            What We Do
          </span>
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-primary mt-2">
            Every part of your farm, one workspace
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto mt-3">
            AgroTensor brings crops, livestock, records, and finances together —
            simple enough for daily use, powerful enough to run the whole operation.
          </p>
        </div>

        {/* Feature icon grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-14">
          {features.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="group bg-white/85 backdrop-blur-sm border border-primary/10 rounded-2xl p-5 hover:shadow-elevated hover:-translate-y-1 transition-all"
            >
              <div className="inline-flex items-center justify-center h-11 w-11 rounded-xl bg-primary/10 text-primary mb-3 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="font-serif font-semibold text-primary text-base leading-tight mb-1">
                {title}
              </h3>
              <p className="text-xs text-muted-foreground leading-snug">{desc}</p>
            </div>
          ))}
        </div>

        {/* Scenes strip — real farm imagery band */}
        <div className="relative rounded-3xl overflow-hidden shadow-elevated border border-primary/10">
          <img
            src={brand.scenesStrip}
            alt="Crops, farmers, livestock and greenhouse — the scope of AgroTensor"
            className="w-full h-40 md:h-56 object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-primary/85 via-primary/40 to-transparent" />
          <div className="absolute inset-0 flex items-center px-6 md:px-12">
            <div className="max-w-md text-primary-foreground">
              <p className="text-xs uppercase tracking-[0.2em] font-semibold opacity-80 mb-2">
                Built for every farm
              </p>
              <h3 className="font-serif text-2xl md:text-3xl font-bold leading-tight">
                Smallholder to enterprise — one tool that grows with you.
              </h3>
            </div>
          </div>
        </div>
      </div>
    </PatternBackdrop>
  );
};

export default FeaturesSection;
