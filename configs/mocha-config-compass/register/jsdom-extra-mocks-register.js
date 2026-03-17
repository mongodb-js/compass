'use strict';
// Polyfill Intl.DurationFormat for Node.js versions that don't support it (used in tests)
// Our target browsers/Node versions support it, but the test runner may not
require('@formatjs/intl-durationformat/polyfill-force.js');

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

// Workaround for missing HTMLDialogElement in jsdom
// See https://github.com/jsdom/jsdom/issues/3294

Object.assign(HTMLDialogElement.prototype, {
  show() {
    this.open = true;
    this.style.display = '';
  },
  showModal() {
    this.open = true;
    this.style.display = '';
  },
  close(returnValue) {
    this.open = false;
    this.returnValue = returnValue;
    this.style.display = 'none';
  },
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

// jsdom doesn't support scrollTo on the Element, so make it a no-op
globalThis.Element.prototype.scrollTo = () => {};

// Mock HTMLCanvasElement.getContext for lottie-web and other canvas-dependent libraries
// jsdom doesn't implement canvas, but we can provide a minimal mock to prevent errors
// We need to override the existing implementation using defineProperty
if (typeof HTMLCanvasElement !== 'undefined') {
  Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
    value: function (contextType, ...args) {
      if (contextType === '2d') {
        return {
          fillStyle: '',
          strokeStyle: '',
          lineWidth: 1,
          lineCap: 'butt',
          lineJoin: 'miter',
          miterLimit: 10,
          globalAlpha: 1,
          globalCompositeOperation: 'source-over',
          imageSmoothingEnabled: true,
          font: '10px sans-serif',
          textAlign: 'start',
          textBaseline: 'alphabetic',
          direction: 'ltr',
          fillRect: () => {},
          clearRect: () => {},
          strokeRect: () => {},
          beginPath: () => {},
          closePath: () => {},
          moveTo: () => {},
          lineTo: () => {},
          arc: () => {},
          arcTo: () => {},
          ellipse: () => {},
          bezierCurveTo: () => {},
          quadraticCurveTo: () => {},
          rect: () => {},
          fill: () => {},
          stroke: () => {},
          clip: () => {},
          isPointInPath: () => false,
          isPointInStroke: () => false,
          save: () => {},
          restore: () => {},
          scale: () => {},
          rotate: () => {},
          translate: () => {},
          transform: () => {},
          setTransform: () => {},
          resetTransform: () => {},
          drawImage: () => {},
          createImageData: () => ({
            data: new Uint8ClampedArray(),
            width: 0,
            height: 0,
          }),
          getImageData: () => ({
            data: new Uint8ClampedArray(),
            width: 0,
            height: 0,
          }),
          putImageData: () => {},
          createLinearGradient: () => ({
            addColorStop: () => {},
          }),
          createRadialGradient: () => ({
            addColorStop: () => {},
          }),
          createPattern: () => null,
          fillText: () => {},
          strokeText: () => {},
          measureText: () => ({
            width: 0,
            actualBoundingBoxLeft: 0,
            actualBoundingBoxRight: 0,
            actualBoundingBoxAscent: 0,
            actualBoundingBoxDescent: 0,
          }),
          getLineDash: () => [],
          setLineDash: () => {},
          canvas: this,
        };
      }
      return null;
    },
    writable: true,
    configurable: true,
  });
}
