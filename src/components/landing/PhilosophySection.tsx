import { Target, Eye, Rocket, Heart } from 'lucide-react';
import PatternBackdrop from './PatternBackdrop';
import { brand } from './brandAssets';

const items = [
  { icon: Target, title: 'Our Purpose', text: 'Empower farmers with data and tools to build productive, profitable and sustainable farms.' },
  { icon: Eye, title: 'Our Vision', text: 'A world where every farmer, anywhere, can thrive through knowledge and technology.' },
  { icon: Rocket, title: 'Our Mission', text: 'Deliver simple, reliable and intelligent digital solutions that transform how farms are managed.' },
  { icon: Heart, title: 'Our Promise', text: 'Your farm, your data, our technology — together for a better future.' },
];

const PhilosophySection = () => {
  return (
    <PatternBackdrop id="philosophy" variant="green" className="py-20 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center mb-14">
          <div className="lg:col-span-5 order-2 lg:order-1">
            <div className="relative rounded-3xl overflow-hidden border border-white/15 shadow-elevated">
              <img
                src={brand.about}
                alt="A farmer confidently checking records on a tablet in the field"
                className="w-full h-auto object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
            </div>
          </div>

          <div className="lg:col-span-7 order-1 lg:order-2 text-white">
            <span className="uppercase tracking-[0.25em] text-xs font-semibold text-green-200/90">
              About AgroTensor
            </span>
            <h2 className="font-serif text-3xl md:text-4xl font-bold mt-2 leading-tight">
              A modern farm platform — grounded in the real work of farming.
            </h2>
            <p className="text-white/85 mt-4 text-lg leading-relaxed">
              We combine practical agricultural knowledge with smart technology to
              give farmers the clarity they need to grow with confidence.
            </p>
            <div className="mt-6 h-1 w-16 bg-green-300 rounded-full" />
            <p className="text-white/70 mt-4 text-sm max-w-xl">
              Built with farmers, for farmers. Offline-first, private by design, and
              simple enough to fit into the daily rhythm of the farm.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {items.map(({ icon: Icon, title, text }) => (
            <div
              key={title}
              className="p-6 rounded-2xl bg-white/8 hover:bg-white/15 border border-white/10 backdrop-blur-sm transition-all"
            >
              <div className="inline-flex items-center justify-center h-11 w-11 rounded-xl bg-green-300/20 text-green-200 mb-3">
                <Icon className="h-5 w-5" />
              </div>
              <h4 className="font-serif font-bold text-white mb-2">{title}</h4>
              <p className="text-white/80 text-sm leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </PatternBackdrop>
  );
};

export default PhilosophySection;
