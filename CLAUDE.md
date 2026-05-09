# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Outlook-tag** is an Office Web Add-in for tagging/labeling emails in Microsoft Outlook using built-in Outlook categories. v1 is Office.js-only and does not use Microsoft Graph.

## Getting Started

Use Windows PowerShell for Outlook add-in development.

```powershell
npm install
$env:ASSET_URL='https://localhost:4000'; npm start
npm test
npm run typecheck
$env:ASSET_URL='https://beleebala.github.io/Outlook-tag'; npm run build
```

## Architecture

- `manifest.xml` is the single add-in manifest. Webpack replaces `__ASSET_URL__` with the environment URL.
- `src/shared/officeApi.ts` is the only place that should wrap Office.js callback APIs.
- `src/shared/rules.ts` owns deterministic rule planning and should stay testable without Office.
- `src/shared/tagSuggestions.ts` owns local sender/subject suggestion scoring and should not call Office.js.
- `src/taskpane/components/` contains React views for tagging, managing categories, and editing tag rules.
- Category rules are stored in Office.js Roaming Settings under the `tagRules` key.
- Favorites and Recent quick-tag storage were intentionally removed; the task pane shows only Suggested and All Tags.

## Design System

Always read `DESIGN.md` before making any visual or UI decisions.
All font choices, colors, spacing, component density, and aesthetic direction are defined there.
Do not deviate without explicit user approval.
In QA mode, flag any code that does not match `DESIGN.md`.
