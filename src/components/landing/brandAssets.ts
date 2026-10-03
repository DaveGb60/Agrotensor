// Brand images live in public/assets/landing-brand so they are served by
// whatever host deploys the app (Lovable preview, Vercel, custom domain).
const base = '/assets/landing-brand';

export const brand = {
  hero: `${base}/hero.jpg`,
  bgPattern: `${base}/bg-pattern.jpg`,
  appPreview: `${base}/app-preview.jpg`,
  serviceScape: `${base}/service-scape.jpg`,
  scenesStrip: `${base}/scenes-strip.jpg`,
  about: `${base}/about.jpg`,
  icon: `${base}/icon.png`,
  logo: `${base}/logo.png`,
};
