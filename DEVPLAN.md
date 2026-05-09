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
- Added quick tag buttons for suggested tags and available mailbox categories.
- Added sender/subject-based suggested quick tags.
- Added selected-item change handling so the pane refreshes when Outlook exposes `ItemChanged`.
- Added refresh ordering protection so stale Outlook responses cannot overwrite newer selected-email state.
- Avoided no-op Roaming Settings saves during selected-email refreshes.
- Added component tests for suggested, all-tags, and applied quick tag states.
- Added component tests for tag manager and tag rule editing behavior.
- Added App-level tests for loading mocked Outlook data, applying a suggested tag, and opening Tag Manager.
- Added compact counts to quick tag group headings.
- Simplified quick tag groups to Suggested and All Tags.
- De-duplicated quick tag groups so suggested and all-tag rows do not repeat the same tag.
- Hid already-applied tags from quick tag groups so users only see actionable apply options.
- Added first-pass tests for deterministic rules and manifest validation.
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
3. Add manual QA screenshots for the hosted task pane after the next deploy.
4. Replace SVG placeholder icons with PNG assets if any Outlook client rejects SVG icon URLs.
5. Manually verify the startup error inside Outlook versus a direct browser load.
6. Verify Outlook WebView trusts the generated Office Add-in dev certificate on the development machine.

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
