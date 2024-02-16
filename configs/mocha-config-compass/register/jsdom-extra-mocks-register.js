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

// Hack: `EventTarget` in jsdom checks for the `Event` symbol,
// which new `CustomEvent` does not provide (outside of the dom).
// We override the global CustomEvent with a modified event so that
// the check succeeds. This might go away with newer "jsdom" versions.
(function () {
  function CustomEvent(eventName, params) {
    const evt = document.createEvent('HTMLEvents');
    evt.detail = params.detail;
    evt.initEvent(eventName);
    return evt;
  }

  global.CustomEvent = CustomEvent;
})();
