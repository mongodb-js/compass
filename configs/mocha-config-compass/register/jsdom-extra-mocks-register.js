'use strict';
// Not implemented in jsdom
if (!window.matchMedia) {
  window.matchMedia = globalThis.matchMedia = (media) => {
    return {
      media,
      matches: false,
      addListener() {},
      removeListener() {},
      addEventListener() {},
      removeEventListener() {},
      dispatchEvent() {},
    };
  };
}

/**
 * NB: tabbable requires special overrides to work in jsdom environments as per
 * documentation
 *
 * @see {@link https://github.com/focus-trap/tabbable?tab=readme-ov-file#testing-in-jsdom}
 */
const tabbable = require('tabbable');

const origTabbable = { ...tabbable };

Object.assign(tabbable, {
  tabbable: (node, options) =>
    origTabbable.tabbable(node, { ...options, displayCheck: 'none' }),
  focusable: (node, options) =>
    origTabbable.focusable(node, { ...options, displayCheck: 'none' }),
  isFocusable: (node, options) =>
    origTabbable.isFocusable(node, { ...options, displayCheck: 'none' }),
  isTabbable: (node, options) =>
    origTabbable.isTabbable(node, { ...options, displayCheck: 'none' }),
});

// leafygreen (through `clipboard` library) uses deprecated API check that is
// not working in jsdom if copy / paste APIs are supported
if (!window.document.queryCommandSupported) {
  window.document.queryCommandSupported =
    globalThis.document.queryCommandSupported = function (command) {
      return ['copy', 'cut'].includes(command);
    };
}

// COMPASS-7357: jsdom `EventTarget` doesn't play nicely with Node.js `CustomEvent` yet,
// so always pick the `window`/jsdom-based variant
globalThis.EventTarget = window.EventTarget;
globalThis.CustomEvent = window.CustomEvent;
globalThis.Event = window.Event;
globalThis.Blob = window.Blob;
globalThis.File = window.File;
