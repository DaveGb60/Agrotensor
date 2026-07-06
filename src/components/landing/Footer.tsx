import { brand } from './brandAssets';

const LandingFooter = () => {
  return (
    <footer
      id="contact"
      className="relative py-14 px-6 text-white overflow-hidden"
      style={{
        backgroundImage: `linear-gradient(180deg, hsl(150 55% 12% / 0.97), hsl(150 65% 8% / 0.99)), url(${brand.bgPattern})`,
        backgroundSize: 'cover, 520px auto',
        backgroundRepeat: 'no-repeat, repeat',
      }}
    >
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-10">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <img
                src={brand.icon}
                alt="AgroTensor"
                className="h-10 w-10 rounded-lg object-contain"
              />
              <div>
                <h3 className="font-serif font-bold text-lg leading-tight">AgroTensor</h3>
                <p className="text-[10px] uppercase tracking-[0.2em] text-green-200/80">
                  Manage today. Grow every day.
                </p>
              </div>
            </div>
            <p className="text-white/70 text-sm leading-relaxed">
              Your farm's digital office — offline-first, secure, and built for the
              real work of farming.
            </p>
          </div>

          <div>
            <h4 className="font-serif font-bold mb-3">Contact</h4>
            <ul className="space-y-2 text-sm text-white/75">
              <li>
                <a href="mailto:gfibionjoseph@gmail.com" className="hover:text-green-300 transition-colors">
                  gfibionjoseph@gmail.com
                </a>
              </li>
              <li>
                <a href="tel:+254768974474" className="hover:text-green-300 transition-colors">
                  +254 768 974 474
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-serif font-bold mb-3">Quick Links</h4>
            <ul className="space-y-2 text-sm text-white/75">
              <li><a href="#features" className="hover:text-green-300 transition-colors">Features</a></li>
              <li><a href="#philosophy" className="hover:text-green-300 transition-colors">Philosophy</a></li>
              <li><a href="#first-use" className="hover:text-green-300 transition-colors">First Use</a></li>
              <li><a href="/app" className="hover:text-green-300 transition-colors">Open App</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-white/60 text-xs">
            © {new Date().getFullYear()} AgroTensor — Your Farm's Digital Office
          </p>
          <p className="text-white/50 text-xs">Made by Gfibion Genesis</p>
        </div>
      </div>
    </footer>
  );
};

export default LandingFooter;
