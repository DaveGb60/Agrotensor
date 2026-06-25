import React from 'react';
import './landing.css';
import OnboardingModal from './OnboardingModal';

const LandingHero: React.FC = () => {
  return (
    <>
      {/* Auto-mounted onboarding modal on first run */}
      <OnboardingModal />

      <section className="fd-hero" aria-label="FarmDesk hero">
        <div className="fd-hero__overlay">
          <div className="fd-hero__container">
            <div className="fd-hero__left">
              <div className="fd-eyebrow">Run Your Farm. Grow Your Business.</div>
              <h1>One platform to manage every part of your farm operations from anywhere.</h1>
              <p className="fd-lead">Organize your data, monitor operations, analyze insights and grow profit — FarmDesk is your farm's digital office, built for farmers and farm teams.</p>
              <div className="fd-badges">
                <span className="fd-badge">Free</span>
                <span className="fd-badge">Offline-first</span>
                <span className="fd-badge">Encrypted backups</span>
              </div>
              <div className="fd-cta">
                <a className="fd-btn" href="/signup">Get started — it's free</a>
                <a className="fd-btn fd-btn--alt" href="/demo">Request a demo</a>
              </div>
            </div>
            <div className="fd-hero__right">
              <img src="/assets/landing/dashboard_preview.svg" alt="FarmDesk app preview" className="fd-mock"/>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export default LandingHero;
