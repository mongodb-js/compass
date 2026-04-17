import {
  getMultiplexTransport,
  setWebSocketUrlOverride,
} from '../src/multiplex-ws-transport';

const kSandboxMultiplexTransport = Symbol.for(
  '@compass-web-sandbox-multiplex-transport'
);

// eslint-disable-next-line no-console
console.info(
  `[compass-web sandbox] call window[Symbol.for('@compass-web-sandbox-multiplex-transport')]() to get the active MultiplexWebSocketTransport`
);

Object.defineProperty(globalThis, kSandboxMultiplexTransport, {
  get() {
    return getMultiplexTransport;
  },
});

if (Object.hasOwn(globalThis, '__compassWebEnableSandboxMultiplexWsOverride')) {
  setWebSocketUrlOverride('ws://localhost:1337');
}
