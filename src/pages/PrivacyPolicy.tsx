import { LegalPage } from "@/components/LegalPage";

const PrivacyPolicy = () => (
  <LegalPage title="Privacy Policy" lastUpdated="September 5, 2026">
    <section>
      <h2>1. Overview</h2>
      <p>
        AgroTensor is an offline-first farm records application. This policy explains what data
        the app handles, where it is stored, and the choices you have. The short version: your
        farm records live on your device by default, and we do not sell or mine your data.
      </p>
    </section>

    <section>
      <h2>2. Data stored on your device</h2>
      <p>Projects, records, notes, costs, and livestock data you enter are stored locally in your browser's on-device database (IndexedDB). This data:</p>
      <ul>
        <li>Never leaves your device unless you explicitly export, share, sync, or back it up.</li>
        <li>Is not accessible to us or to any third party.</li>
        <li>Can be deleted at any time by deleting projects, emptying the trash, or clearing the app's site data in your browser.</li>
      </ul>
    </section>

    <section>
      <h2>3. Optional cloud backup</h2>
      <p>
        If you sign in and enable cloud backup, a copy of the projects you choose to back up is
        stored in your private cloud storage area so you can restore it on another device. You can
        delete cloud backups at any time from the Cloud page. We do not access the contents of
        your backups for any purpose other than providing the backup service.
      </p>
    </section>

    <section>
      <h2>4. Sharing and device-to-device sync</h2>
      <p>
        When you share a project as a JSON file or sync directly between devices (QR/WebRTC),
        the data travels only where you send it. Direct device sync is peer-to-peer and does not
        pass through our servers.
      </p>
    </section>

    <section>
      <h2>5. Payments and donations</h2>
      <p>
        Optional donations are processed by third-party payment providers (e.g. Paystack /
        M-Pesa). We never see or store your card or mobile-money credentials; those are handled
        entirely by the payment provider under their own privacy policy.
      </p>
    </section>

    <section>
      <h2>6. Analytics and tracking</h2>
      <p>
        The app does not include advertising trackers. If basic usage analytics are enabled, they
        are limited to anonymous counts (such as page visits) and never include your farm records.
      </p>
    </section>

    <section>
      <h2>7. Your choices</h2>
      <ul>
        <li>Use the app fully offline without creating any account.</li>
        <li>Export or delete your data at any time.</li>
        <li>Request deletion of cloud backups or your account by contacting us.</li>
      </ul>
    </section>

    <section>
      <h2>8. Contact</h2>
      <p>
        Questions about this policy? Email{" "}
        <a href="mailto:gfibionjoseph@gmail.com" className="text-primary underline">gfibionjoseph@gmail.com</a>{" "}
        or call +254 768 974 474.
      </p>
    </section>
  </LegalPage>
);

export default PrivacyPolicy;
