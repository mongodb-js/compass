import {
  getMultiplexLink,
  setWebSocketUrlOverride,
} from '../src/multiplex-link';

const kSandboxMultiplexLink = Symbol.for('@compass-web-sandbox-multiplex-link');

// eslint-disable-next-line no-console
console.info(
  `[compass-web sandbox] call window[Symbol.for('@compass-web-sandbox-multiplex-link')]() to get the active Link`
);

Object.defineProperty(globalThis, kSandboxMultiplexLink, {
  get() {
    return getMultiplexLink;
  },
});

if (Object.hasOwn(globalThis, '__compassWebEnableSandboxMultiplexWsOverride')) {
  setWebSocketUrlOverride('ws://localhost:1337');
}
