# Landing & onboarding integration notes

This update adds a lightweight onboarding modal and a simple device pairing UI to the repository so the app can show a friendly first-run experience and offer device sync.

Files added in this change:
- src/hooks/useLocalStorage.tsx — small hook to persist flags in localStorage
- src/components/OnboardingModal.tsx — onboarding modal shown once (localStorage key: farmdesk_seen_onboard)
- src/styles/onboarding.css — styles for the onboarding modal
- src/components/DevicePairing.tsx — small device pairing UI (generates a one-time 6-digit code and supports copy)
- src/styles/devicePairing.css — pairing styles

How to use these components in your app

1. Add the OnboardingModal component near the top of your app shell or homepage so it appears on first load.

Example (React / Next.js):

  import OnboardingModal from '../components/OnboardingModal';

  export default function AppHome() {
    return (
      <>
        <OnboardingModal />
        <LandingHero />
        {/* rest of homepage */}
      </>
    )
  }

2. Use DevicePairing inside user settings or within the onboarding flow for pairing additional devices.

Example:
  <DevicePairing />

Security notes

- The DevicePairing component only creates a short numeric code. For production you should implement a secure exchange: a short-lived token signed by the server or a public-key challenge (WebCrypto) and an authenticated channel to exchange keys.
- Add rate limiting for pairing code generation and verification on the server side if you support remote pairing.

Next improvements to consider
- Add a guided backup flow that generates an encrypted backup file (AES-GCM) and allows a passphrase-based export/import.
- Add a QR generator for pairing codes (serverless approach: encode JSON payload and sign it)
- Add analytics opt-in during onboarding and a privacy explainer screen describing exactly what data (if any) is sent to remote services.
