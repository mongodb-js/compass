# Research — Compass Fork Tweaks

Running research summary for our `mongodb-js/compass` fork. Newest entries on top.

---

## 2026-06-19 — "Tuning" settings group + "Long values in data display" toggle

Goal: add a new **Tuning** settings tab holding on/off toggles for custom fork tweaks; first toggle **"Long values in data display"** (boolean, default off) that, when on, stops truncating long document field values (List + Table views) and shows them in full, wrapping to row width.

### Preferences system (`packages/compass-preferences-model`)

- Preferences are declared in **`src/preferences-schema.tsx`**: a field on the `UserConfigurablePreferences` type (~L59–114) **plus** an entry in `storedUserPreferencesProps` (~L327+). Shape of a boolean pref (mirror `enableDbAndCollStats`, ~L602):
  ```ts
  enableDbAndCollStats: {
    ui: true, cli: true, global: true,
    description: { short: '…', long: '…' },
    validator: z.boolean().default(true),
    type: 'boolean',
  }
  ```
  Zod validators enforce type+default at load/save. `PreferenceDefinition<K>` ties metadata to the typed key.
- Read in React: **`usePreference('<key>')`** (`src/react.ts` L40–50). Written via the settings store action `changeFieldValue` (`compass-settings/src/stores/settings.ts` L208–242) → `PreferencesSandbox` → IPC `compass:save-preferences`.
- **No category metadata** on preferences — a settings _tab_ simply curates a `fields` array passed to `<SettingsList>`. Adding a pref needs **no IPC/telemetry/migration changes** (generic system); telemetry auto-tracks `Setting Changed`.

### Settings modal UI (`packages/compass-settings`)

- Tabs are a hardcoded array in **`src/components/modal.tsx`** (~L80–113): `{ tabId, name, component }`, some conditionally added. `SettingsTabId` union lives in **`src/stores/settings.ts`** (L8–15).
- Each tab component (e.g. `components/settings/general.tsx`, `privacy.tsx`) lists preference names and renders `<SettingsList fields={[…]} />`. `BooleanSetting`/`ConnectedSettingsInput` render a `Checkbox` whose label comes from the preference's `description.short`.
- To add **Tuning**: (1) `'tuning'` into `SettingsTabId`; (2) new `components/settings/tuning.tsx` listing `['longValuesInDataDisplay']`; (3) register `{ tabId:'tuning', name:'Tuning', component: TuningSettings }` in `modal.tsx`.

### Value truncation (`packages/compass-components/src/components/bson-value.tsx`)

- **JS truncation** — `truncate(str, length = 70)` (L25–28): slices + appends `…`. `StringValue` calls `truncate(value, 70)` (L422) — this is the main cause of the screenshot's cut-off `_key` strings. Binary/UUID subtypes use `truncate(value, 100)` (~L174, 324–356).
- **CSS truncation** — `bsonValue` class (L61–65): `whiteSpace: nowrap; overflow: hidden; textOverflow: ellipsis`, applied by `BSONValueContainer` (L71–106). (String also gets `bsonValuePrewrap` `whiteSpace: pre-wrap`.) So full fix needs **both** layers off.
- `BSONValue` (L533+) is a `switch(type)` dispatching to per-type renderers. Used by **List** (via `document-list/element.tsx`) and **Table** (via `compass-crud/table-view/cell-renderer.tsx`). **JSON view = Monaco editor, no truncation** → toggle won't affect it.

### Dependency direction (critical) + the chosen mechanism

- `compass-preferences-model` **depends on** `@mongodb-js/compass-components`; `compass-components` does **NOT** depend on preferences. So importing `usePreference` into `compass-components` would be a **circular dependency** — rejected.
- **Mechanism = React context (existing precedent).** `bson-value.tsx:17` already consumes `useLegacyUUIDDisplayContext` from `document-list/legacy-uuid-format-context.tsx`:
  ```tsx
  export const LegacyUUIDDisplayContext = createContext<LegacyUUIDDisplay>('');
  export function useLegacyUUIDDisplayContext() {
    return useContext(LegacyUUIDDisplayContext);
  }
  ```
  Provided from compass-crud at the BSONValue wrap sites, e.g. `table-view/cell-renderer.tsx:355` `<DocumentList.LegacyUUIDDisplayContext.Provider value={…}>`.
- → Mirror it: a new `boolean` context in compass-components (default `false` = truncate), consumed by `bson-value.tsx`; **compass-crud reads `usePreference('longValuesInDataDisplay')`** and provides it at the same wrap sites as the legacy-UUID context. compass-crud already depends on both packages (`compass-preferences-model ^3.0.0` + `@mongodb-js/compass-components`).

### Minimal files to touch

1. `compass-preferences-model/src/preferences-schema.tsx` — add pref (type + definition).
2. `compass-components/src/components/document-list/value-truncation-context.tsx` — **new** context (mirror legacy-uuid).
3. `compass-components/src/components/bson-value.tsx` — `truncate()` gains `shouldTruncate`; `StringValue`/Binary + `BSONValueContainer` consume the context; new expanded CSS class.
4. `compass-components` document-list index — export the new context in the `DocumentList` namespace.
5. `compass-crud` — provide the context from the preference at every legacy-UUID provider site (list-view-item + table cell-renderer).
6. `compass-settings` — `SettingsTabId` (+`'tuning'`), new `settings/tuning.tsx`, register in `modal.tsx`.

### Build/runtime notes

- Compass builds & runs from the fork (Node 24.15.0 / npm 11.17.0; `npm run bootstrap` green; dev server on :4242). `scripts/start.mts` has a Windows `spawn('npm')` ENOENT bug — bypassed by running `npm run start --workspace=mongodb-compass` with `npm_config_script_shell=bash`. (Separate fork-fix candidate.)
