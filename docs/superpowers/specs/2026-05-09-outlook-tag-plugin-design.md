# Outlook Tag Add-in — Design Spec

**Date:** 2026-05-09
**Status:** Approved with constraints — ready for implementation after scaffold

---

## Context

SimplyTag is the leading Outlook tagging tool, but it only works on classic Outlook for Windows (VSTO technology). It explicitly does not support New Outlook (the modern desktop app) or Outlook on the web. This add-in fills that gap: a tag management plugin built on the Office Web Add-ins platform, giving it cross-platform reach that SimplyTag cannot match.

SimplyTag's public help site should be used as the reference catalog for long-term feature ideas and interaction patterns: https://www.techhit.com/SimplyTag/help/?s=help. This project is not trying to clone SimplyTag feature-for-feature in v1; the page is a backlog input for deciding which capabilities are worth adapting within Office Web Add-in constraints.

---

## Decisions

| | |
|---|---|
| Platform | Office Web Add-in (Office.js + React + Fluent UI v9) |
| Scaffold | Yeoman (`yo office`) |
| Tag storage | Outlook built-in categories (Office.js categories API) |
| Action rules storage | Office.js Roaming Settings (per add-in/per user; reload caveats apply) |
| Distribution | Sideloading via `manifest.xml` |
| Hosting | GitHub Pages (`beleebala.github.io/Outlook-tag`) |
| Target | Personal / internal team use |
| Dev environment | Windows PowerShell (not WSL2 — see Dev Environment section) |

**Manifest permissions:** The add-in must request mailbox read/write permissions because managing the master category list requires them.

- Add-in only manifest: `<Permissions>ReadWriteMailbox</Permissions>`
- Unified manifest: resource-specific permission `Mailbox.ReadWrite.User`

---

## Platform Compatibility

| Platform | Targeted for v1 |
|---|---|
| New Outlook for Windows (desktop app) | Verify before UI build |
| Outlook on the web (browser) | Verify before UI build |
| Classic Outlook for Windows (Office 2021 / M365) | Verify before claiming support |
| Outlook for Mac | Verify before claiming support |

**Account types:** Designed for both Microsoft 365 (work/school) and personal Outlook.com accounts. The categories API requires Mailbox requirement set 1.8. Sideloading should be tested separately on Outlook.com and Microsoft 365 because add-in availability and admin policy can differ by tenant/account.

Before implementing the UI, run a compatibility spike on each target client/account:

- Verify `Office.context.requirements.isSetSupported("Mailbox", "1.8")`.
- Verify list/apply/remove categories on a selected message.
- Verify create/delete master categories.
- Verify behavior in shared/delegate mailbox scenarios; Microsoft documents that delegates can read master categories but cannot add or remove them.
- If any client fails the spike, downgrade that platform from "targeted" to "known limitation" until a fallback exists.

---

## Dev Environment

**All development must be done in Windows PowerShell (or Windows Terminal), not WSL2.**

The dev server runs on `localhost:4000`. Outlook runs on Windows. If the dev server is started inside WSL2, Windows and Outlook see a different `localhost` and cannot reach the add-in. Running everything natively on Windows avoids this entirely.

Node.js, npm, and Yeoman must be installed on the Windows side, not inside WSL2.

### Fresh Clone Setup

Document the exact scaffold choices after `yo office` is run. Expected setup:

```powershell
node --version   # Node.js LTS on Windows, not WSL2
npm --version
npm install -g yo generator-office
yo office
npm install
$env:ASSET_URL='https://localhost:4000'
npm start
```

The scaffold must document the selected generator options, including project type, framework, script type, Outlook host, and task pane add-in shape. If the HTTPS localhost certificate is not trusted and Outlook shows a blank task pane or refuses `https://localhost:4000`, fix certificate trust before debugging application code.

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
        │   ├── Create / delete tags  (no rename; delete has orphaning risk)
        │   └── [Edit] per tag → View C
        └── View C: Edit Tag
            ├── Name and color are read-only after creation
            └── Actions: also-apply · remove-conflicting
                │
                ▼  stored in Office.js Roaming Settings
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

PowerShell examples:

```powershell
$env:ASSET_URL='https://localhost:4000'; npm start
$env:ASSET_URL='https://beleebala.github.io/Outlook-tag'; npm run build
```

One manifest file, two URL values.

---

## Views

### View A — Tag an Email

Opens when the user clicks "Tag Email" in the Outlook ribbon with an email selected.

- Immediately reads existing categories on the email → displays as chips with × button
- Focus starts in the tag combobox so the default path is keyboard-first.
- Add tag: Fluent UI Combobox with autocomplete filtering against all mailbox categories
  - Only applies **existing** categories; does not create new tags inline
  - New tags must be created via Tag Manager (View B)
  - Enter applies the highlighted match, clears the input, keeps focus in the input, and updates chips immediately.
  - Escape clears the current query; a second Escape returns focus to the task pane shell.
- Chip × → removes that category from the email
- `[Manage Tags]` → navigate to View B
- Error state: "Select an email to get started" if no email is selected
- If the task pane stays open while the selected email changes, reload the selected item's categories before any mutation. Prefer listening for item changes; if that is unreliable in a client, require manual refresh and disable mutations while stale.
- When action rules add or remove tags, show a compact inline status such as "Applied Finance, added Q3, removed Personal."

### View B — Tag Manager

- Lists all Outlook categories (name + color swatch)
- Search/filter at the top; sort alphabetically by default and show the total count.
- `[Edit]` per tag → View C (action rules only; name/color read-only)
- `[🗑]` per tag → confirmation dialog then delete
- `[+ New Tag]` → inline form: name input + color picker (Outlook's 25 standard colors)
- `[←]` → back to View A
- Empty state: "No tags yet" with a primary "New Tag" action.
- Create validation: trim whitespace, block empty names, block duplicate names, disable submit while saving, keep input values on API failure, and show duplicate feedback inline.
- Delete confirmation must include the tag name, explain that existing emails keep the text label but lose master category/color behavior, default focus to Cancel, and style Delete as destructive.

### View C — Edit Tag

- **Name: read-only** (displayed but not editable — see Tag Naming below)
- **Color: read-only** in v1. Office.js exposes add/get/remove for master categories, but no direct update operation for category color.
- Screen title should be "Tag Rules" or "`<tag name>` Rules" so the read-only name/color do not feel like broken edit controls.
- **Actions** (run automatically when this tag is applied to an email):
  - ☐ Also apply tags — multi-select from existing tags
  - ☐ Remove conflicting tags — multi-select from existing tags
- `[Save]` → write rules to Roaming Settings
- `[Cancel]` → discard changes
- `[←]` → back to View B

### Accessibility and Narrow Pane Rules

- All actions must be keyboard reachable.
- Icon-only buttons must have accessible names.
- Chip removal must announce the removed tag to assistive technology.
- Color swatches must include text labels; color alone cannot identify a tag.
- Chips wrap; long tag names truncate with a tooltip.
- The task pane uses a sticky view header and scrollable content area for narrow or short panes.

---

## Tag Naming & Deletion

Outlook stores category names as plain strings on each email. If you rename a master category, previously tagged emails keep the old string — they become orphaned (the category color disappears and Outlook shows it as an unknown category). Rather than build a migration that touches potentially hundreds of emails, names are locked after creation. To rename: delete the old tag and create a new one with the desired name.

Deleting a tag has similar orphaning risk for previously tagged emails. The UI must show a confirmation explaining that deleting a master category does not migrate existing emails. v1 does not attempt mailbox-wide cleanup.

Color is also locked after creation in v1 because Office.js does not provide a direct master category update API. A future version could simulate color changes by delete/recreate, but that should be treated as a migration feature with the same orphaning risk.

---

## v2 Scope (not in this build)

**Move email to folder** requires calling Microsoft Graph (`POST /me/messages/{id}/move`), which needs an Azure app registration, OAuth 2.0 consent, and `Mail.ReadWrite` Graph permission. This is a distinct sub-project and is deferred to v2.

Other SimplyTag-inspired capabilities to evaluate after v1:

- **QuickTag keyboard flow:** fast type-ahead tagging for users with many categories.
- **One-click suggestions:** suggested categories based on prior choices, sender, recipients, subject, or message context.
- **Auto-tag incoming mail:** automatically apply categories to new messages based on learned/manual rules.
- **Sent-message tagging:** prompt to tag sent mail and optionally copy tags from the original message on reply/forward.
- **Tag actions:** move-to-folder, mark-as-read, also-apply tags, and remove-conflicting tags.
- **Copy/paste categories:** copy categories from one message to another.
- **Tag sender/thread:** apply a category to messages from a sender or conversation thread.
- **Bulk category management:** create, delete, import, and export category sets and action rules.
- **Team sharing:** shared mailbox or import/export flows for common team category lists.
- **Tag-based search:** search by category with AND/OR combinations.
- **Configurable UI and hotkeys:** expose only the commands users need and optimize for keyboard operation.

Each item must be checked against Office.js and Graph API availability before implementation. Features that require mailbox-wide access, background processing, send hooks, or folder moves should be treated as separate design efforts.

---

## Action Execution Flow

When the user applies a tag to an email:

1. `addMailCategory(name)` — applies the Outlook category to the email
2. Read that tag's rules from Roaming Settings
3. Execute each configured action:
   - **Also apply:** `addMailCategory(name)` for each additional tag
   - **Remove conflicting:** `removeMailCategory(name)` for each

Rule execution semantics:

- Execute only the rules attached to the user-applied trigger tag; v1 does not cascade rules from tags added by rules.
- De-duplicate operations before calling Office.js.
- If the same category appears in `alsoApply` and `removeConflicting`, `removeConflicting` wins unless it is the trigger tag.
- Never remove the trigger tag in v1, even if it appears in `removeConflicting`.
- Re-read current item categories before applying mutations if the selected item may have changed.
- Treat "already applied" and "not currently applied" as no-op only after verifying the current category list or handling a known Office.js error code.

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

Roaming Settings constraints:

- Settings are per add-in and per user.
- The storage limit is 32KB per add-in.
- Values are loaded when the add-in initializes; cross-client changes may require closing/reopening the task pane, refreshing the browser, or restarting the Outlook client.
- Do not store secrets or access tokens in Roaming Settings.
- Rules are keyed by category display name in v1 because Outlook categories do not expose a stable custom ID. On category list load, prune or flag orphaned rules whose category names no longer exist in the master list.

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

No `updateCategoryColor()` function is planned for v1 because Office.js does not expose direct color updates for existing master categories.

`officeApi.ts` must wrap Office.js callback APIs into promise-based functions and normalize error results. Presentation components must not call Office.js directly.

---

## Hosting & Deployment

- **One manifest:** `manifest.xml` with `ASSET_URL` injected at build time
- **Dev:** In Windows PowerShell — `$env:ASSET_URL='https://localhost:4000'; npm start` → HTTPS on `localhost:4000`; sideload `manifest.xml` (pointing to localhost) via Outlook Settings → Add-ins → My add-ins → Custom add-ins → upload file
- **Production:** `$env:ASSET_URL='https://beleebala.github.io/Outlook-tag'; npm run build; npm run deploy` → pushes `/dist` to `gh-pages` branch → served at `https://beleebala.github.io/Outlook-tag/`
- GitHub Pages provides HTTPS automatically (required by all Office add-ins)

Build/deploy guardrails:

- The scaffold must document how `ASSET_URL` is injected into `manifest.xml` and task pane HTML; Yeoman does not provide this behavior automatically.
- Production builds must fail if the generated manifest contains `localhost`.
- Dev builds must fail if the generated manifest does not use HTTPS localhost.
- GitHub Pages setup must be documented: `gh-pages` package/script, Pages source, trailing slash base URL, and verification that manifest asset URLs point to `https://beleebala.github.io/Outlook-tag/`.

---

## Error Handling

| Scenario | Behavior |
|---|---|
| No email selected | "Select an email to get started" message |
| Unsupported Mailbox requirement set | Blocking error: "This Outlook client does not support Mailbox requirement set 1.8 categories APIs." |
| Office.js API error | Toast error + Retry button |
| Category already applied | No-op only after current categories or known error code confirm it |
| Invalid category | Inline error explaining the tag may have been deleted outside the add-in |
| Delegate/shared mailbox cannot edit master categories | Read-only Tag Manager state with explanation |
| Missing mailbox permissions | Blocking error explaining manifest permission requirement |
| Roaming Settings size exceeded | Toast error explaining rule storage limit |
| Delete category selected | Confirmation warning about orphaned category strings |

Developer diagnostics should log problem, likely cause, and fix for `Office.onReady` not firing, no selected item, unsupported Mailbox 1.8, missing `ReadWriteMailbox`, `PermissionDenied`, failed category mutation, and failed Roaming Settings `saveAsync`.

---

## Security & Dependency Policy

The add-in runs with mailbox read/write permission, so hosted JavaScript integrity matters.

- Pin major dependency versions and use Node.js LTS.
- Enable Dependabot or equivalent npm dependency alerts after scaffolding.
- Avoid third-party runtime scripts in the task pane; load Office.js from Microsoft's hosted CDN.
- Re-run the compatibility and verification matrix after Office.js, React, Fluent UI, or webpack upgrades.

---

## Verification Steps

1. In Windows PowerShell: `npm start` → sideload manifest in Outlook web (outlook.com or outlook.office.com)
2. Select an email → click "Tag Email" → task pane opens with existing tags already displayed
3. Apply a tag from the autocomplete → chip appears; verify tag visible in Outlook's category column
4. Remove a chip → category removed from the email
5. Open Tag Manager → create a new tag → verify it appears in the autocomplete
6. Edit a tag → set "Also apply" → apply that tag to an email → confirm second tag is applied automatically
7. Edit a tag → set "Remove conflicting" → apply tag → confirm the conflicting tag is removed
8. Delete a tag → confirm warning appears → verify the category is removed from the master list
9. Close and reopen the task pane → verify saved rules reload from Roaming Settings
10. `$env:ASSET_URL='https://beleebala.github.io/Outlook-tag'; npm run build; npm run deploy` → sideload the production manifest → test at the GitHub Pages URL in Outlook
11. Change the selected email while the task pane is open → verify categories reload or mutations are blocked until refresh
12. Configure conflicting also-apply/remove-conflicting rules → verify deterministic precedence and inline status text
13. Run the compatibility spike across Outlook.com, Microsoft 365 Outlook on the web, New Outlook for Windows, classic Outlook, and Outlook for Mac before marking platforms supported

---

## /autoplan Review Report

### Plan Summary

The plan is a disciplined Office Web Add-in v1 for applying Outlook categories and simple tag action rules without Microsoft Graph. The review keeps that direction, but tightens v1 around the real wedge: fast, reliable tagging in New Outlook/web, with explicit platform verification before support claims.

### What Already Exists

| Sub-problem | Existing plan coverage | Review decision |
|---|---|---|
| Cross-platform Outlook surface | Office Web Add-in, Office.js, React, Fluent UI v9 | Keep |
| Tag storage | Outlook master categories and item categories | Keep, with Mailbox 1.8 startup gate |
| Rules storage | Roaming Settings | Keep for v1, add orphan cleanup and migration caution |
| Graph-dependent automation | Deferred to v2 | Keep deferred |
| UI structure | Three task pane views | Keep, but sharpen fast tagging, states, and accessibility |

### NOT In Scope

- Microsoft Graph move-to-folder actions: deferred to v2 because it requires Azure app registration, OAuth consent, and Graph `Mail.ReadWrite`.
- Mailbox-wide rename/delete cleanup: deferred because it can touch large message sets and belongs with a migration design.
- AI/category suggestions: deferred until v1 proves the manual fast tagging loop.
- Team shared rule sync: deferred because Roaming Settings are per-user/per-add-in.
- Marketplace/AppSource distribution: deferred; v1 remains personal/internal unless adoption goals change.

### CEO Review

0A Premise challenge:

- Office Web Add-in is the right platform for New Outlook/web reach. Accepted.
- Outlook categories are the right v1 storage primitive. Accepted.
- Roaming Settings are acceptable for v1 action rules. Accepted with migration caution.
- Avoiding Graph in v1 is pragmatic. Accepted.
- "Supported on all listed clients" was too strong. Changed to targeted and gated by spike.

0B Existing code leverage map: no app scaffold exists yet. The spec correctly centralizes future Office.js calls in `src/shared/officeApi.ts` and keeps presentation components free of direct Office.js calls.

0C Dream state:

```text
CURRENT: design spec only
  -> THIS PLAN: manual fast tagging + category manager + deterministic action rules
  -> 12-MONTH IDEAL: workflow-specific tagging assistant with search, suggestions, Graph-backed actions, import/export, and deployable team setup
```

0C-bis Alternatives:

| Approach | Effort | Risk | Decision |
|---|---:|---|---|
| Office.js-only category add-in | Medium | Limited automation | Accepted for v1 |
| Graph-backed tagging/actions product | High | OAuth/admin friction | Defer to v2 |
| Classic Outlook VSTO clone | High | Misses New Outlook/web gap | Reject |

0D Scope decisions: promoted keyboard-first fast tagging loop into v1; kept Graph, suggestions, mailbox-wide cleanup, and team sharing deferred.

0E Temporal interrogation:

- Hour 1: scaffold and manifest setup are the likely first blockers.
- Hour 6: Office.js category wrapper errors and selected-item lifecycle are the likely implementation risks.
- After first real use: speed and trust matter more than tag manager breadth.

CEO dual voice summary:

| Dimension | Subagent | Codex | Consensus |
|---|---|---|---|
| Premises valid? | Mostly, but compatibility spike needed | Unavailable | Single-model concern accepted |
| Right problem? | Narrow unless speed is central | Unavailable | Accepted |
| Scope calibration? | Promote one speed feature | Unavailable | Accepted |
| Alternatives explored? | Graph/product path should be explicit | Unavailable | Accepted |
| Competitive risk? | Microsoft/category improvements | Unavailable | Accepted |
| 6-month trajectory? | Risk of underwhelming CRUD tool | Unavailable | Accepted |

Codex outside voice was unavailable because the local CLI could not initialize without elevated access to Codex temp/app-server files. The escalation was rejected because it could disclose repository contents to an external service, so this review used subagent-only outside voices.

### Design Review

Initial design score: 6/10. Final planned design score after accepted fixes: 8/10.

| Pass | Score | Findings | Decision |
|---|---:|---|---|
| Information hierarchy | 8/10 | Edit screen felt like a broken edit form | Rename concept to Tag Rules |
| States | 8/10 | Loading, stale item, mutation states under-specified | Add loading/disabled/refresh behavior |
| Journey | 8/10 | Fast repeat tagging loop missing | Add keyboard-first loop |
| Specificity | 8/10 | Delete and create flows needed exact behavior | Add validation and destructive dialog requirements |
| Design system | 8/10 | Fluent UI helps, but a11y needed explicit rules | Add accessibility requirements |
| Responsive | 8/10 | Narrow task pane behavior missing | Add chip wrapping, truncation, sticky header |
| Decisions | 8/10 | Rule side effects were invisible | Add inline action status |

Design dual voice summary:

| Dimension | Subagent | Codex | Consensus |
|---|---|---|---|
| Information hierarchy | Needs stronger fast-tagging hierarchy | Unavailable | Accepted |
| Missing states | Loading/stale/mutation states missing | Unavailable | Accepted |
| User journey | Rule side effects need visibility | Unavailable | Accepted |
| Specific UI | Create/delete details under-specified | Unavailable | Accepted |
| Accessibility | Too implicit | Unavailable | Accepted |
| Responsive | Narrow pane rules needed | Unavailable | Accepted |

### Engineering Review

Architecture:

```text
App.tsx
  -> taskpane/components/*
      -> shared/officeApi.ts
          -> Office.context.mailbox.item.categories
          -> Office.context.mailbox.masterCategories
          -> Office.context.roamingSettings
```

Key engineering findings accepted:

- Add startup gate for Mailbox requirement set 1.8.
- Handle selected item changes or block stale mutations.
- Define deterministic rule semantics and avoid cascading in v1.
- Add shared/delegate mailbox read-only behavior for master category writes.
- Clean up orphaned Roaming Settings rules on category list load.
- Validate manifest URL injection so production never ships localhost.

Test diagram:

| Flow/codepath | Test type | Required coverage |
|---|---|---|
| Requirement-set startup gate | Unit + manual | Supported and unsupported clients |
| Read selected item categories | Unit wrapper + manual | Empty, null, API failure |
| Apply category | Unit wrapper + manual | Success, already applied, invalid category |
| Remove category | Unit wrapper + manual | Success, missing category, API failure |
| Create/delete master category | Unit wrapper + manual | Duplicate, permission denied, delegate/shared mailbox |
| Rule execution | Unit | De-dupe, add/remove conflict, no cascade, never remove trigger |
| Roaming Settings save/load | Unit | 32KB exceeded, failed `saveAsync`, stale/orphaned rule cleanup |
| Selected item change | Integration/manual | Reload or mutation block |
| Manifest URL injection | Build test | dev HTTPS localhost, prod GitHub Pages URL, no prod localhost |

Failure modes registry:

| Failure mode | User impact | Coverage required | Critical gap |
|---|---|---|---|
| Unsupported Mailbox 1.8 client | Add-in cannot manage categories | Startup gate + manual matrix | Yes until implemented |
| Stale selected item | Tags applied to wrong email | Item identity/reload test | Yes until implemented |
| Rule add/remove conflict | Surprise tag state | Rule precedence tests | No after semantics added |
| Shared mailbox write denied | Generic error in manager | PermissionDenied handling | No after read-only state added |
| Roaming Settings full | Rules fail to save | Save error test | No after error handling |
| Production manifest contains localhost | Broken deployed add-in | Build validation | Yes until implemented |

Parallelization strategy:

| Lane | Workstream | Modules | Depends on |
|---|---|---|---|
| A | Office.js wrapper and rule engine | `src/shared/` | scaffold |
| B | React task pane views | `src/taskpane/components/` | scaffold, API contracts |
| C | Manifest/build/deploy scripts | root config | scaffold |
| D | Tests | `src/**/__tests__` or test folders | A + C contracts |

Launch A and C in parallel after scaffolding. Build B against mocked API contracts. Add D once wrapper contracts stabilize.

### DX Review

Initial DX score: 5/10. Final planned DX score after accepted fixes: 8/10.

Developer journey map:

| Stage | Current friction | Fix accepted |
|---|---|---|
| Discover repo | CLAUDE/spec only | Keep spec as source of truth |
| Install tools | Node/Yeoman vague | Add fresh clone commands |
| Scaffold | Generator choices missing | Document choices after scaffold |
| Configure dev URL | `ASSET_URL` assumed | Document injection approach |
| Trust HTTPS | Cert issues missing | Add troubleshooting |
| Sideload | Client paths vary | Add client-specific notes after spike |
| First run | Commands aspirational | Define package script contract |
| Debug | Product errors only | Add developer diagnostics |
| Deploy | Pages prerequisites missing | Add Pages/deploy guardrails |

Developer empathy narrative: A first-time contributor wants to get from clone to task pane in under 10 minutes. Without exact generator choices, cert trust notes, and sideload variants, they can spend the first session debugging the Office host instead of the add-in.

DX scorecard:

| Dimension | Score |
|---|---:|
| Getting Started | 8/10 |
| API/Wrapper Design | 8/10 |
| Error Messages | 8/10 |
| Documentation | 8/10 |
| Upgrade Path | 7/10 |
| Dev Environment | 8/10 |
| Community/Support | 6/10 |
| DX Measurement | 7/10 |

TTHW target: under 10 minutes after scaffold exists; under 5 minutes after dependencies are installed.

DX implementation checklist:

- [ ] Fresh clone setup commands documented after scaffold.
- [ ] `ASSET_URL` injection implemented and validated.
- [ ] Sideloading notes split by Outlook client/account.
- [ ] HTTPS certificate troubleshooting documented.
- [ ] Developer diagnostic messages include problem, cause, and fix.
- [ ] GitHub Pages one-time setup documented.
- [ ] Dependency policy documented.

### Decision Audit Trail

| # | Phase | Decision | Classification | Principle | Rationale | Rejected |
|---|---|---|---|---|---|---|
| 1 | CEO | Keep Office.js-only v1 | Mechanical | Pragmatic | Validates the cross-platform category workflow without OAuth/admin friction | Graph-backed v1 |
| 2 | CEO | Promote keyboard-first tagging loop into v1 | Mechanical | Completeness | Speed is the product wedge; CRUD alone is underwhelming | Defer all speed features |
| 3 | CEO | Change platform support claims to targeted pending spike | Mechanical | Explicit over clever | Avoids overclaiming before Mailbox 1.8 behavior is verified | Claim full support now |
| 4 | Design | Add visible rule side-effect status | Mechanical | Completeness | Users need to understand why tags appeared or disappeared | Silent automatic side effects |
| 5 | Design | Rename edit screen concept to Tag Rules | Mechanical | Explicit over clever | The only editable data is rules, not tag identity | Keep generic Edit Tag framing |
| 6 | Design | Add narrow-pane and accessibility rules | Mechanical | Completeness | Outlook task panes are constrained and must be keyboard/screen-reader usable | Rely only on Fluent defaults |
| 7 | Eng | Add selected-item lifecycle handling | Mechanical | Completeness | Prevents applying tags to the wrong message | Read only on pane open |
| 8 | Eng | Define deterministic rule precedence | Mechanical | Explicit over clever | Removes hidden conflict/cascade behavior | Let implementation decide |
| 9 | Eng | Add build validation for manifest URLs | Mechanical | Pragmatic | Prevents shipping a localhost manifest | Manual inspection only |
| 10 | DX | Add fresh clone/setup and cert troubleshooting | Mechanical | Completeness | First-run Office add-in setup is a common blocker | Leave commands aspirational |

### Cross-Phase Themes

- Fast tagging loop: flagged by CEO and design. High-confidence signal.
- Compatibility verification: flagged by CEO, engineering, and DX. High-confidence signal.
- Hidden Office.js lifecycle/error behavior: flagged by engineering and DX. High-confidence signal.
- Rule side-effect trust: flagged by design and engineering. High-confidence signal.

### GSTACK REVIEW REPORT

| Review | Trigger | Why | Runs | Status | Findings |
|---|---|---|---:|---|---|
| CEO Review | `/autoplan` | Scope & strategy | 1 | CLEAR | 5 accepted decisions, 0 unresolved user challenges |
| Codex Review | `codex exec` | Independent 2nd opinion | 0 | UNAVAILABLE | CLI escalation rejected to avoid external disclosure |
| Eng Review | `/autoplan` | Architecture & tests | 1 | ISSUES ADDRESSED IN SPEC | 6 findings accepted, 2 critical gaps converted to requirements |
| Design Review | `/autoplan` | UI/UX gaps | 1 | ISSUES ADDRESSED IN SPEC | 7 dimensions reviewed, final planned score 8/10 |
| DX Review | `/autoplan` | Developer experience gaps | 1 | ISSUES ADDRESSED IN SPEC | Initial 5/10 to planned 8/10, TTHW target set |

**UNRESOLVED:** 0 user challenges, 0 taste decisions requiring override.

**VERDICT:** CEO + Design + Eng + DX review complete. The spec is ready for scaffold implementation with the added compatibility spike and fast-tagging requirements.
