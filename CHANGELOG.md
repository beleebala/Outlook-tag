# Changelog

All notable changes to this project are documented here.

## 0.1.0 - 2026-05-09

- Added suggested quick tags based on the selected email subject, sender name, and sender email.
- Added automatic pane refresh when Outlook reports that the selected email changed.
- Added refresh ordering protection so stale Outlook responses cannot overwrite newer selected-email state.
- Avoided no-op Roaming Settings saves during selected-email refreshes.
- Added component tests for suggested, all-tags, and applied quick tag states.
- Added component tests for tag manager and tag rule editing behavior.
- Added App-level tests for loading mocked Outlook data, applying a suggested tag, and opening Tag Manager.
- Added compact counts to quick tag group headings.
- Simplified quick tag groups to Suggested and All Tags.
- De-duplicated quick tag groups so suggested and all-tag rows do not repeat the same tag.
- Hid already-applied tags from quick tag groups so users only see actionable apply options.
- Added quick tag groups for suggestions and the first available mailbox categories.
- Added an approved design system for the Outlook task-pane UI.
- Updated GitHub Pages deployment to current stable GitHub Actions and Node 24.
- Updated direct npm dependencies to current stable versions.
- Updated TypeScript module resolution for TypeScript 6 compatibility.
- Added ambient type coverage for Node-based tests and CSS imports.
- Set an explicit webpack performance budget for the Office task pane bundle.
- Renamed the Outlook ribbon command to **Open Tag Panel** so the task pane entry point is explicit.
- Added Office Web Add-in scaffold with React, TypeScript, Fluent UI, webpack, and a Mailbox manifest.
- Added task pane flows for tagging an email, managing categories, and editing tag rules.
- Added Office.js promise wrappers for selected-item categories, master categories, and Roaming Settings.
- Added a clear startup error when the task pane URL is opened directly in a browser outside Outlook.
- Switched the HTTPS dev server to Office Add-in trusted development certificates for Outlook WebView compatibility.
- Added a certificate generation script that does not mutate the Windows trust store.
- Added a GitHub Actions workflow for GitHub Pages hosting to avoid local HTTPS certificate blockers.
- Removed local machine path disclosures from public-facing docs before repository publication.
- Added deterministic v1 rule execution for also-apply and remove-conflicting actions.
- Added manifest URL validation for local development and GitHub Pages production builds.
- Added initial unit tests for rule planning and manifest guardrails.
- Added README, DEVPLAN, and updated project guidance.
