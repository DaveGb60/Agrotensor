# Landing integration notes

This repo now contains a standalone static landing page at /public/landing/index.html and a small React component you can drop into the app to use the same hero design.

Files added:
- public/assets/landing/logo.svg
- public/assets/landing/hero.svg (placeholder background SVG)
- public/assets/landing/hero_app.svg (app mock placeholder)
- public/assets/landing/value-*.svg (small value icons)
- src/components/LandingHero.tsx
- src/styles/landing.css
- public/landing/index.html (already committed)

How to integrate the hero into your main homepage (React / Next.js):

1. Import the component and stylesheet into your page (e.g., pages/index.tsx or src/pages/Home.tsx):

   import LandingHero from '../components/LandingHero';
   import '../styles/landing.css';

   export default function Home() {
     return (
       <div>
         <LandingHero />
         {/* other homepage content */}
       </div>
     )
   }

2. Replace placeholders with the final images you provided:
   - Replace public/assets/landing/hero.svg with hero.jpg or hero.webp (keep the path /assets/landing/hero.*)
   - Replace logo.svg and hero_app.svg with the high-resolution PNG/JPG you shared
   - Replace value-*.svg icons with your preferred SVG icons or PNGs

3. (Optional) Update Open Graph meta tags in your app's head to point to the full URL of the hero image for better social previews.

4. Optimize images: generate webp variants and add srcset where needed for responsive loading.

If you want, I can now:
- Replace the placeholder SVGs with the actual images you uploaded (I can add the binary files if you confirm the repository should contain them),
- Generate optimized webp variants and srcset attributes and wire them into the component,
- Update an existing homepage file directly (pages/index.tsx) if you want me to commit that change.  

Tell me which of those you'd like next and I'll proceed.
