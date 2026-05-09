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

---

## Platform Compatibility

Works on all of:

| Platform | Supported |
|---|---|
| New Outlook for Windows (desktop app) | ✓ |
| Outlook on the web (browser) | ✓ |
| Classic Outlook for Windows (Office 2021 / M365) | ✓ |
| Outlook for Mac | ✓ |

**Requirement:** Microsoft 365 or Exchange account — needed for the categories sync API (Mailbox requirement set 1.8).

---

## Architecture

```
New Outlook
└── Ribbon button: "Tag Email"
    └── Task Pane  (React web app, served from GitHub Pages)
        ├── View A: Tag an Email
        │   ├── Reads existing tags on selected email (on open)
        │   ├── Displays tags as removable chips
        │   ├── Autocomplete input to add existing tags
        │   └── [Manage Tags] → View B
        ├── View B: Tag Manager
        │   ├── Lists all Outlook categories
        │   ├── Create / delete tags
        │   └── [Edit] per tag → View C
        └── View C: Edit Tag
            ├── Name + color
            └── Actions: move-to-folder · also-apply · remove-conflicting · do-not-auto-apply flag
                │
                ▼  stored in Office.js Roaming Settings (syncs via Exchange)
                │
                ▼  executed immediately when tag is applied to an email

    officeApi.ts  (wraps all Office.js calls)
```

---

## File Structure

```
Outlook-tag/
├── manifest.xml              ← production (GitHub Pages URL)
├── manifest.dev.xml          ← development (localhost:3000)
├── src/
│   └── taskpane/
│       ├── taskpane.html     ← entry HTML
│       ├── taskpane.tsx      ← React entry point
│       └── components/
│           ├── App.tsx           ← root; manages which view is shown
│           ├── TagList.tsx       ← chips of current email's tags
│           ├── TagInput.tsx      ← autocomplete input to apply tags
│           ├── TagManager.tsx    ← list all tags; create / delete
│           └── EditTag.tsx       ← per-tag name, color, action rules
├── src/shared/
│   └── officeApi.ts          ← all Office.js API calls in one place
├── webpack.config.js
└── package.json
```

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
- `[Edit]` per tag → View C
- `[🗑]` per tag → confirmation dialog then delete
- `[+ New Tag]` → inline form: name input + color picker (Outlook's 25 standard colors)
- `[←]` → back to View A

### View C — Edit Tag

- Name field (pre-filled)
- Color picker (pre-filled, Outlook's 25 standard colors)
- **Actions** (run automatically when this tag is applied to an email):
  - ☐ Move email to folder — folder dropdown populated from the user's mailbox
  - ☐ Also apply tags — multi-select from existing tags
  - ☐ Remove conflicting tags — multi-select from existing tags
  - ☐ Do not auto-apply to incoming email *(stores flag for future auto-tagging feature; no effect in v1)*
- `[Save]` → write rules to Roaming Settings; update Outlook category if name/color changed
- `[Cancel]` → discard changes
- `[←]` → back to View B

---

## Action Execution Flow

When the user applies a tag to an email:

1. `addMailCategory(name)` — applies the Outlook category to the email
2. Read that tag's action rules from Roaming Settings
3. Execute each configured action:
   - **Move:** `moveEmailToFolder(folderId)`
   - **Also apply:** `addMailCategory(name)` for each additional tag
   - **Remove conflicting:** `removeMailCategory(name)` for each

---

## Data Model — Roaming Settings

```json
{
  "tagRules": {
    "Finance": {
      "moveToFolderId": "AAMkAGI2...",
      "alsoApply": ["Q3", "Accounting"],
      "removeConflicting": ["Personal"],
      "doNotAutoApply": false
    },
    "Urgent": {
      "moveToFolderId": null,
      "alsoApply": [],
      "removeConflicting": [],
      "doNotAutoApply": false
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
| `getMailFolders()` | All folders in the mailbox (for move action) |
| `moveEmailToFolder(folderId)` | Move selected email to a folder |
| `getRoamingSettings()` | Read tag action rules |
| `saveRoamingSettings(data)` | Write tag action rules |

---

## Hosting & Deployment

- **Two manifests:** `manifest.xml` (prod → GitHub Pages) and `manifest.dev.xml` (dev → localhost:3000)
- **Dev:** `npm start` → HTTPS on `localhost:3000`; sideload `manifest.dev.xml` via Outlook Settings → Add-ins → Custom add-ins
- **Production:** `npm run build && npm run deploy` → pushes `/dist` to `gh-pages` branch → served at `https://beleebala.github.io/Outlook-tag/`
- GitHub Pages provides HTTPS automatically (required by Office add-ins)

---

## Error Handling

| Scenario | Behavior |
|---|---|
| No email selected | "Select an email to get started" message |
| Office.js API error | Toast error + Retry button |
| Move-to-folder: folder not found | Inline warning in Edit Tag view |
| Category already applied | Silent no-op (Office.js handles idempotently) |

---

## Verification Steps

1. `npm start` → sideload `manifest.dev.xml` in Outlook web
2. Select an email → click "Tag Email" → task pane opens with existing tags already displayed
3. Apply a tag from the autocomplete → chip appears; verify tag visible in Outlook's category column
4. Remove a chip → category removed from the email
5. Open Tag Manager → create a new tag → verify it appears in the autocomplete
6. Edit a tag → set "Move to folder" action → apply that tag → confirm email moved to the correct folder
7. Edit a tag → set "Also apply" → apply tag → confirm second tag is applied automatically
8. `npm run build && npm run deploy` → test at the production GitHub Pages URL in Outlook
