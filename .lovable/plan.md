# Farm Insights History

## What to build
- Add a History control to Farm Insights so users can browse and reopen earlier questions and answers.
- Store completed insight exchanges online, scoped to the same device identity AgroTensor AI already uses.
- Keep only the most recently generated or opened insight in a dedicated local cache; discard it after 48 hours.
- Reuse the existing rich answer renderer so saved tables and charts display correctly, including when reopened offline from cache.

## Technical approach
- Add a dedicated history table with device identity, project reference/title, question, answer, and creation time. Deny direct client access; access it only through the existing Farm Insights edge function, which validates and scopes the device ID.
- Extend the edge function with list/read operations and save only successfully completed AI responses without changing the streaming response format.
- Add a small client helper for online history and the single-entry, 48-hour local cache; use the existing `getDeviceId()` identity.
- Do not add profile fields, sign-in screens, farm-record schema changes, or store full project snapshots.

## Verification
- Test that cache entries expire at 48 hours, only one latest entry is retained, and entries are isolated by device ID.
- Verify generation saves to online history, History can reopen a saved answer, rich charts/tables render, and the valid cache remains accessible offline.
- Run project type/build checks and inspect the current build diagnostics.