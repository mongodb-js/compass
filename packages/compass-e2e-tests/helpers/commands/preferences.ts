import type { CompassBrowser } from '../compass-browser';
import type {
  AllPreferences,
  UserPreferences,
} from 'compass-preferences-model';
import { isTestingWeb } from '../test-runner-context';
import { inspect } from 'util';

async function _waitUntilPreferencesAccessAvailable(
  browser: CompassBrowser
): Promise<void> {
  const waitUntilOptions = {
    timeoutMsg: 'Preferences are not available',
    interval: 3000,
  };

  if (!isTestingWeb()) {
    await browser.waitUntil(() => {
      return browser.execute(async () => {
        try {
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          await require('electron').ipcRenderer.invoke(
            'compass:save-preferences', // this will reject if handler is not registered yet
            {}
          );
          return true;
        } catch {
          return false;
        }
      });
    }, waitUntilOptions);
  } else {
    await browser.waitUntil(() => {
      return browser.execute(() => {
        const kSandboxPreferencesAccess = Symbol.for(
          '@compass-web-sandbox-preferences-access'
        );
        return (
          kSandboxPreferencesAccess in globalThis &&
          !!(globalThis as any)[kSandboxPreferencesAccess]
        );
      });
    }, waitUntilOptions);
  }
}

function _setFeatureWeb<K extends keyof UserPreferences>(
  browser: CompassBrowser,
  name: K,
  value: UserPreferences[K]
): Promise<AllPreferences> {
  return browser.execute(
    // @ts-expect-error generics in the browser.execute definition mess up with
    // the multiple args we're passing here, so we have to just ignore the issue
    (_name: K, _value: UserPreferences[K]): AllPreferences => {
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

async function _setFeatureDesktop<K extends keyof UserPreferences>(
  browser: CompassBrowser,
  name: K,
  value: UserPreferences[K]
): Promise<AllPreferences> {
  return await browser.execute(
    // @ts-expect-error see above
    async (_name: K, _value: UserPreferences[K]): AllPreferences => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const newPreferences = await require('electron').ipcRenderer.invoke(
        'compass:save-preferences',
        { [_name]: _value === null ? undefined : _value }
      );
      return newPreferences;
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
    const currentPreferences = await getFeatures(browser);
    // We can be running tests against compass version where the preference
    // doesn't exist yet (older compass build in smoke tests for example), in
    // that case setting preference does nothing, so we will skip the validation
    const doesPreferenceExists = name in currentPreferences;
    await browser.waitUntil(
      async () => {
        const newPreferences = await (isTestingWeb()
          ? _setFeatureWeb
          : _setFeatureDesktop)(browser, name, value);
        latestValue = newPreferences[name];
        return doesPreferenceExists ? isEqual(latestValue, value) : true;
      },
      { interval: 1000 }
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
  return (await getFeatures(browser))[name];
}

export async function getFeatures(
  browser: CompassBrowser
): Promise<AllPreferences> {
  await _waitUntilPreferencesAccessAvailable(browser);
  return await (isTestingWeb() ? _getFeaturesWeb : _getFeaturesDesktop)(
    browser
  );
}
