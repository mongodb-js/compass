import type { CompassBrowser } from '../compass-browser';
import type {
  AllPreferences,
  UserPreferences,
} from 'compass-preferences-model';
import { isTestingWeb } from '../test-runner-context';
import { inspect } from 'util';

function _waitUntilPreferencesAccessAvailable(
  browser: CompassBrowser
): Promise<void> {
  if (!isTestingWeb()) {
    return browser.waitUntil(() => {
      return browser.execute(() => {
        try {
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          require('electron').ipcRenderer.invoke(
            'compass:save-preferences', // this will throw if handler is not registered yet
            {}
          );
          return true;
        } catch {
          return false;
        }
      });
    });
  }
  return browser.waitUntil(
    () => {
      return browser.execute(() => {
        const kSandboxPreferencesAccess = Symbol.for(
          '@compass-web-sandbox-preferences-access'
        );
        return kSandboxPreferencesAccess in globalThis;
      });
    },
    { timeoutMsg: 'Preferences are not available' }
  );
}

function _setFeatureWeb<K extends keyof UserPreferences>(
  browser: CompassBrowser,
  name: K,
  value: UserPreferences[K]
): Promise<AllPreferences> {
  return browser.execute(
    (_name, _value) => {
      const kSandboxPreferencesAccess = Symbol.for(
        '@compass-web-sandbox-preferences-access'
      );
      return (globalThis as any)[kSandboxPreferencesAccess].savePreferences({
        [_name]: _value === null ? undefined : _value,
      });
    },
    name,
    value
  );
}

function _setFeatureDesktop<K extends keyof UserPreferences>(
  browser: CompassBrowser,
  name: K,
  value: UserPreferences[K]
): Promise<AllPreferences> {
  return browser.execute(
    (_name, _value) => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      return require('electron').ipcRenderer.invoke(
        'compass:save-preferences',
        { [_name]: _value === null ? undefined : _value }
      );
    },
    name,
    value
  );
}

export async function setFeature<K extends keyof UserPreferences>(
  browser: CompassBrowser,
  name: K,
  value: UserPreferences[K],
  isEqual: (a: UserPreferences[K], b: UserPreferences[K]) => boolean = (
    a,
    b
  ) => {
    // `null` and `undefined` should be treated the same way to account
    // for JSON transformation when passing values through
    // `browser.execute`, we don't really care in e2e if those are coming
    // back different
    // eslint-disable-next-line eqeqeq
    return a == b;
  }
): Promise<void> {
  let latestValue: UserPreferences[K];
  try {
    await _waitUntilPreferencesAccessAvailable(browser);
    await browser.waitUntil(
      async () => {
        const newPreferences = await (isTestingWeb()
          ? _setFeatureWeb
          : _setFeatureDesktop)(browser, name, value);
        latestValue = newPreferences[name];
        return isEqual(latestValue, value);
      },
      { interval: 500 }
    );
  } catch (err) {
    const expected = inspect(value);
    const got = inspect(latestValue);
    throw new Error(
      `Failed to set preference "${name}": expected new value to be ${expected}, got ${got}. Original error:\n\n${
        (err as Error).message
      }`
    );
  }
}

function _getFeaturesWeb(browser: CompassBrowser): Promise<AllPreferences> {
  return browser.execute(() => {
    const kSandboxPreferencesAccess = Symbol.for(
      '@compass-web-sandbox-preferences-access'
    );
    return (globalThis as any)[kSandboxPreferencesAccess].getPreferences();
  });
}

function _getFeaturesDesktop(browser: CompassBrowser): Promise<AllPreferences> {
  return browser.execute(() => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('electron').ipcRenderer.invoke('compass:get-preferences');
  });
}

export async function getFeature<K extends keyof AllPreferences>(
  browser: CompassBrowser,
  name: K
): Promise<AllPreferences[K]> {
  await _waitUntilPreferencesAccessAvailable(browser);
  const allPreferences = await (isTestingWeb()
    ? _getFeaturesWeb
    : _getFeaturesDesktop)(browser);
  return allPreferences[name];
}
