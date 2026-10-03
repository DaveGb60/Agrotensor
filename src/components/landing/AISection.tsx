import { Sparkles, MessageSquareText, ImageIcon, BarChart3, Table2, LineChart, ShieldCheck, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import PatternBackdrop from './PatternBackdrop';
import { brand } from './brandAssets';

const aiChatPoints = [
  { icon: MessageSquareText, title: 'Ask anything, anytime', desc: 'Practical farming answers in plain language — planting, pests, feed, markets and more.' },
  { icon: ImageIcon, title: 'Show, don\'t type', desc: 'Attach a photo of a crop or animal and get advice about what\'s in the picture.' },
  { icon: ShieldCheck, title: 'Private by design', desc: 'Chats stay on your device; older ones sync to your private cloud space only.' },
];

const insightsPoints = [
  { icon: BarChart3, title: 'Full project audit', desc: 'One tap reviews inputs, outputs, costs, revenue and profit — strengths and money leaks.' },
  { icon: LineChart, title: 'Charts that explain', desc: 'Answers come with graphs, histograms and tables you can read at a glance.' },
  { icon: Table2, title: 'Your real numbers', desc: 'Insights are built from your actual records — not generic advice.' },
];

const AISection = () => {
  return (
    <PatternBackdrop id="ai" variant="dark" className="py-20 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <span className="uppercase tracking-[0.25em] text-xs font-semibold text-emerald-300/80 inline-flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5" /> AgroTensor AI
          </span>
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-white mt-2">
            A farm advisor that lives in your pocket
          </h2>
          <p className="text-white/70 max-w-2xl mx-auto mt-3">
            Two AI services built into AgroTensor: a farming assistant you can chat with,
            and an analyst that reads your project records and shows you where the money goes.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-10">
          {/* AgroTensor AI chat */}
          <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-sm p-7 hover:bg-white/[0.08] transition-colors">
            <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-emerald-400/15 text-emerald-300 mb-4">
              <MessageSquareText className="h-6 w-6" />
            </div>
            <h3 className="font-serif text-2xl font-bold text-white mb-2">AgroTensor AI Chat</h3>
            <p className="text-sm text-white/70 mb-6 leading-relaxed">
              Your everyday farming companion. Ask questions in your own words, attach photos,
              and get clear answers — free daily questions included for every farmer.
            </p>
            <ul className="space-y-4">
              {aiChatPoints.map(({ icon: Icon, title, desc }) => (
                <li key={title} className="flex gap-3">
                  <div className="shrink-0 inline-flex items-center justify-center h-9 w-9 rounded-lg bg-white/10 text-emerald-300">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{title}</p>
                    <p className="text-xs text-white/60 leading-snug">{desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Farm Insights */}
          <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-sm p-7 hover:bg-white/[0.08] transition-colors">
            <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-sky-400/15 text-sky-300 mb-4">
              <BarChart3 className="h-6 w-6" />
            </div>
            <h3 className="font-serif text-2xl font-bold text-white mb-2">Farm Insights</h3>
            <p className="text-sm text-white/70 mb-6 leading-relaxed">
              Pick any of your projects and ask about its costs, yields and operations.
              The AI audits your records and answers with tables, graphs and histograms.
            </p>
            <ul className="space-y-4">
              {insightsPoints.map(({ icon: Icon, title, desc }) => (
                <li key={title} className="flex gap-3">
                  <div className="shrink-0 inline-flex items-center justify-center h-9 w-9 rounded-lg bg-white/10 text-sky-300">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{title}</p>
                    <p className="text-xs text-white/60 leading-snug">{desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* App preview band */}
        <div className="relative rounded-3xl overflow-hidden shadow-elevated border border-white/10">
          <img
            src={brand.appPreview}
            alt="AgroTensor app preview with AI services"
            className="w-full h-44 md:h-60 object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent" />
          <div className="absolute inset-0 flex items-center px-6 md:px-12">
            <div className="max-w-md">
              <h3 className="font-serif text-2xl md:text-3xl font-bold text-white leading-tight mb-3">
                Try the AI that knows your farm.
              </h3>
              <Link
                to="/app"
                className="inline-flex items-center gap-2 rounded-full bg-emerald-400 text-emerald-950 font-semibold text-sm px-5 py-2.5 hover:bg-emerald-300 transition-colors"
              >
                Open the app <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </PatternBackdrop>
  );
};

export default AISection;
