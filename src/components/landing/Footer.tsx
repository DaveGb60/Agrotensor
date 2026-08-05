const LandingFooter = () => {
  return (
    <footer id="contact" className="py-12 px-6 bg-primary text-white">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div>
            <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
              <img 
                src="/assets/landing/logo.png" 
                alt="AgroTensor" 
                className="h-8 w-8 rounded-lg object-contain" 
              />
              AgroTensor
            </h3>
            <p className="text-white/80 text-sm">
              Your farm's digital office — offline-first, secure, and simple.
            </p>
          </div>
          
          <div>
            <h4 className="font-bold mb-3">Contact</h4>
            <ul className="space-y-2 text-sm text-white/80">
              <li>
                <a href="mailto:gfibionjoseph@gmail.com" className="hover:underline">
                  gfibionjoseph@gmail.com
                </a>
              </li>
              <li>
                <a href="tel:0768974474" className="hover:underline">
                  +254 768 974 474
                </a>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-bold mb-3">Quick Links</h4>
            <ul className="space-y-2 text-sm text-white/80">
              <li><a href="#features" className="hover:underline">Features</a></li>
              <li><a href="#philosophy" className="hover:underline">Philosophy</a></li>
              <li><a href="#first-use" className="hover:underline">First Use</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-white/10 pt-6 text-center">
          <p className="text-white/80 text-sm">
            © {new Date().getFullYear()} AgroTensor — Your Farm's Digital Office
          </p>
        </div>
      </div>
    </footer>
  );
};

export default LandingFooter;
