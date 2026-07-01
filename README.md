# Agrotensor

This repository now includes updated logo and web app manifest entries.

- The main logo is at: `public/assets/landing/logo.png` (source JPG converted/used as-is)
- A web manifest has been added at `public/site.webmanifest` and points to the landing logo as the app icon.
- `public/index.html` was added as a head-template that references the manifest and the landing logo. If your app uses a framework template (Next.js/_document, CRA index.html, or Vite index.html), merge the head portion of `public/index.html` into your existing template.

Notes for maintainers:
- For optimal results, consider generating dedicated PNG and ICO files at these sizes and replacing the manifest/index references with them:
  - 512x512 (logo-512.png)
  - 192x192 (logo-192.png)
  - 180x180 (apple-touch-icon.png)
  - 32x32 (favicon-32x32.png)
  - 16x16 (favicon-16x16.png)
  - favicon.ico (multi-resolution ICO)

I used the existing `public/assets/landing/logo.png` as the canonical image source in this commit. If you'd like, I can follow up with a commit to add the resized PNG/ICO files generated from the provided JPG.
