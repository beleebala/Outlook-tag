# Outlook Tag Add-in — Design Spec

**Date:** 2026-05-09
**Status:** Approved — ready for implementation

---

## Context

SimplyTag is the leading Outlook tagging tool, but it only works on classic Outlook for Windows (VSTO technology). It explicitly does not support New Outlook (the modern desktop app) or Outlook on the web. This add-in fills that gap: a tag management plugin built on the Office Web Add-ins platform, giving it cross-platform reach that SimplyTag cannot match.

---

## Decisions

| | |
|---|---|
| Platform | Office Web Add-in (Office.js + React + Fluent UI v9) |
| Scaffold | Yeoman (`yo office`) |
| Tag storage | Outlook built-in categories (Office.js categories API) |
| Action rules storage | Office.js Roaming Settings (syncs via Exchange/M365) |
| Distribution | Sideloading via `manifest.xml` |
| Hosting | GitHub Pages (`beleebala.github.io/Outlook-tag`) |
| Target | Personal / internal team use |
| Dev environment | Windows PowerShell (not WSL2 — see Dev Environment section) |

---

## Platform Compatibility

| Platform | Supported |
|---|---|
| New Outlook for Windows (desktop app) | ✓ |
| Outlook on the web (browser) | ✓ |
| Classic Outlook for Windows (Office 2021 / M365) | ✓ |
| Outlook for Mac | ✓ |

**Account types:** Designed for both Microsoft 365 (work/school) and personal Outlook.com accounts. The categories API (Mailbox requirement set 1.8) is supported on both. Sideloading works on both via Outlook Settings → Add-ins → My add-ins → Custom add-ins.

---

## Dev Environment

**All development must be done in Windows PowerShell (or Windows Terminal), not WSL2.**

The Yeoman dev server runs on `localhost:3000`. Outlook runs on Windows. If the dev server is started inside WSL2, Windows and Outlook see a different `localhost` and cannot reach the add-in. Running everything natively on Windows avoids this entirely.

Node.js, npm, and Yeoman must be installed on the Windows side, not inside WSL2.

---

## Architecture

```
New Outlook
└── Ribbon button: "Tag Email"
    └── Task Pane  (React web app, served from GitHub Pages)
        ├── View A: Tag an Email
        │   ├── Reads existing tags on selected email (on open)
        │   ├── Displays tags as removable chips
        │   ├── Autocomplete input to apply existing tags
        │   └── [Manage Tags] → View B
        ├── View B: Tag Manager
        │   ├── Lists all Outlook categories
        │   ├── Create / delete tags  (no rename — see Tag Naming below)
        │   └── [Edit] per tag → View C
        └── View C: Edit Tag
            ├── Color only (name is read-only after creation)
            └── Actions: also-apply · remove-conflicting
                │
                ▼  stored in Office.js Roaming Settings (syncs via Exchange/M365)
                │
                ▼  executed immediately when tag is applied to an email

    officeApi.ts  (wraps all Office.js calls — no Graph API in v1)
```

---

## File Structure

```
Outlook-tag/
├── manifest.xml              ← one manifest; URL injected at build time via env var
├── src/
│   └── taskpane/
│       ├── taskpane.html     ← entry HTML
│       ├── taskpane.tsx      ← React entry point
│       └── components/
│           ├── App.tsx           ← root; manages which view is shown
│           ├── TagList.tsx       ← chips of current email's tags
│           ├── TagInput.tsx      ← autocomplete input to apply tags
│           ├── TagManager.tsx    ← list all tags; create / delete
│           └── EditTag.tsx       ← per-tag color + action rules
├── src/shared/
│   └── officeApi.ts          ← all Office.js API calls in one place
├── webpack.config.js         ← injects ASSET_URL env var into manifest + HTML
└── package.json
```

`ASSET_URL=https://localhost:3000 npm start` for dev; `ASSET_URL=https://beleebala.github.io/Outlook-tag npm run build` for production. One manifest file, two URL values.

---

## Views

### View A — Tag an Email

Opens when the user clicks "Tag Email" in the Outlook ribbon with an email selected.

- Immediately reads existing categories on the email → displays as chips with × button
- Add tag: Fluent UI Combobox with autocomplete filtering against all mailbox categories
  - Only applies **existing** categories; does not create new tags inline
  - New tags must be created via Tag Manager (View B)
- Chip × → removes that category from the email
- `[Manage Tags]` → navigate to View B
- Error state: "Select an email to get started" if no email is selected

### View B — Tag Manager

- Lists all Outlook categories (name + color swatch)
- `[Edit]` per tag → View C (color change + action rules only)
- `[🗑]` per tag → confirmation dialog then delete
- `[+ New Tag]` → inline form: name input + color picker (Outlook's 25 standard colors)
- `[←]` → back to View A

### View C — Edit Tag

- **Name: read-only** (displayed but not editable — see Tag Naming below)
- Color picker (Outlook's 25 standard colors)
- **Actions** (run automatically when this tag is applied to an email):
  - ☐ Also apply tags — multi-select from existing tags
  - ☐ Remove conflicting tags — multi-select from existing tags
- `[Save]` → write rules to Roaming Settings; update Outlook category color if changed
- `[Cancel]` → discard changes
- `[←]` → back to View B

---

## Tag Naming — Why Names Are Read-Only After Creation

Outlook stores category names as plain strings on each email. If you rename a master category, previously tagged emails keep the old string — they become orphaned (the category color disappears and Outlook shows it as an unknown category). Rather than build a migration that touches potentially hundreds of emails, names are locked after creation. To rename: delete the old tag and create a new one with the desired name.

---

## v2 Scope (not in this build)

**Move email to folder** requires calling Microsoft Graph (`POST /me/messages/{id}/move`), which needs an Azure app registration, OAuth 2.0 consent, and `Mail.ReadWrite` Graph permission. This is a distinct sub-project and is deferred to v2.

---

## Action Execution Flow

When the user applies a tag to an email:

1. `addMailCategory(name)` — applies the Outlook category to the email
2. Read that tag's rules from Roaming Settings
3. Execute each configured action:
   - **Also apply:** `addMailCategory(name)` for each additional tag
   - **Remove conflicting:** `removeMailCategory(name)` for each

---

## Data Model — Roaming Settings

```json
{
  "tagRules": {
    "Finance": {
      "alsoApply": ["Q3", "Accounting"],
      "removeConflicting": ["Personal"]
    },
    "Urgent": {
      "alsoApply": [],
      "removeConflicting": []
    }
  }
}
```

---

## officeApi.ts — Public Functions

| Function | Purpose |
|---|---|
| `getMailCategories()` | Tags currently on the selected email |
| `addMailCategory(name)` | Apply a category to the selected email |
| `removeMailCategory(name)` | Remove a category from the selected email |
| `getAllCategories()` | All categories defined in the mailbox |
| `createCategory(name, color)` | Create a new Outlook category |
| `deleteCategory(name)` | Delete an Outlook category |
| `getRoamingSettings()` | Read tag action rules |
| `saveRoamingSettings(data)` | Write tag action rules |

---

## Hosting & Deployment

- **One manifest:** `manifest.xml` with `ASSET_URL` injected at build time
- **Dev:** In Windows PowerShell — `npm start` → HTTPS on `localhost:3000`; sideload `manifest.xml` (pointing to localhost) via Outlook Settings → Add-ins → My add-ins → Custom add-ins → upload file
- **Production:** `npm run build && npm run deploy` → pushes `/dist` to `gh-pages` branch → served at `https://beleebala.github.io/Outlook-tag/`
- GitHub Pages provides HTTPS automatically (required by all Office add-ins)

---

## Error Handling

| Scenario | Behavior |
|---|---|
| No email selected | "Select an email to get started" message |
| Office.js API error | Toast error + Retry button |
| Category already applied | Silent no-op (Office.js handles idempotently) |

---

## Verification Steps

1. In Windows PowerShell: `npm start` → sideload manifest in Outlook web (outlook.com or outlook.office.com)
2. Select an email → click "Tag Email" → task pane opens with existing tags already displayed
3. Apply a tag from the autocomplete → chip appears; verify tag visible in Outlook's category column
4. Remove a chip → category removed from the email
5. Open Tag Manager → create a new tag → verify it appears in the autocomplete
6. Edit a tag → set "Also apply" → apply that tag to an email → confirm second tag is applied automatically
7. Edit a tag → set "Remove conflicting" → apply tag → confirm the conflicting tag is removed
8. `npm run build && npm run deploy` → sideload the production manifest → test at the GitHub Pages URL in Outlook
