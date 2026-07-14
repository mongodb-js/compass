# compass-e2e-tests Page Object refactor

## Context

`packages/compass-e2e-tests/` currently dumps test infrastructure into two flat structures:

- `helpers/selectors.ts` — **1547 LoC, ~712 exports, ~64 parameterized selector functions**, organized only by hand-maintained `// section` comments (~42 sections). 88% of selectors already use `data-testid`, so the underlying selector strategy is sound; the structural problem is the flat file and the lack of an owner per selector.
- `helpers/commands/` — **79 files, ~4838 LoC**, each exporting `(browser, ...args) => Promise<T>`. They are star-exported from `commands/index.ts` and then registered onto WebdriverIO via `browser.addCommand()` inside `Compass.prepare()` (`helpers/compass.ts:175-182`); TypeScript sees them through a conditional mapped type in `helpers/compass-browser.ts`. Commands are a mix of domain workflows (`connect`, `createIndex`, `setValidation`), navigation (`sidebarConnection`, `workspaceTabs`), and generic UI primitives (`clickVisible`, `hover`, `setValueVisible`, `waitForAnimations`).
- Several commands look like workarounds for older WDIO / Chrome quirks (`click-visible`, `set-value-visible`, `wait-for-animations`, `scroll-to-virtual-item`, `dialog-open-locator-strategy`) that may simplify or disappear under WebdriverIO v9.

Tests in `tests/` (~43 files, ~18k LoC) consume both files heavily — a typical test has ~60-80 `Selectors.X` references and ~100+ `browser.customCommand()` calls. Coupling is real but mostly per-feature; cross-feature tests (documents, aggregations, import, export) are heaviest and will need splitting.

Goal: introduce a Page Object Model rooted at `compass.pages`, fold selectors and domain commands into the page objects that own them, and revalidate the generic UI primitives against modern WebdriverIO v9 APIs (Element custom commands, implicit clickable waits, BiDi logging) to drop workarounds where possible.

## Decisions

| Decision                | Choice                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Test access pattern** | `compass.pages.<area>.<method>()`. Page objects are instantiated by `Compass.prepare()` and exposed via a typed `pages` tree on the `Compass` orchestrator.                                                                                                                                                                                                                                                                                                                                                  |
| **UI utilities**        | Prefer **WDIO Element custom commands** (`browser.addCommand(name, fn, /* attachToElement */ true)`) so they chain naturally: `await $(sel).clickWhenVisible()`. Commands that are intrinsically browser-scoped (`waitForOpenModal`, `getOpenModals`, `hideAllVisibleToasts`) stay on `browser`.                                                                                                                                                                                                             |
| **Selectors**           | **Folded into each page object class — no separate `.selectors.ts` file.** Locators are `$`-prefixed members (getters or methods) on the page object, returning `ChainablePromiseElement`. Raw selector strings live as private `string` constants at the top of the class file or inline within each getter, never exported. The few helper commands that still take a string today get migrated to take an element (Step 7), removing the last reason to export selectors. Tests import only page objects. |
| **Naming convention**   | `$identifier` for any member or method that **returns a `ChainablePromiseElement`** (`this.$insertButton`, `this.$documentRow(i)`). Action methods are camelCase verbs (`insertDocument`, `runFind`). Parameterized locators are methods, parameterless ones are getters.                                                                                                                                                                                                                                    |
| **Migration cadence**   | **Hard cutover per page.** When a page object lands, its selectors are removed from `helpers/selectors.ts` and its consuming tests migrate in the **same PR**. No long-running coexistence. PRs target ≤800 LoC; oversized features split by sub-page.                                                                                                                                                                                                                                                       |
| **Coverage**            | Electron and `compass-web` migrated together per page. Atlas-cloud helpers already in `commands/atlas-cloud/` move into `pages/` under the same page objects they support.                                                                                                                                                                                                                                                                                                                                   |
| **Guardrails**          | Hard cutover + TypeScript errors + PR review. No ESLint guard rule — investigation showed the marginal value over hard-cutover-induced TS errors didn't justify the per-PR maintenance cost. Revisit if reintroductions start slipping through review during the long migration window.                                                                                                                                                                                                                      |

## Progress

### Step 0 — Foundation

- [x] PR 0.1 — `pages/` skeleton (`BasePage`, `Pages` interface, `buildPages()`, `pages/README.md`, `Compass.pages` wiring, tsconfig include)
- [x] PR 0.2 — element-command registration infrastructure
- [~] PR 0.3 — ~~ESLint cutover-guard rule~~ **skipped**; built-in rules can cover it but the marginal value over hard-cutover-induced TS errors didn't justify the per-PR maintenance overhead. Revisit if reintroductions slip through review.

### Step 1 — Shared infrastructure

- [x] PR 1.1a — `pages/shared/sidebar/` bootstrap + connection surface
- [ ] PR 1.1b — `pages/shared/sidebar/` database + collection tree
- [ ] PR 1.2 — `pages/shared/workspace-tabs/`
- [ ] PR 1.3 — `pages/shared/modals/` + `toasts/`

### Step 2 — Small features

- [ ] PR 2.1 — `pages/welcome/`
- [ ] PR 2.2 — `pages/settings/`
- [ ] PR 2.3 — `pages/connection-form/` (may split)
- [ ] PR 2.4 — `pages/shell/`

### Step 3 — Instance & database

- [ ] PR 3.1 — `pages/instance/`
- [ ] PR 3.2 — `pages/database/`

### Step 4 — Collection (heaviest area; split by tab)

- [ ] PR 4.1 — `pages/collection/collection.page.ts` (header + rename + tab switcher)
- [ ] PR 4.2 — `pages/collection/documents/` (likely 2-3 PRs)
- [ ] PR 4.3 — `pages/collection/aggregations/` (likely 2 PRs)
- [ ] PR 4.4 — `pages/collection/indexes/`
- [ ] PR 4.5 — `pages/collection/schema/` + `validation/`
- [ ] PR 4.6 — `pages/collection/export/` + `import/`

### Step 5 — Specialized features

- [ ] PR 5.1 — `pages/my-queries/`
- [ ] PR 5.2 — `pages/data-modeling/`
- [ ] PR 5.3 — `pages/assistant/`

### Step 6 — Cross-cutting cleanup

- [ ] PR 6.1 — migrate remaining cross-feature tests
- [ ] PR 6.2 — delete `helpers/selectors.ts`

### Step 7 — WebdriverIO v9 revalidation + cross-cutting element commands (parallel with Step 3+)

- [ ] PR 7.1 — `click-visible`
- [ ] PR 7.2 — `set-value-visible`
- [ ] PR 7.3 — `wait-for-animations`
- [ ] PR 7.4 — `click-parent`
- [ ] PR 7.5 — `hover`
- [ ] PR 7.6 — `scroll-to-virtual-item` (cross-domain; element command, not Sidebar method)
- [ ] PR 7.7 — `dialog-open-locator-strategy`
- [ ] PR 7.8 — `addDebugger()`
- [ ] PR 7.9 — `expand-accordion` (reassigned from PR 1.1)
- [ ] PR 7.10 — `select-file` (reassigned from PR 4.6)
- [ ] PR 7.11 — `get-input-by-label` + `leafygreen` (single-digit usages — inline or convert)

### Step 8 — Final shape

- [ ] PR 8.1 — remove `helpers/commands/` star-export pattern
- [ ] PR 8.2 — trim/split `helpers/compass.ts`

## Target architecture

```
packages/compass-e2e-tests/
├── helpers/
│   ├── compass.ts                       # Compass class + lifecycle (trimmed)
│   ├── compass-browser.ts               # type aug (shrinks as commands move)
│   ├── element-commands/                # custom Element commands (new)
│   │   ├── index.ts                     # registers all element commands in prepare()
│   │   ├── click-when-visible.ts
│   │   ├── set-value-safe.ts
│   │   ├── exists-eventually.ts
│   │   ├── wait-for-aria-disabled.ts
│   │   └── …
│   ├── commands/                        # browser-scoped commands only (shrinks)
│   │   ├── index.ts
│   │   ├── wait-for-open-modal.ts
│   │   ├── get-open-modals.ts
│   │   ├── hide-visible-toasts.ts
│   │   ├── screenshot.ts
│   │   └── … (small set of true browser commands)
│   └── …
├── pages/
│   ├── README.md                        # conventions (naming, $ prefix, cutover rules)
│   ├── PLAN.md                          # this file
│   ├── base-page.ts                     # base class — holds `browser`, shared helpers
│   ├── index.ts                         # builds the pages tree; consumed by Compass
│   ├── shared/
│   │   ├── sidebar/
│   │   │   └── sidebar.page.ts
│   │   ├── workspace-tabs.page.ts
│   │   ├── modals.page.ts
│   │   ├── toasts.page.ts
│   │   └── codemirror.page.ts
│   ├── welcome/
│   ├── settings/
│   ├── connection-form/                 # absorbs connect-form-state.ts types
│   ├── shell/
│   ├── instance/
│   ├── database/
│   ├── collection/
│   │   ├── collection.page.ts           # header + tab switcher
│   │   ├── documents.page.ts            # may split out query-bar.page.ts
│   │   ├── aggregations.page.ts         # may split out stage-editor / pipeline-output
│   │   ├── schema.page.ts
│   │   ├── validation.page.ts
│   │   ├── indexes.page.ts
│   │   ├── export.page.ts
│   │   └── import.page.ts
│   ├── my-queries/
│   ├── data-modeling/
│   └── assistant/
└── tests/                               # tests import only `compass.pages.*`
```

`Compass.prepare()` gains, after current command registration:

```ts
// register element commands (browser.addCommand(name, fn, true))
for (const [k, v] of Object.entries(ElementCommands)) {
  this.browser.addCommand(
    k,
    function (this: WebdriverIO.Element, ...args) {
      return v(this, ...args);
    },
    true
  );
}
// build pages tree
this.pages = buildPages(this.browser);
```

Page object shape (selectors live inline as private constants; only `$`-prefixed accessors are reachable from outside the class):

```ts
// pages/collection/documents.page.ts
import { BasePage } from '../base-page';

export class DocumentsPage extends BasePage {
  // Raw selector strings: private, scoped to this file, never exported.
  static readonly #InsertButton = '[data-testid="insert-document-button"]';
  static readonly #documentRow = (i: number) =>
    `[data-testid="document-row-${i}"]`;

  // Element accessors: `$`-prefix marks anything returning a ChainablePromiseElement.
  get $insertButton() {
    return this.browser.$(DocumentsPage.#InsertButton);
  }
  $documentRow(i: number) {
    return this.browser.$(DocumentsPage.#documentRow(i));
  }

  // Action methods: camelCase verbs.
  async insert(doc: Record<string, unknown>) {
    await this.$insertButton.clickWhenVisible();
    // …
  }
}
```

Inside a page object, "is this a locator or an action?" is answered by the `$` prefix at a glance.

## Migration steps

Each step below = one mergeable PR unless noted "may split". Hard cutover: every PR that introduces a page object also removes its selectors from `helpers/selectors.ts` (folding them inline as private members of the new page object class) and updates every consuming test.

### Step 0 — Foundation (no test changes)

- **PR 0.1** `pages/` skeleton: `BasePage`, `pages/index.ts` factory, `pages/README.md` (conventions: `$`-prefix, sibling selectors file, cutover rules), `Compass.pages` wiring in `helpers/compass.ts`. Add empty `pages.<area>` slots that will be filled by later PRs. ~150 LoC.
- **PR 0.2** Element-command infrastructure: `helpers/element-commands/index.ts`, register-loop in `Compass.prepare()`, type augmentation for `WebdriverIO.Element` in `compass-browser.ts`. Ships with zero element commands — just wiring. ~80 LoC.
- ~~**PR 0.3** ESLint guard rule~~ — **skipped.** Hard cutover already produces TypeScript errors for any unmigrated usage; PR review catches reintroductions. The built-in `no-restricted-exports` + `no-restricted-syntax` rules could be scoped to `helpers/selectors.ts` and `helpers/commands/index.ts` via overrides in `packages/compass-e2e-tests/.eslintrc.js` if this turns out to be needed later; no custom plugin work required either way.

### Step 1 — Shared infrastructure (used by every later page)

- **PR 1.1a** `pages/shared/sidebar/sidebar.page.ts` — sidebar bootstrap + connection surface. Introduces the `SidebarPage` class, widens `pages/index.ts`'s `buildPages()` to take `(browser, mode)`, adds the first `Pages` slot (`sidebar`), and drops the now-unneeded `no-empty-object-type` disable + TODO in `pages/index.ts`. Folds the connection-list + filter + sidebar-header-menu selectors into the class. Absorbs `helpers/commands/sidebar-connection.ts` and `helpers/commands/select-connections-menu-item.ts`. Updates every test that references connection-sidebar selectors/commands.
- **PR 1.1b** `pages/shared/sidebar/` — database + collection tree extension. Extends `SidebarPage` with database/collection tree members and methods. Absorbs `helpers/commands/sidebar-collection.ts` (including `selectCollectionMenuItem`). Updates remaining tests. (Note: `sidebar-collection.ts` calls `browser.scrollToVirtualItem(...)` internally; that call stays as a browser/element command and gets revalidated in Step 7. `expand-accordion` originally listed under PR 1.1 has been reassigned — see Step 7.)
- **PR 1.2** `pages/shared/workspace-tabs/` — tab strip + `connection-workspaces`, `database-workspaces`, `collection-workspaces`, `workspace-tabs`. Removes Workspace Tabs section from `selectors.ts`.
- **PR 1.3** `pages/shared/modals/` + `pages/shared/toasts/` — modal & toast utilities. Migrates `get-open-modals`, `wait-for-open-modal`, `is-modal-open`, `is-modal-eventually-open`, `hide-visible-modal`, `hide-visible-toasts`, `click-confirmation-action`. Keeps `waitForOpenModal` as a browser command (it operates across pages); domain modal handling moves into the page object that owns each modal in later PRs.

### Step 2 — Small features

- **PR 2.1** `pages/welcome/` — `close-welcome-modal`. Trivial.
- **PR 2.2** `pages/settings/` — settings modal + preferences. Migrates `open-settings-modal`, `close-settings-modal`, `preferences.ts`. Updates `global-preferences.test.ts` and settings-touching tests.
- **PR 2.3** `pages/connection-form/` — connection form + advanced tabs + form-state type. Absorbs `helpers/connect-form-state.ts`, `connect-form`, `connect`, `disconnect`, `remove-connections`, `save-favorite`, `save-connection-string-as-favorite`, `navigate-to-connect-tab`. **May split** into (a) `connection-form.page.ts` (form fields + advanced tabs) and (b) `connection-actions.page.ts` (connect/disconnect/save flows + the consumer test migrations) if combined diff exceeds 800 LoC.
- **PR 2.4** `pages/shell/` — `open-shell`, `close-shell`, `shell-eval`. Updates `shell.test.ts`.

### Step 3 — Instance & database

- **PR 3.1** `pages/instance/` — databases list, performance tab, instance sidebar. Introduces the shared `pages/shared/drop-namespace-modal.page.ts` sub-page (the post-button-click confirmation modal flow currently in `helpers/commands/drop-namespace.ts`, used by Instance, Database, and direct tests). Migrates `add-database`, `drop-database-from-sidebar`, `drop-namespace`. `Instance.dropDatabase(name)` orchestrates `sidebar` + `dropNamespaceModal.confirm(name)`. Updates `instance-*.test.ts` and the direct callers in `instance-databases-tab.test.ts`.
- **PR 3.2** `pages/database/` — database workspace. Migrates `add-collection`, `drop-collection-from-sidebar`. Reuses the `drop-namespace-modal` sub-page introduced in PR 3.1. Updates `database-*.test.ts`.

### Step 4 — Collection (heaviest area; split by tab)

- **PR 4.1** `pages/collection/collection.page.ts` — header + rename + tab switcher. Updates `collection-heading.test.ts`, `collection-rename.test.ts`.
- **PR 4.2** `pages/collection/documents/` — split into `documents.page.ts` and `query-bar.page.ts` from the start to stay under 800 LoC. Migrates `run-find`, `run-find-operation`, `get-query-id`, `try-to-insert-document`, `read-first-document-content`. Updates `collection-documents-tab.test.ts`, `collection-bulk-delete.test.ts`, `collection-bulk-update.test.ts`, `collection-ai-query-mocked.test.ts`, `time-to-first-query.test.ts`, `atlas-list-collections-documents.test.ts`. Likely needs **2-3 PRs** (sub-page introductions, then test-file batches).
- **PR 4.3** `pages/collection/aggregations/` — pipeline builder, stage editor, focus mode, wizard, output, export-to-language. Migrates `select-stage-operator`, `focus-stage-operator`, `select-stage-menu-option`, `select-text-pipeline-output-option`, `select-pipeline-results-output-option`, `select-focus-mode-stage-output-option`, `save-aggregation-pipeline`, `read-stage-operators`, `toggle-aggregation-side-panel`, `switch-pipeline-mode`, `add-wizard`, `export-to-language`. Likely **2 PRs** (page objects, then test migration of the ~1000 LoC `collection-aggregations-tab.test.ts`).
- **PR 4.4** `pages/collection/indexes/` — indexes + search indexes. Migrates `create-index`, `drop-index`, `hide-index`, `unhide-index`. Updates `collection-indexes-tab.test.ts`, `search-indexes.test.ts`.
- **PR 4.5** `pages/collection/schema/` and `pages/collection/validation/`. Migrates both exports of `helpers/commands/set-validation.ts` — `setValidationWithinValidationTab` (tab-internal editor flow) and `setValidation` (high-level navigate-then-edit workflow). Updates `collection-schema-tab.test.ts`, `collection-validation-tab.test.ts`, plus the `setValidation` consumers in `collection-documents-tab.test.ts` and `collection-import.test.ts`.
- **PR 4.6** `pages/collection/export/` and `pages/collection/import/`. Migrates `set-export-filename`, `wait-for-export-to-finish` (exports `waitForExportToFinishAndCloseToast`; rename file during the move). Updates `collection-export.test.ts`, `collection-import.test.ts`. (Note: `select-file` reassigned to Step 7 since it's cross-cutting — used by data-modeling, connection import/export, collection import, and connect-form.)

### Step 5 — Specialized features

- **PR 5.1** `pages/my-queries/` — saved queries/aggregations. Updates `my-queries-tab.test.ts`.
- **PR 5.2** `pages/data-modeling/` — replaces XPath label selectors (the only XPath in `selectors.ts`) with `data-testid` where the product supports it; otherwise keeps the strings as private class constants on the page object. Updates `data-modeling-tab.test.ts`.
- **PR 5.3** `pages/assistant/` — AI assistant. Migrates `assistant.ts`. Updates `assistant.test.ts`, `assistant-mocked.test.ts`.

### Step 6 — Cross-cutting cleanup

- **PR 6.1** Migrate remaining tests not tied to a single page (`auto-connect`, `auto-update`, `connection-form`, `import-export-connections`, `in-use-encryption`, `intercom`, `logging`, `no-network-traffic`, `oidc`, `protect-connection-strings`, `proxy`, `read-only`, `read-write`, `routing`, `tabs`, `force-connection-options`, `show-kerberos-password-field`).
- **PR 6.2** Delete now-empty `helpers/selectors.ts`. Remove any remaining re-exports.

### Step 7 — WebdriverIO v9 revalidation (runs in parallel with Step 3+ once conventions are stable)

Each PR audits one workaround / cross-cutting helper, replaces or simplifies, and runs the full e2e suite to confirm flakiness doesn't regress. Element commands chain naturally on `$(sel)`.

- **PR 7.1** `click-visible` (`helpers/commands/click-visible.ts:11-36`): WDIO v9 `.click()` already waits for clickable. Replace with element command `clickWhenVisible` only where the extra `waitForAnimations + scrollIntoView + screenshot` behavior is needed; replace plain usages with `$(...).click()`. Audit ~all uses across page objects.
- **PR 7.2** `set-value-visible` (`commands/set-value-visible.ts:6-29`): the retry loop with `Ctrl+A` / `Delete` predates `clearValue()`. Try `await el.clearValue(); await el.setValue(v)` first; keep `setValueSafe` as an element command only for inputs that genuinely need the retry. Audit each call site.
- **PR 7.3** `wait-for-animations` (`commands/wait-for-animations.ts:6-38`): uses location/size polling. Replace with `animationend`/`transitionend` listener via `browser.execute(...)` or BiDi `script` events on a scoped element. Likely keep as element command but with a cleaner implementation; delete redundant callers that no longer need it once `click()` waits for clickable.
- **PR 7.4** `click-parent` (`commands/click-parent.ts`): almost certainly a legacy workaround for a since-fixed DOM structure. Audit usages; rewrite each to target the actual clickable element. Delete the command.
- **PR 7.5** `hover` (`commands/hover.ts`): WDIO `moveTo()` is sufficient in v9. Replace with element command thin wrapper or inline calls.
- **PR 7.6** `scroll-to-virtual-item` (`commands/scroll-to-virtual-item.ts`, 171 LoC): the heaviest workaround. Used cross-domain (`sidebar-collection`, `database-collections-tab`, `instance-databases-tab`, `instance-sidebar`, `in-use-encryption`) so this must be a generic element command (`$list.scrollToVirtualChild(itemSelector)`), not a `SidebarPage` method. Investigate whether native `scrollIntoView({ block: 'center' })` + waiting for the virtualized child to mount is now sufficient given the virtualization library's behavior. Simplify in place; only delete if confirmed unnecessary.
- **PR 7.7** `dialog-open-locator-strategy` (`helpers/dialog-open-locator-strategy.ts:1-17`): WDIO v9 supports `aria/dialog`-style selectors. Audit usages and replace where possible; keep strategy only if a true `HTMLDialogElement.open` check has no equivalent.
- **PR 7.8** `addDebugger()` (`helpers/compass.ts` — wraps every browser method with debug logging + stack augmentation): WDIO v9 BiDi-based logging may make this redundant. Profile + audit + remove if redundant.
- **PR 7.9** `expand-accordion` (`commands/expand-accordion.ts`, 20 LoC): generic `aria-expanded` toggle pattern; only used by `connect-form.ts` today but applicable to any LG Accordion. Convert to an element command `$button.expandIfCollapsed()` (or inline at the 5 call sites if the indirection isn't worth keeping).
- **PR 7.10** `select-file` (`commands/select-file.ts`): generic `<input type=file>` setter. Used by data-modeling, connection import/export, collection import, and connect-form. Convert to an element command `$fileInput.attachFile(path)`.
- **PR 7.11** `get-input-by-label` (`commands/get-input-by-label.ts`, 10 LoC) and `leafygreen` (`commands/leafygreen.ts`, 22 LoC): single-digit usages. Either convert to element commands (`$label.getAssociatedInput()`, `$el.waitForLgEnabled()`) or inline at the call sites and delete the files. Decide during the PR.

### Step 8 — Final shape

- **PR 8.1** Remove `helpers/commands/` star-export pattern; the small set of remaining browser commands gets a flat `index.ts`. Ensure `compass-browser.ts` types reflect only what's left.
- **PR 8.2** Trim `helpers/compass.ts` (1360 LoC): split the `Compass` class (`compass.ts:144-527`) into `helpers/compass.ts`, and move standalone helpers (`init`, `cleanup`, `screenshotIfFailed`, `serverSatisfies`, `skipForWeb`, build/spawn utilities) into `helpers/test-runner-lifecycle.ts` and `helpers/test-runner-build.ts`. Not strictly required by the POM refactor — included so we leave the workspace in a coherent state.

## Critical files

- `packages/compass-e2e-tests/helpers/selectors.ts` — folded into the page object classes (selectors become private members on the page they belong to), then deleted.
- `packages/compass-e2e-tests/helpers/commands/index.ts` — gradually emptied.
- `packages/compass-e2e-tests/helpers/commands/*.ts` (79 files) — each migrated to either a page object method, an element command, or a slimmed-down browser command (or deleted).
- `packages/compass-e2e-tests/helpers/compass-browser.ts:5-12` — gains `WebdriverIO.Element` augmentation alongside the existing `WebdriverIO.Browser` augmentation; shrinks as commands move.
- `packages/compass-e2e-tests/helpers/compass.ts:144-215` — `Compass.prepare()` extended to register element commands and instantiate `this.pages`.
- `packages/compass-e2e-tests/helpers/connect-form-state.ts` — moves into `pages/connection-form/`.
- `packages/compass-e2e-tests/helpers/dialog-open-locator-strategy.ts` — kept, moved, or deleted per Step 7.7.
- `packages/compass-e2e-tests/helpers/commands/atlas-cloud/` — the only existing subdirectory; precedent for the migration shape (referenced in `pages/README.md`).
- `packages/compass-e2e-tests/tests/*.test.ts` (43 files) — updated alongside their page objects in the same PR.

## Verification

Per PR:

1. `npm run typecheck` (workspace `compass-e2e-tests`) — proves the type augmentation and page-tree types compose.
2. `npm run lint` — proves the cutover guard rule isn't violated and no new entries were added to migrated sections.
3. `npm run test-noserver -- --mocha-grep '<affected suite>'` locally, both Electron and `--web`, to confirm migrated tests still pass.
4. Full CI run on the PR — catches anything missed.
5. For Step 7 revalidation PRs only: compare CI test-retry counts vs. the prior 2-3 runs on `main` to make sure simplifications didn't reintroduce flakiness.

Done state:

- `helpers/selectors.ts` deleted.
- `helpers/commands/` contains only true browser-scoped commands.
- `helpers/element-commands/` exists and is registered.
- Every test imports from `pages/`, never from `helpers/selectors.ts`.
- Every workaround in Step 7 either has a written justification in its source comment or has been deleted.

## Risks

- **Oversized PRs for heaviest test files.** `collection-documents-tab.test.ts` and `collection-aggregations-tab.test.ts` are each ~750-1000 LoC of test code and will need at least one preparatory page-object PR before the test-file rewrite PR. The migration order above flags these as multi-PR steps.
- **Element-command TypeScript augmentation in WDIO v9.** The conditional-mapped-type trick in `compass-browser.ts` doesn't compose straightforwardly with `WebdriverIO.Element`. PR 0.2 should land standalone so any type kinks surface before page objects depend on it.
- **Compass-web divergence.** Atlas-cloud / sandbox web mode has different DOM in some areas (sidebar, connection list). Each page object must account for both modes inline; consider a `mode === 'web'` branch on `BasePage` (exposing it as `this.mode`) or a sibling `*.web.page.ts` subclass for pages where divergence is large enough that branching in every getter becomes noisy.
- **Hard cutover ↔ ≤800 LoC tension.** Some features (Documents, Aggregations) cannot cutover in one PR under 800 LoC. The migration order pre-splits these by sub-page; if a PR still exceeds the budget, prefer splitting the test-file migration from the page-object introduction rather than splitting the page object itself.
- **Cutover guard skipped.** Without an automated guard, the long migration window relies on PR review to catch reintroductions of moved selectors/commands. Revisit (built-in `no-restricted-exports` + `no-restricted-syntax`, scoped via overrides) if any reintroductions actually slip through.
