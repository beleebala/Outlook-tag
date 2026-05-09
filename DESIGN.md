# Design System - Outlook Tag

## Product Context

- **What this is:** Outlook Tag is an Office Web Add-in for quickly applying and managing Outlook category tags from a task pane.
- **Who it's for:** People who triage email in Outlook and need faster category workflows without leaving the selected message.
- **Space/industry:** Microsoft 365 productivity, email triage, inbox workflow tooling.
- **Project type:** Compact Outlook task-pane web app.
- **Memorable anchor:** This feels like a fast tagging console built directly into Outlook.

## Aesthetic Direction

- **Direction:** Industrial/Utilitarian Microsoft-native.
- **Decoration level:** Minimal.
- **Mood:** Calm, precise, and work-focused. The add-in should feel like a native Outlook utility with slightly stronger structure for repeated tagging.
- **Reference basis:** Microsoft Fluent 2, Outlook task pane constraints, and current AppSource-style productivity add-ins.

## Typography

- **Display/Hero:** Segoe UI, 18px semibold for task-pane view titles.
- **Body:** Segoe UI, 13-14px regular for controls and explanatory text.
- **UI/Labels:** Segoe UI, 12-13px semibold for compact section labels.
- **Data/Tables:** Segoe UI with tabular numerals where counts or settings values appear.
- **Code:** JetBrains Mono for docs, diagnostics, and technical references only.
- **Loading:** Use native/system Microsoft fonts. Do not load web fonts into the task pane.
- **Scale:**
  - xs: 12px, metadata and helper text
  - sm: 13px, section headings and compact labels
  - md: 14px, body and controls
  - lg: 18px, view titles
  - xl: 22px, rare top-level documentation headings outside the task pane

## Color

- **Approach:** Restrained. Brand color is reserved for primary action, focus, and selected state.
- **Primary:** `#0F6CBD` - Microsoft/Outlook blue for primary actions, focus, and selected navigation.
- **Primary hover:** `#115EA3`.
- **Accent restraint:** Use category colors and Microsoft blue for priority. Avoid extra favorite/star accents in the task pane.
- **Neutrals:**
  - Canvas: `#FAF9F8`
  - Surface: `#FFFFFF`
  - Subtle surface: `#F3F2F1`
  - Border: `#E1DFDD`
  - Strong border: `#C8C6C4`
  - Muted text: `#616161`
  - Primary text: `#242424`
- **Semantic:**
  - Success: `#107C10`
  - Warning: `#F7630C`
  - Error: `#A4262C`
  - Info: `#0078D4`
- **Dark mode:** Preserve hierarchy, reduce saturation slightly, and keep category swatches readable against dark surfaces. Do not simply invert the light palette.

## Spacing

- **Base unit:** 4px.
- **Density:** Compact.
- **Scale:** 2xs(2px), xs(4px), sm(6px), md(8px), lg(12px), xl(16px), 2xl(24px), 3xl(32px).
- **Task pane padding:** 12px.
- **Group gap:** 10-14px.
- **Row gap:** 6-8px.
- **Control height:** 30-32px for compact task-pane controls.

## Layout

- **Approach:** Grid-disciplined and narrow-pane first.
- **Grid:** Single-column task-pane layout from 280px upward. Use two-column rows only when label/action widths are stable.
- **Max content width:** The task pane should fill its host width. Marketing or preview pages can cap content at 1160px.
- **Border radius:**
  - sm: 5px for buttons and inputs
  - md: 6px for chips
  - lg: 8px for panels and grouped sections
  - full: 9999px for circular swatches only
- **Cards:** Use cards only for grouped controls, repeated list items, and task-pane panels. Do not nest cards inside cards.

## Components

- **Task header:** Sticky white surface, bottom border, compact title and one-line helper text.
- **Quick tag groups:** White grouped panels with 8px radius, 10px padding, 13px section headings, compact count labels, and 32px rows.
- **Suggested tags:** First group. Shows local sender/subject matches only; no external AI or network calls.
- **All Tags:** Preview the first available tags that are not suggested or already applied. Search remains the fallback for long category lists.
- **Category swatches:** 12px circles with a subtle border. Swatches represent Outlook category color and should not be enlarged decoratively.
- **Status bar:** Subtle gray surface at the bottom, 12px text, concise messages.
- **Error states:** Use semantic background/border sparingly. Explain the recovery action in plain language.

## Motion

- **Approach:** Minimal-functional.
- **Easing:** ease-out for entry, ease-in for exit, ease-in-out for movement.
- **Duration:** micro(50-100ms), short(150-250ms), medium(250-400ms).
- **Rules:** Use motion for hover, focus, saving, and state changes only. No decorative entrance animations in the Outlook task pane.

## Safe Choices

- Stay visually close to Microsoft 365 so the add-in feels trustworthy inside Outlook.
- Keep density high because users are triaging email and repeated actions matter.
- Let Outlook category colors carry tag meaning instead of creating a separate decorative palette.

## Deliberate Risks

- Sender/subject suggestions can be wrong. Keep them clearly optional and easy to ignore.
- Grouped quick-tag panels are more structured than default Fluent lists. This improves scanning, but it must stay compact.
- The UI is intentionally low-copy. This helps expert daily use, but empty states must still explain the next action.

## Decisions Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-05-09 | Created initial design system | Based on Outlook Tag product context, Microsoft 365 task-pane constraints, and approved HTML preview direction. |
| 2026-05-10 | Removed Favorites and Recent quick-tag groups | The user chose a simpler task pane with Suggested and All Tags only. |
