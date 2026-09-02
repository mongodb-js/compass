// Custom element-attached commands. Each module here exports a function with
// signature `(element: WebdriverIO.Element, ...args) => Promise<T>`. They are
// registered onto WebdriverIO.Element via
// `browser.addCommand(name, fn, /* attachToElement */ true)` in
// Compass.prepare(), and surfaced on the Element / ChainablePromiseElement
// types through the mapped-type augmentation in compass-browser.ts.
//
// Migration PRs add entries here as generic UI primitives move out of
// helpers/commands/ (browser-attached) onto elements where they chain
// naturally. See pages/README.md.
export {};
