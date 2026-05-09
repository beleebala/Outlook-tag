# Development Plan

## Completed

- Scaffolded the Office Web Add-in project structure.
- Added a single manifest with `ASSET_URL` replacement.
- Added an Outlook ribbon button named `Open Tag Panel` for launching the task pane.
- Updated the GitHub Pages workflow and direct dependency set to current stable versions.
- Updated TypeScript configuration for the latest compiler line.
- Added ambient type declarations required by the updated toolchain.
- Set a project-specific webpack bundle budget for the Fluent UI task pane.
- Implemented React task pane views:
  - Tag Email
  - Tag Manager
  - Tag Rules
- Isolated Office.js APIs in `src/shared/officeApi.ts`.
- Added rule planning and application logic.
- Added quick tag buttons with favorite and recent tag persistence.
- Added first-pass tests for deterministic rules and manifest validation.
- Added preference tests for favorite and recent tag normalization.
- Added `DESIGN.md` as the source of truth for task-pane UI decisions.

## Next Engineering Tasks

1. Install dependencies and run the full check suite on Windows:
   - `npm install`
   - `npm run certs:generate`
   - `certutil -user -addstore "Root" "$env:USERPROFILE\.office-addin-dev-certs\ca.crt"`
   - `npm run certs:verify`
   - `npm test`
   - `npm run typecheck`
   - `$env:ASSET_URL='https://localhost:4000'; npm start`
2. Verify the exact Office.js category API signatures against the generated TypeScript types after install.
3. Add selected-item change handling with `Office.EventType.ItemChanged` where supported; until then, Refresh is exposed before mutations.
4. Add sender/subject-based suggested tags after quick tags are manually verified.
5. Add component tests for the create/delete/rules/favorites UI states after the first build passes.
6. Replace SVG placeholder icons with PNG assets if any Outlook client rejects SVG icon URLs.
7. Manually verify the startup error inside Outlook versus a direct browser load.
8. Verify Outlook WebView trusts the generated Office Add-in dev certificate on the development machine.

## GitHub Pages Path

Use this path when local HTTPS certificate trust blocks Outlook WebView:

1. Commit and push the scaffold to `main`.
2. In GitHub repository settings, set **Pages > Build and deployment > Source** to **GitHub Actions**.
3. Run the `Deploy GitHub Pages` workflow, or push to `main`.
4. Confirm `https://beleebala.github.io/Outlook-tag/taskpane.html` and `https://beleebala.github.io/Outlook-tag/manifest.xml` load.
5. Sideload the production manifest in Outlook.
6. Run the manual verification matrix against the hosted URL.

## Compatibility Spike

Run the v1 spike before claiming platform support:

- Outlook.com on the web.
- Microsoft 365 Outlook on the web.
- New Outlook for Windows.
- Classic Outlook for Windows.
- Outlook for Mac.

For each client/account:

- Confirm `Office.context.requirements.isSetSupported("Mailbox", "1.8")`.
- Read selected email categories.
- Apply and remove selected email categories.
- Create and delete master categories.
- Save and reload Roaming Settings rules.
- Validate shared/delegate mailbox behavior.

## Known Constraints

- No Microsoft Graph in v1.
- No category rename in v1.
- No category color update in v1.
- No mailbox-wide cleanup after category deletion.
- Rules are keyed by display name because Outlook categories do not expose a stable custom ID.
