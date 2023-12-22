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
