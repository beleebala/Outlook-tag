# Repository Guidelines

## Project Structure & Module Organization

This repository currently contains project guidance and the approved design spec for an Outlook tagging add-in.

- `CLAUDE.md` contains high-level project notes for coding agents.
- `docs/superpowers/specs/2026-05-09-outlook-tag-plugin-design.md` contains the implementation plan and architecture decisions.
- The future app scaffold is expected to add `manifest.xml`, `package.json`, `webpack.config.js`, `src/taskpane/`, and `src/shared/officeApi.ts`.

When implementation starts, keep Office.js integration isolated in `src/shared/officeApi.ts`; React UI components should live under `src/taskpane/components/`.

## Build, Test, and Development Commands

No build or test commands exist until the Office add-in scaffold is generated. After scaffolding with `yo office`, document the exact commands in `package.json` and keep this section updated.

Expected commands:

- `npm start`: run the HTTPS dev server for sideloading.
- `npm test`: run unit tests, once configured.
- `npm run build`: produce the production bundle.
- `npm run deploy`: publish the built add-in to GitHub Pages, once configured.

Use Windows PowerShell, not WSL2, for local Outlook add-in development so Outlook can reach `https://localhost:4000`.

## Coding Style & Naming Conventions

Use TypeScript for application code. Prefer small React components with clear responsibility boundaries. Use PascalCase for React components, camelCase for functions and variables, and kebab-case only for static asset filenames if needed.

Keep Office.js callback handling wrapped behind promise-based helper functions in `src/shared/officeApi.ts`. Avoid calling Office.js APIs directly from presentation components.

## Testing Guidelines

Testing is not configured yet. Once the scaffold exists, add tests for rule execution, category API wrappers, and view state transitions before expanding UI behavior.

Use names such as `officeApi.test.ts` and `TagInput.test.tsx`. Manual verification should include sideloading in Outlook on the web or New Outlook, applying/removing categories, and validating also-apply/remove-conflicting rules.

## Commit & Pull Request Guidelines

Follow the existing history style: short, imperative commit messages such as `Add design spec for Outlook Tag add-in` or `Update design spec based on advisor review`.

Pull requests should include a concise summary, testing performed, screenshots for UI changes, and any Office/Outlook client limitations. Link related issues or specs when available.

## Security & Configuration Tips

Do not commit secrets, tenant-specific credentials, or generated certificates. The v1 design avoids Microsoft Graph; if Graph is added later, document Azure app registration, OAuth scopes, and consent requirements before implementation.

- Follow the working principles: think before coding, make the minimum viable change, and treat done as a verified user-facing outcome.
- Treat the user as a novice in software development: explain technical choices in plain language, avoid unexplained jargon, and make next steps concrete enough to follow.
- Follow the scope discipline: state planned files and why before editing, avoid drive-by cleanup, and report touched files after edits.
- When a request is ambiguous, ask questions.
- Do not create branches, commit, push, or force-push without explicit user approval.
- Run the relevant validation gates before declaring work done, and report evidence.
- For data-backed testing, run a small representative sample first, usually about 3 rows rather than a single row because some bugs only appear with multiple records. Fix only the bugs found in that sample, then move to a larger test only if needed.
- Before model-backed pipeline tests or extraction calls, run a cheap model sanity check first: one tiny JSON-only prompt to the intended provider/model with a short timeout. Only proceed to the real data call after the model returns valid JSON.
- After tests, delete temporary test artifacts and test-only backups once they are no longer needed for recovery, evidence, or handoff.
- before finishing a reply, unless all tasks are completed, suggest the next step and ask in MCQ if the user wants to proceed as suggested.
- Always ask questions in numbered MCQ (`Q1`, `Q2`, etc.) with options `A`, `B`, `C`, etc.; put the recommended option first.
- Update `CHANGELOG.md` and 'devplan.md' after substantive code, config, data, feature, fix, or refactor changes.
- Read `DESIGN.md` before visual/UI decisions and `docs/architecture.md` before pipeline/API/schema changes.

If this file conflicts with higher-priority system, developer, or user instructions in the active session, follow the higher-priority instruction.
