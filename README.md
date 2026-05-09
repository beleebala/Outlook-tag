# Outlook Tag

Outlook Tag is an Office Web Add-in for applying and managing Outlook category tags from a task pane. It targets New Outlook and Outlook on the web first, using Office.js category APIs rather than Microsoft Graph.

## Current Scope

- Apply existing Outlook categories to the selected email.
- Remove categories from the selected email.
- Create and delete master categories.
- Configure per-tag rules in Roaming Settings:
  - also apply other tags
  - remove conflicting tags
- Build one manifest for local development and GitHub Pages deployment by injecting `ASSET_URL`.

## Requirements

- Windows PowerShell or Windows Terminal for local Outlook development.
- Node.js 20 LTS or newer on Windows.
- Outlook client/account with Mailbox requirement set 1.8.
- `ReadWriteMailbox` manifest permission, already declared in `manifest.xml`.

Do not run the dev server from WSL2 for Outlook sideloading. Outlook on Windows must be able to reach `https://localhost:4000`.

## Install

```powershell
npm install
```

## Development

Generate and trust the local Office Add-in certificate once:

```powershell
npm run certs:generate
certutil -user -addstore "Root" "$env:USERPROFILE\.office-addin-dev-certs\ca.crt"
npm run certs:verify
```

If command-line certificate installation fails, import the generated CA certificate into **Current User > Trusted Root Certification Authorities**:

```powershell
certmgr.msc
```

Then start the dev server:

```powershell
$env:ASSET_URL='https://localhost:4000'
npm start
```

The dev server uses HTTPS on port 4000. Sideload `dist/manifest.xml` after webpack has generated it, or run a build first if the manifest is missing.

If Outlook opens a blank task pane, verify:

- `https://localhost:4000/taskpane.html` loads in the browser.
- The browser page may show an "open this add-in from Outlook" message. That is expected outside Outlook; it only confirms the local web server is reachable.
- `npm run certs:verify` says the localhost development certificate is trusted.
- The generated manifest points to `https://localhost:4000`.
- The Outlook client supports Mailbox requirement set 1.8.

## Build

```powershell
$env:ASSET_URL='https://beleebala.github.io/Outlook-tag'
npm run build
```

Production builds fail if `dist/manifest.xml` contains `localhost` or does not point to the GitHub Pages URL.

## Test

```powershell
npm test
npm run typecheck
```

## GitHub Pages Testing

GitHub Pages avoids local HTTPS certificate issues. The production URL is:

```text
https://beleebala.github.io/Outlook-tag/
```

The repository includes a GitHub Actions workflow at `.github/workflows/pages.yml`. After the workflow runs successfully, download or open the generated production manifest from the Pages site:

```text
https://beleebala.github.io/Outlook-tag/manifest.xml
```

For local generation of the same production manifest:

```powershell
$env:ASSET_URL='https://beleebala.github.io/Outlook-tag'
npm run build
```

Then sideload:

```text
dist\manifest.xml
```

In GitHub repository settings, set **Pages > Build and deployment > Source** to **GitHub Actions**.

## Deploy

Preferred deploy path is the GitHub Actions workflow. The legacy manual deploy script is also available:

```powershell
$env:ASSET_URL='https://beleebala.github.io/Outlook-tag'
npm run deploy
```

`npm run deploy` builds the app and publishes `dist` to the `gh-pages` branch through the `gh-pages` package. Use either the Actions workflow or the `gh-pages` branch method, not both at the same time.

## Architecture

```text
manifest.xml
src/shared/officeApi.ts      Office.js promise wrappers only
src/shared/rules.ts          deterministic tag rule planning
src/shared/tagActions.ts     apply selected tag plus v1 rule actions
src/taskpane/components/     React task pane views
```

Presentation components should not call Office.js directly. Add Office integration to `src/shared/officeApi.ts`, then call it from the app shell or an action module.

## Manual Verification

1. Deploy to GitHub Pages or run `npm run build` with the production `ASSET_URL`.
2. Sideload the generated production manifest in Outlook.
3. Select an email and open the "Tag Email" task pane.
4. Apply an existing tag and confirm it appears on the message.
5. Remove a tag chip and confirm it is removed from the message.
6. Create a tag in Tag Manager and confirm it appears in autocomplete.
7. Configure also-apply and remove-conflicting rules, then apply the trigger tag.
8. Delete a tag and verify the warning is shown before deletion.
9. Close and reopen the task pane and verify rules reload.
10. Change selected email while the pane is open and use Refresh before mutating tags.
