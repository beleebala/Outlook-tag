# Changelog

All notable changes to this project are documented here.

## 0.1.0 - 2026-05-09

- Added Office Web Add-in scaffold with React, TypeScript, Fluent UI, webpack, and a Mailbox manifest.
- Added task pane flows for tagging an email, managing categories, and editing tag rules.
- Added Office.js promise wrappers for selected-item categories, master categories, and Roaming Settings.
- Added a clear startup error when the task pane URL is opened directly in a browser outside Outlook.
- Switched the HTTPS dev server to Office Add-in trusted development certificates for Outlook WebView compatibility.
- Added a certificate generation script that does not mutate the Windows trust store.
- Added a GitHub Actions workflow for GitHub Pages hosting to avoid local HTTPS certificate blockers.
- Added deterministic v1 rule execution for also-apply and remove-conflicting actions.
- Added manifest URL validation for local development and GitHub Pages production builds.
- Added initial unit tests for rule planning and manifest guardrails.
- Added README, DEVPLAN, and updated project guidance.
