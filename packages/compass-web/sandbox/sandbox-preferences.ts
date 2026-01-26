import { compassWebPreferences } from '../src/preferences';

const kSandboxPreferencesAccess = Symbol.for(
  '@compass-web-sandbox-preferences-access'
);

// eslint-disable-next-line no-console
console.info(
  `[compass-web sandbox] call window[Symbol.for('@compass-web-sandbox-preferences-access')].savePreferences({}) to dynamically update preferences`
);

Object.defineProperty(globalThis, kSandboxPreferencesAccess, {
  get() {
    return compassWebPreferences ?? null;
  },
});
