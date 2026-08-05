import React from 'react';
import './onboarding.css';
import useLocalStorage from '../hooks/useLocalStorage';

const STEPS = [
  {
    title: 'Install & open',
    body: 'Download AgroTensor on your device and open the app. No signup required to explore.'
  },
  { title: 'Create your farm', body: "Add your farm name and basic details. This creates a local database on your device." },
  { title: 'Work offline', body: 'Enter livestock, crop, and financial records even without internet. Changes sync when online.' },
  { title: 'Back up securely', body: 'Create encrypted backups stored locally or to your preferred cloud.' },
  { title: 'Sync devices', body: 'Connect other devices with a secure pairing code to keep teams in sync.' },
  { title: 'Invite your team', body: 'Add users and set roles for the right level of access.' },
  { title: 'Get insights', body: 'View financial summaries, productivity reports, and tamper-proof audit logs.' }
];

const OnboardingModal: React.FC = () => {
  const [seen, setSeen] = useLocalStorage<boolean>('agrotensor_seen_onboard', false);
  const [index, setIndex] = React.useState(0);

  if (seen) return null;

  return (
    <div className="fd-onboard" role="dialog" aria-modal="true" aria-label="Welcome to AgroTensor">
      <div className="fd-onboard__panel">
        <header className="fd-onboard__header">
          <h2>Welcome to AgroTensor</h2>
          <button className="fd-onboard__close" onClick={() => setSeen(true)} aria-label="Close">✕</button>
        </header>

        <main className="fd-onboard__content">
          <h3>{STEPS[index].title}</h3>
          <p>{STEPS[index].body}</p>
        </main>

        <footer className="fd-onboard__footer">
          <div className="fd-onboard__pager">{index + 1} / {STEPS.length}</div>
          <div className="fd-onboard__actions">
            <button onClick={() => { setSeen(true); }} className="fd-btn fd-btn--alt">Skip</button>
            {index < STEPS.length - 1 ? (
              <button onClick={() => setIndex(i => Math.min(i + 1, STEPS.length - 1))} className="fd-btn">Next</button>
            ) : (
              <button onClick={() => setSeen(true)} className="fd-btn">Done</button>
            )}
          </div>
        </footer>
      </div>
    </div>
  );
}

export default OnboardingModal;
