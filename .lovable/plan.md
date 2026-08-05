## Cloud Backup Page

Add a dedicated `/cloud` page that gives users a personal cloud backup of their FarmDeck data. Users see it as "Cloud Backup"; under the hood it uses Lovable Cloud (Supabase) with anonymous authentication.

### User experience

1. User opens **Cloud Backup** from the header.
2. First visit: tap **Create Cloud Identity** → a unique Cloud ID is auto-generated and saved. Shown on screen with a Copy button and a note: "Save this ID to restore your data on another device."
3. On other devices, user taps **Use Existing ID**, pastes the Cloud ID, and is signed in to the same backup.
4. Two main actions:
   - **Back up to Cloud** — pushes all active (non-deleted) projects + records.
   - **Restore from Cloud** — pulls the latest backup and merges into local IndexedDB.
5. Status panel shows: Cloud ID, last backup time, project/record counts in cloud vs local.

### Technical plan

**Backend (Lovable Cloud)**
- Enable Lovable Cloud.
- Use Supabase **anonymous sign-in** as the identity. The `auth.users.id` (UUID) is the user-facing "Cloud ID".
- Tables (all RLS-protected to `auth.uid() = user_id`):
  - `cloud_projects` — mirrors `FarmProject` fields as JSONB payload + `user_id`, `project_id`, `updated_at`.
  - `cloud_records` — mirrors `FarmRecord` as JSONB payload + `user_id`, `record_id`, `project_id`, `updated_at`.
  - `cloud_backups` — metadata row per backup (timestamp, counts).
- Standard grants: `authenticated` full CRUD on own rows; `service_role` ALL; no `anon` access.

**Frontend**
- New file `src/lib/cloudBackup.ts`:
  - `signInAnon()`, `signInWithId(id)` (restores session via stored refresh token in localStorage; if not present, treat the ID as a lookup key — see note below), `signOutCloud()`, `getCloudId()`.
  - `backupToCloud()` — reads active projects/records from IndexedDB, upserts into `cloud_projects` / `cloud_records` keyed by local IDs.
  - `restoreFromCloud()` — fetches all cloud rows for the user, runs through existing `generateRecordFingerprint` from `src/lib/fileSync.ts` and `importProject` / `importRecord` from `src/lib/db.ts` to merge without duplicates (reuses the same conflict logic as Bluetooth/file sync).
- New page `src/pages/CloudBackup.tsx` with the UX above, using existing shadcn `Card`, `Button`, `Dialog`, `Input` components and design tokens.
- Add `/cloud` route in `src/App.tsx`.
- Add a **Cloud Backup** nav entry in `src/components/Header.tsx`.

**Identity portability note**
Supabase anonymous users are tied to a refresh token, not retrievable by UUID alone. To make "paste your Cloud ID on another device" work, we will:
- On identity creation, generate a random `cloud_id` (UUID) **and** a short `recovery_secret`, store both in a `cloud_identities` table (RLS: owner-only after first claim).
- The user copies a single string `cloudId:recoverySecret`. On another device, pasting it calls an edge function `claim-cloud-identity` that verifies the secret and returns a session for the matching anonymous user.
- Internally this is invisible — UI just says "Cloud ID". Power users can still see/copy it.

**Out of scope**
- Auto background sync (manual only, per user choice).
- Backing up trash/deleted projects.
- Real-time multi-device sync (one device backs up, another restores).

### Files to create/edit

- create `src/pages/CloudBackup.tsx`
- create `src/lib/cloudBackup.ts`
- create `supabase/functions/claim-cloud-identity/index.ts`
- edit `src/App.tsx` (add route)
- edit `src/components/Header.tsx` (add nav link)
- migration: create `cloud_projects`, `cloud_records`, `cloud_backups`, `cloud_identities` with RLS + grants
