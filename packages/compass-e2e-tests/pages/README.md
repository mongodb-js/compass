# pages/

End-to-end test page objects.

Tests reach page objects through `compass.pages`:

```ts
const { browser, pages } = compass;
await pages.connectionForm.connectWithString(uri);
await pages.collection.documents.insert({ a: 1 });
```

`Compass.prepare()` (`helpers/compass.ts`) builds the tree via `buildPages()` from `pages/index.ts`. Each page object is a class extending `BasePage` and is registered as a slot on the `Pages` interface.

## Conventions

### `$`-prefix marks element accessors

Anything returning a `ChainablePromiseElement` is prefixed with `$`. This is the only way callers can tell, at a glance, "this returns an element" vs. "this performs an action."

Parameterless locators are getters; parameterized ones are methods.

```ts
class DocumentsPage extends BasePage {
  get $insertButton() {
    return this.browser.$('[data-testid="insert-document-button"]');
  }
  $documentRow(i: number) {
    return this.browser.$(`[data-testid="document-row-${i}"]`);
  }
}
```

### Selectors are folded into the page object

Raw selector strings live as **private static class members** at the top of the page object file. They are not exported and not shared across page objects. If two pages legitimately need the same selector, refactor so one owns it and exposes a method that returns its element.

```ts
class DocumentsPage extends BasePage {
  static readonly #InsertButton = '[data-testid="insert-document-button"]';
  static readonly #documentRow = (i: number) =>
    `[data-testid="document-row-${i}"]`;
  // …
}
```

### Action methods are camelCase verbs

`insertDocument`, `runFind`, `openTab` — methods that perform an action and return `Promise<T>`. No `$` prefix.

### Generic UI primitives are element commands, not page methods

`clickWhenVisible`, `setValueSafe`, `hover`, etc. chain on elements:

```ts
await this.$insertButton.clickWhenVisible();
await this.$nameInput.setValueSafe('foo');
```

They live in `helpers/element-commands/` and are registered in `Compass.prepare()` via `browser.addCommand(name, fn, /* attachToElement */ true)`. Don't add new entries to `helpers/commands/` — that path is being retired.

### Compass-web vs Electron

`BasePage.mode` is `'electron' | 'web'`. Branch inside a page object when the DOM diverges:

```ts
get $sidebarHeader() {
  return this.browser.$(this.mode === 'web' ? S.WebHeader : S.ElectronHeader);
}
```

If divergence becomes large, split into a sibling `*.web.page.ts` that extends the electron one and overrides the divergent members.

## Adding a new page object (the cutover rule)

This refactor uses **hard cutover per page**. A single PR introduces a page object, folds the migrated selectors out of `helpers/selectors.ts`, removes the migrated commands from `helpers/commands/`, and updates every consuming test in the same change. No long-running coexistence.

Steps when migrating a feature:

1. Create `pages/<area>/<name>.page.ts` with a class extending `BasePage`.
2. Fold the relevant selectors from `helpers/selectors.ts` into private static members on the class.
3. Convert the relevant `helpers/commands/*.ts` functions into action methods on the class — or, if they are generic UI primitives, into element commands in `helpers/element-commands/`.
4. Add the page object as a slot on the `Pages` interface and instantiate it in `buildPages()` (both in `pages/index.ts`).
5. Update every test that referenced the old selectors/commands to use the page object.
6. Delete the now-unused entries from `helpers/selectors.ts` and `helpers/commands/`. Their absence — combined with TypeScript errors at every former call site — is the cutover guard.

PRs target ≤800 LoC. If a feature can't fit, split by sub-page (e.g., `DocumentsPage` and `QueryBarPage`) rather than by file type.
