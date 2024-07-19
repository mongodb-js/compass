import type { FunctionComponent } from 'react';
import {
  useState,
  useEffect,
  createElement,
  createContext,
  useContext,
  useRef,
  useCallback,
} from 'react';
import { type AllPreferences } from './';
import type { PreferencesAccess } from './preferences';
import { ReadOnlyPreferenceAccess } from './read-only-preferences-access';
import { createServiceLocator } from 'hadron-app-registry';
import { pick } from 'lodash';

const PreferencesContext = createContext<PreferencesAccess>(
  // Our context starts with our read-only preference access but we expect
  // different runtimes to provide their own access implementation at render.
  new ReadOnlyPreferenceAccess()
);

export const PreferencesProvider = PreferencesContext.Provider;

export function usePreferencesContext() {
  return useContext(PreferencesContext);
}

export const preferencesLocator = createServiceLocator(
  usePreferencesContext,
  'preferencesLocator'
);

export type { PreferencesAccess };

/** Use as: const enableMaps = usePreference('enableMaps', React); */
export function usePreference<K extends keyof AllPreferences>(
  key: K
): AllPreferences[K] {
  const preferences = usePreferencesContext();
  const [value, setValue] = useState(preferences.getPreferences()[key]);
  useEffect(() => {
    return preferences.onPreferenceValueChanged(key, (value) => {
      setValue(value);
    });
  }, [key, preferences]);
  return value;
}

/**
 * A version of usePreference hook that allows to get multiple preferences in a
 * single object for brevity
 *
 * @example
 * const {
 *   enableShell,
 *   readOnly,
 * } = usePreferences(['enableShell', 'readOnly']);
 *
 * @param keys list of preferences keys to return as an object
 */
export function usePreferences<K extends (keyof AllPreferences)[]>(
  keys: K
): Pick<AllPreferences, K[number]> {
  const preferences = usePreferencesContext();
  const keysRef = useRef(keys);
  keysRef.current = keys;
  const [values, setValues] = useState(() => {
    return pick(preferences.getPreferences(), keys);
  });
  const updateValue = useCallback((key: keyof AllPreferences, newValue) => {
    setValues((values) => {
      if (newValue === values[key]) {
        return values;
      }
      return {
        ...values,
        [key]: newValue,
      };
    });
  }, []);
  useEffect(() => {
    const unsubscribe = keysRef.current.map((key) => {
      return preferences.onPreferenceValueChanged(key, (newValue) => {
        updateValue(key, newValue);
      });
    });
    return () => {
      unsubscribe.forEach((fn) => {
        fn();
      });
    };
  }, [
    // An easy way to depend on actual array values instead of the array itself
    // and avoid extra effect calls if array defined inline
    keysRef.current.join(''),
    preferences,
  ]);
  return values;
}

type FirstArgument<F> = F extends (...args: [infer A, ...any]) => any
  ? A
  : F extends { new (...args: [infer A, ...any]): any }
  ? A
  : never;

type OptionalOmit<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/** Use as: const WrappedComponent = withPreferences(Component, ['enableMaps', 'trackUsageStatistics'], React); */
export function withPreferences<
  C extends ((...args: any[]) => any) | { new (...args: any[]): any },
  K extends keyof AllPreferences
>(
  component: C,
  keys: K[]
): FunctionComponent<OptionalOmit<FirstArgument<C>, K>> {
  return function (props: OptionalOmit<FirstArgument<C>, K>) {
    const prefs = Object.fromEntries(
      keys.map((key) => [key, usePreference(key)])
    );

    return createElement(component, { ...prefs, ...props });
  };
}
