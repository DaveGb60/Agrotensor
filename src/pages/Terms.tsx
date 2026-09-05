import { LegalPage } from "@/components/LegalPage";

const Terms = () => (
  <LegalPage title="Terms of Service" lastUpdated="September 5, 2026">
    <section>
      <h2>1. Acceptance</h2>
      <p>
        By using AgroTensor ("the app"), you agree to these terms. If you do not agree, please
        do not use the app.
      </p>
    </section>

    <section>
      <h2>2. What the app provides</h2>
      <p>
        AgroTensor is a farm record-keeping tool for tracking projects, costs, revenue,
        livestock, and related notes. It is a record-keeping aid only — it does not provide
        agronomic, veterinary, financial, or legal advice, and figures shown (such as profit
        estimates) depend entirely on the data you enter.
      </p>
    </section>

    <section>
      <h2>3. Your data and your responsibility</h2>
      <ul>
        <li>Your records are stored on your device. You are responsible for keeping backups using the built-in export, share, sync, or cloud backup features.</li>
        <li>Uninstalling the app or clearing browser data can permanently delete local records that have no backup.</li>
        <li>You are responsible for the accuracy and lawfulness of the data you enter.</li>
      </ul>
    </section>

    <section>
      <h2>4. Acceptable use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>Misuse the app, attempt to disrupt it, or access other users' data.</li>
        <li>Use sharing features to distribute unlawful or harmful content.</li>
        <li>Misrepresent the app or its developer in redistribution.</li>
      </ul>
    </section>

    <section>
      <h2>5. Optional paid/donation features</h2>
      <p>
        Donations are voluntary and non-refundable, and do not change the core functionality of
        the app. Payments are handled by third-party providers under their own terms.
      </p>
    </section>

    <section>
      <h2>6. Availability</h2>
      <p>
        The app works offline by design, but cloud-dependent features (backup, sign-in) require
        connectivity and may be interrupted. We may update or discontinue features; where an
        update affects stored data we aim to migrate it automatically, but keeping your own
        backups remains your responsibility.
      </p>
    </section>

    <section>
      <h2>7. Limitation of liability</h2>
      <p>
        To the maximum extent permitted by law, AgroTensor and its developer are not liable for
        any indirect or consequential loss — including lost profits, lost data, or farming
        decisions made based on app figures — arising from use of the app. The app is provided
        "as is" without warranties of any kind.
      </p>
    </section>

    <section>
      <h2>8. Changes to these terms</h2>
      <p>
        We may update these terms from time to time. The "Last updated" date above shows the
        current version; continued use of the app after changes means you accept them.
      </p>
    </section>

    <section>
      <h2>9. Contact</h2>
      <p>
        Questions about these terms? Email{" "}
        <a href="mailto:gfibionjoseph@gmail.com" className="text-primary underline">gfibionjoseph@gmail.com</a>.
      </p>
    </section>
  </LegalPage>
);

export default Terms;
