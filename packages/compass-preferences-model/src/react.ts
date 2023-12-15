import type { FunctionComponent } from 'react';
import { useState, useEffect, createElement } from 'react';
import type { AllPreferences } from './';
import { preferencesLocator } from './provider';

/** Use as: const enableMaps = usePreference('enableMaps', React); */
export function usePreference<K extends keyof AllPreferences>(
  key: K
): AllPreferences[K] {
  const preferences = preferencesLocator();
  const [value, setValue] = useState(preferences.getPreferences()[key]);
  useEffect(() => {
    return preferences.onPreferenceValueChanged(key, (value) => {
      setValue(value);
    });
  }, [key, preferences]);
  return value;
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
