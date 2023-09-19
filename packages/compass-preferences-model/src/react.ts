import preferencesAccess from './';
import type { AllPreferences } from './';

export interface ReactHooks {
  useState: <T>(initialValue: T) => [T, (newValue: T) => void];
  useEffect: (
    effectFn: () => () => void,
    dependencies: readonly unknown[]
  ) => void;
}

/** Use as: const enableMaps = usePreference('enableMaps', React); */
export function usePreference<K extends keyof AllPreferences>(
  key: K,
  { useState, useEffect }: ReactHooks
): AllPreferences[K] {
  const [value, setValue] = useState(preferencesAccess.getPreferences()[key]);
  useEffect(() => {
    return preferencesAccess.onPreferenceValueChanged(key, (value) => {
      setValue(value);
    });
  }, [key]);
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
  K extends keyof AllPreferences,
  R
>(
  component: C,
  keys: K[],
  React: ReactHooks & { createElement: <C>(component: C, props: unknown) => R }
): (props: OptionalOmit<FirstArgument<C>, K>) => R {
  return function (props: OptionalOmit<FirstArgument<C>, K>): R {
    const prefs = Object.fromEntries(
      keys.map((key) => [key, usePreference(key, React)])
    );

    return React.createElement(component, { ...prefs, ...props });
  };
}
