# Add an offline task board

## What to build
- Add a Kanban-style Tasks page with To do, In progress, and Done lanes; task creation/editing with due date, priority, and optional notes; simple search/filtering; and clear overdue/due-soon indicators.
- Keep tasks saved on the device and available offline, separate from farm records.
- Add a task shortcut immediately to the right of the menu/sidebar icon in the app’s top ribbon, and register `/tasks` inside the existing app shell.
- Match existing AgroTensor theme tokens and controls; show all lanes on wide screens and a focused lane on narrow screens.

## Technical details
- Use the existing local-storage hook for this small, device-local feature rather than changing the farm-record database schema.
- Use existing React Router, shadcn UI controls, and semantic theme classes; add no backend or new dependencies.
