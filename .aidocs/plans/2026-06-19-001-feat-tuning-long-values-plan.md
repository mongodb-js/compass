---
title: "Tuning" settings group + "Long values in data display" toggle (Compass fork)
type: feat
status: active
date: 2026-06-19
depth: standard
origin: User request via /pp:plan — add a "Tuning" settings group with a "Long values in data display" on/off tweak that stops truncating long document field values
---

# "Tuning" settings group + "Long values in data display" toggle

## Overview

Add a new **Tuning** tab to Compass's Settings modal — a home for custom fork tweaks — and its first toggle, **"Long values in data display"** (boolean, default **off**). When on, long document field values in the **List** and **Table** views are shown in full and wrap to the row width instead of being truncated with `…`. Implemented entirely inside our fork (`Q:\ApplicationsAi\temporaryTabularisDB\compass`); no upstream coordination.

## Problem Frame

In the Documents → List view, long string/binary values are truncated (e.g. a `_key` like `"TaskStorage/Global/Safe/GamifiedSignatures/0x4301Bef34b99Ac3c611e3f663…"` is cut off — see the user's screenshot), which badly hurts readability when keys/values carry meaningful tails. Compass offers no option to show full values. We want an opt-in toggle, grouped under a new "Tuning" section so future fork tweaks have a consistent home.

## Requirements Trace

- **R1.** A new boolean preference `longValuesInDataDisplay`, default `false`, persisted like any Compass preference.
- **R2.** A new **Tuning** tab in the Settings modal containing the toggle, labelled "Long values in data display".
- **R3.** When the preference is **on**, List + Table document values render in full (no `…`) and wrap to the available row width; the `title`/tooltip and value semantics are unchanged.
- **R4.** When **off**, behaviour is byte-for-byte the current behaviour (truncate at 70/100 chars + CSS ellipsis).
- **R5.** No circular package dependencies; `compass-components` stays preference-agnostic.
- **R6.** JSON view is unaffected (it already shows full values via Monaco).

## Scope Boundaries

- **Only** the truncation toggle + the Tuning tab scaffold. No other tweaks in this plan (the tab is built to hold more later).
- **No change to JSON view** (no truncation there).
- **Not** touching the upstream `truncate` semantics globally — truncation is made _conditional_, default unchanged.
- **No** new IPC handlers, telemetry, or preference-storage migration (the preferences system is generic).
- **Not** fixing the Windows `scripts/start.mts` `spawn('npm')` bug here (tracked separately as a fork-dev-ergonomics fix).
- **No** per-value or per-row expand UI — this is a single global toggle.

## Context & Research

See `.aidocs/research.md` (2026-06-19) for full detail.

### Relevant Code and Patterns

- Preference declaration: `packages/compass-preferences-model/src/preferences-schema.tsx` (`UserConfigurablePreferences` type ~L59–114; `storedUserPreferencesProps` ~L327+; mirror `enableDbAndCollStats` ~L602). Read hook: `usePreference` (`src/react.ts` L40–50).
- Settings UI: `packages/compass-settings/src/components/modal.tsx` (tab array ~L80–113), `src/stores/settings.ts` (`SettingsTabId` L8–15), tab components `src/components/settings/{general,privacy}.tsx`, `SettingsList`/`BooleanSetting`.
- Truncation: `packages/compass-components/src/components/bson-value.tsx` — `truncate()` L25–28; `bsonValue` CSS L61–65; `BSONValueContainer` L71–106; `StringValue` L418–430; `BSONValue` switch L533+.
- **Context precedent to mirror**: `packages/compass-components/src/components/document-list/legacy-uuid-format-context.tsx` (createContext + useContext), provided in compass-crud at `table-view/cell-renderer.tsx:355` (`DocumentList.LegacyUUIDDisplayContext.Provider`) and the list-view-item.
- compass-crud depends on `compass-preferences-model ^3.0.0` + `@mongodb-js/compass-components` — the correct layer to read the pref and provide the context.

### Institutional Learnings

- None yet — fresh fork, `.aidocs/solutions/` empty. This plan seeds it.

## Key Technical Decisions

- **KTD1 — Pass the flag via React context, not a direct `usePreference` in `compass-components`.** `compass-preferences-model` depends on `compass-components` (one-way), so importing `usePreference` into `bson-value.tsx` would be circular and break the build. Instead mirror the existing `LegacyUUIDDisplayContext` pattern: a `boolean` context owned by `compass-components`, provided by `compass-crud` from the preference. Keeps `compass-components` preference-agnostic (R5). (sketch: S2, S4)
- **KTD2 — Disable BOTH truncation layers behind the flag.** The cut-off has two causes: the JS `truncate(value, 70)` and the CSS `bsonValue` (`nowrap`+`ellipsis`). The flag must bypass the JS slice _and_ swap the CSS to a wrapping variant, or values still clip. (sketch: S3)
- **KTD3 — Default off, opt-in.** `validator: z.boolean().default(false)`; off path is the unchanged current code (R4). (sketch: S1)
- **KTD4 — Provide the context at the same sites as `LegacyUUIDDisplayContext`.** Those are exactly where `BSONValue` is rendered with display config (table cell-renderer + list-view item). compass-crud reads `usePreference('longValuesInDataDisplay')` once per site and passes it. Covers List + Table; JSON view doesn't use `BSONValue` so is naturally excluded (R6). (sketch: S4)
- **KTD5 — Tuning tab is a thin curated `SettingsList`.** No new settings infrastructure — register a tab id, a component listing `['longValuesInDataDisplay']`, and an entry in the modal tab array, mirroring `privacy.tsx`. (sketch: S5)

## Code Sketches

> Illustrative fragments — shape + call-sites, not final code. `pp:work` may diverge in detail.

### Contracts & signatures

**[S1] New preference (preferences-schema.tsx)**

```ts
// packages/compass-preferences-model/src/preferences-schema.tsx
// 1) in `UserConfigurablePreferences` type (~L59–114):
longValuesInDataDisplay: boolean;

// 2) in `storedUserPreferencesProps` (~L327+):
longValuesInDataDisplay: {
  ui: true, cli: true, global: true,
  description: {
    short: 'Long values in data display',
    long: 'When enabled, long string and binary values in the documents view are shown in full and wrap to the row width instead of being truncated with an ellipsis.',
  },
  validator: z.boolean().default(false),
  type: 'boolean',
},
```

**[S2] New truncation display context (mirror of legacy-uuid-format-context.tsx)**

```tsx
// packages/compass-components/src/components/document-list/value-truncation-context.tsx  (NEW)
import { createContext, useContext } from 'react';
// false = truncate (current default behaviour)
export const ExpandedValueDisplayContext = createContext<boolean>(false);
export function useExpandedValueDisplay(): boolean {
  return useContext(ExpandedValueDisplayContext);
}
// exported from the DocumentList namespace next to LegacyUUIDDisplayContext
```

### Core shape

**[S3] Conditional truncation in bson-value.tsx**

```tsx
// packages/compass-components/src/components/bson-value.tsx
function truncate(str: string, length = 70, shouldTruncate = true): string {
  if (!shouldTruncate) return str; // <-- new bypass
  const truncated = str.slice(0, length);
  return length < str.length ? `${truncated}…` : str;
}

const bsonValueExpanded = css({
  // <-- new wrapping variant
  whiteSpace: 'pre-wrap',
  overflow: 'visible',
  textOverflow: 'clip',
  wordBreak: 'break-word',
});

// BSONValueContainer (L71): pick CSS class from context
const expanded = useExpandedValueDisplay();
className = cx(
  className,
  expanded ? bsonValueExpanded : bsonValue,
  !expanded && type === 'String' && bsonValuePrewrap /* element-value… */
);

// StringValue (L418) and Binary/UUID renderers: respect the flag
const expanded = useExpandedValueDisplay();
const shown = useMemo(() => truncate(value, 70, !expanded), [value, expanded]); // Binary: 100
```

### Usage

**[S4] compass-crud provides the context from the preference (mirror legacy-UUID sites)**

```tsx
// e.g. packages/compass-crud/src/components/table-view/cell-renderer.tsx (~L355) and the list-view-item
import { usePreference } from 'compass-preferences-model/provider';
const longValues = usePreference('longValuesInDataDisplay');
// wrap the existing BSONValue subtree, alongside the LegacyUUIDDisplayContext.Provider:
<DocumentList.ExpandedValueDisplayContext.Provider value={longValues}>
  <DocumentList.LegacyUUIDDisplayContext.Provider
    value={legacyUUIDDisplayEncoding ?? ''}
  >
    {/* …existing BSONValue render… */}
  </DocumentList.LegacyUUIDDisplayContext.Provider>
</DocumentList.ExpandedValueDisplayContext.Provider>;
// class components (cell-renderer) read the pref via the existing preferences provider / props rather than a hook.
```

**[S5] Tuning settings tab**

```tsx
// packages/compass-settings/src/components/settings/tuning.tsx  (NEW — mirror privacy.tsx)
const tuningFields = ['longValuesInDataDisplay'] as const;
export function TuningSettings() {
  return <SettingsList fields={tuningFields} />; // optional heading/description like other tabs
}

// packages/compass-settings/src/stores/settings.ts (L8): add to union
export type SettingsTabId = 'general' | 'theme' | 'privacy' | 'oidc' | 'ai' | 'proxy' | 'preview' | 'tuning';

// packages/compass-settings/src/components/modal.tsx (~L80): register the tab
{ tabId: 'tuning', name: 'Tuning', component: TuningSettings },
```

## Open Questions

### Resolved During Planning

- **Direct `usePreference` in bson-value?** No — circular dep. Use context (KTD1).
- **Which views?** List + Table (both use `BSONValue`); JSON unaffected (Monaco).
- **One layer or two?** Both JS `truncate` and CSS ellipsis (KTD2).
- **Where to provide the context?** Same sites as `LegacyUUIDDisplayContext` (KTD4).
- **Default?** Off (KTD3).

### Deferred to Implementation

- **Exact provider sites** — enumerate every `LegacyUUIDDisplayContext.Provider` occurrence (table cell-renderer confirmed at L355; find the list-view-item equivalent) and add the new provider at each.
- **Class-component access** — `cell-renderer.tsx` is a class component; confirm it reads the preference via the existing preferences provider/props (it already receives `legacyUUIDDisplayEncoding`) rather than a hook, and thread `longValuesInDataDisplay` the same way.
- **Binary/UUID `title` behaviour** — ensure the hover `title` still shows the full value when expanded (it already passes full `value`).
- **Wrapping vs. horizontal scroll in Table view** — `pre-wrap`/`word-break` may grow row height a lot in the AG-Grid table; decide during impl whether Table should wrap or the toggle should be List-only. (List is the primary target from the screenshot.)
- **Namespace export** — confirm how `DocumentList.*` is assembled (the index that re-exports `LegacyUUIDDisplayContext`) and add `ExpandedValueDisplayContext` there.

## Implementation Units

- [ ] **Unit 1: Add the `longValuesInDataDisplay` preference**
      **Goal:** Declare the boolean preference (type + definition, default false).
      **Requirements:** R1, R3 (data), R4
      **Dependencies:** None
      **Files:**
- Modify: `packages/compass-preferences-model/src/preferences-schema.tsx`
- Test: `packages/compass-preferences-model/src/preferences-schema.spec.ts` (or existing schema test)
  **Approach:** Add field to `UserConfigurablePreferences` and the `storedUserPreferencesProps` entry per S1; `z.boolean().default(false)`; `ui/cli/global: true`.
  **Sketch:** S1
  **Patterns to follow:** `enableDbAndCollStats` definition.
  **Test scenarios:** default resolves to `false`; `usePreference('longValuesInDataDisplay')` returns saved value; invalid value rejected by zod.
  **Verification:** TypeScript compiles; preference readable/writable through the store.

- [ ] **Unit 2: Truncation display context (compass-components)**
      **Goal:** Add the `boolean` context + hook and export it in the `DocumentList` namespace.
      **Requirements:** R5
      **Dependencies:** None
      **Files:**
- Create: `packages/compass-components/src/components/document-list/value-truncation-context.tsx`
- Modify: the document-list index/namespace that re-exports `LegacyUUIDDisplayContext`
- Test: `packages/compass-components/.../value-truncation-context.spec.tsx` (default value)
  **Approach:** Mirror `legacy-uuid-format-context.tsx` exactly (S2); default `false`.
  **Sketch:** S2
  **Patterns to follow:** `legacy-uuid-format-context.tsx`.
  **Test scenarios:** hook returns `false` with no provider; returns provided value under a provider.
  **Verification:** `DocumentList.ExpandedValueDisplayContext` importable from `@mongodb-js/compass-components`.

- [ ] **Unit 3: Make `bson-value.tsx` truncation conditional**
      **Goal:** Bypass JS `truncate` and swap CSS to wrapping when the context is true.
      **Requirements:** R3, R4, R6
      **Dependencies:** Unit 2
      **Files:**
- Modify: `packages/compass-components/src/components/bson-value.tsx`
- Test: `packages/compass-components/src/components/bson-value.spec.tsx`
  **Approach:** `truncate(str, length, shouldTruncate=true)`; `StringValue` + Binary/UUID renderers read `useExpandedValueDisplay()` and pass `!expanded`; `BSONValueContainer` chooses `bsonValueExpanded` vs `bsonValue` (S3). Default path identical to today.
  **Sketch:** S3
  **Patterns to follow:** existing `useLegacyUUIDDisplayContext()` usage in the same file.
  **Test scenarios:** long string with provider=true renders full (no `…`) and wraps; provider=false/absent renders truncated at 70 with `…`; Binary subtype at 100 respects flag; `title` always full.
  **Verification:** Storybook/unit test toggling the provider shows full vs truncated.

- [ ] **Unit 4: Provide the context from the preference (compass-crud)**
      **Goal:** Wire `longValuesInDataDisplay` → context at every BSONValue wrap site.
      **Requirements:** R3, R4
      **Dependencies:** Unit 1, Unit 2, Unit 3
      **Files:**
- Modify: `packages/compass-crud/src/components/table-view/cell-renderer.tsx` (~L355) and the list-view-item provider site(s)
- Test: `packages/compass-crud/src/components/document-list-view-item.spec.tsx` / cell-renderer spec
  **Approach:** Read `usePreference('longValuesInDataDisplay')` (or thread via existing preferences props for class components) and wrap the BSONValue subtree in `ExpandedValueDisplayContext.Provider` alongside the legacy-UUID provider (S4). Enumerate all provider sites (Deferred Q).
  **Sketch:** S4
  **Patterns to follow:** the adjacent `LegacyUUIDDisplayContext.Provider` usage.
  **Test scenarios:** pref on → List + Table show full values; pref off → truncated; JSON view unchanged.
  **Verification:** In running Compass, toggling the setting changes the screenshot collection's `_key` rendering live.

- [ ] **Unit 5: Tuning settings tab**
      **Goal:** Surface the toggle in a new Tuning tab.
      **Requirements:** R2
      **Dependencies:** Unit 1
      **Files:**
- Create: `packages/compass-settings/src/components/settings/tuning.tsx`
- Modify: `packages/compass-settings/src/stores/settings.ts` (`SettingsTabId`), `packages/compass-settings/src/components/modal.tsx` (tab array + import)
- Test: `packages/compass-settings/src/components/settings/tuning.spec.tsx` (or modal spec)
  **Approach:** New tab component renders `<SettingsList fields={['longValuesInDataDisplay']} />` (S5), label from the preference's `description.short`; register tab id + array entry, mirroring `privacy.tsx`.
  **Sketch:** S5
  **Patterns to follow:** `components/settings/privacy.tsx` + `modal.tsx` registration.
  **Test scenarios:** Tuning tab appears in Settings; toggling the checkbox dispatches `changeFieldValue` and persists; reflects current pref value.
  **Verification:** Settings modal shows Tuning → "Long values in data display"; toggling updates the document view.

## Requirements Coverage Matrix

| Requirement        | Unit(s)  | Test Coverage                                   |
| ------------------ | -------- | ----------------------------------------------- |
| R1 preference      | U1       | schema spec (default/validate)                  |
| R2 Tuning tab      | U5       | settings/modal spec                             |
| R3 full display on | U2,U3,U4 | bson-value spec + crud spec + manual            |
| R4 unchanged off   | U1,U3    | bson-value spec (provider=false)                |
| R5 no circular dep | U2,U4    | build passes; components has no preferences dep |
| R6 JSON unaffected | U4       | manual (JSON view)                              |

## System-Wide Impact

- **Packages touched:** `compass-preferences-model` (1 pref), `compass-components` (new context + conditional render), `compass-crud` (provide context), `compass-settings` (tab). Dependency graph unchanged — context owned by `compass-components`, consumed downward; preference read only in `compass-crud`/`compass-settings`.
- **Render path:** `BSONValue` is shared; the change is gated by a context that defaults to current behaviour, so all other `BSONValue` usages (query results, validation, etc.) are unaffected unless a provider opts them in.
- **Error propagation:** none new — pure rendering/preference change.
- **Parity:** any future Tuning toggle reuses the same tab + preference pattern.

## Risks & Dependencies

- **Table view row growth** — wrapping long values in the AG-Grid Table may inflate row heights/layout. Mitigation: if ugly, scope the toggle to List view only (primary target). _Medium._
- **Multiple provider sites missed** — if a BSONValue wrap site lacks the new provider, values there stay truncated. Mitigation: enumerate every `LegacyUUIDDisplayContext.Provider` occurrence and co-locate the new one (Deferred Q). _Medium._
- **Class-component preference access** — `cell-renderer.tsx` is a class; must thread the pref via existing preferences props (as it does for `legacyUUIDDisplayEncoding`) rather than a hook. _Low._
- **Upstream merge hygiene** — these are fork edits to upstream files; keep them minimal/localized to ease future rebases. _Low._
- **Dependency:** running Compass dev build (already working) for live verification of U4.

## Sources & References

- **Origin:** User request via `/pp:plan` (+ screenshot of truncated `_key` values).
- Research: `.aidocs/research.md` (2026-06-19).
- Code: `compass-preferences-model/src/preferences-schema.tsx`, `compass-components/src/components/bson-value.tsx` + `document-list/legacy-uuid-format-context.tsx`, `compass-crud/src/components/table-view/cell-renderer.tsx`, `compass-settings/src/components/modal.tsx` + `stores/settings.ts`.
