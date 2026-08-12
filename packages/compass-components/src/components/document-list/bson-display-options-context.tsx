import React, { createContext, useContext, useMemo } from 'react';

export type LegacyUUIDDisplay =
  | ''
  | 'LegacyJavaUUID'
  | 'LegacyCSharpUUID'
  | 'LegacyPythonUUID';

/**
 * User preferences that affect how BSON values are displayed. These are read
 * from the preferences model at the application boundary and passed down from
 * there so that compass-components stays independent of the preferences
 * package.
 */
export type BSONDisplayOptions = {
  legacyUUIDDisplayEncoding: LegacyUUIDDisplay;
  timezone: string;
};

export const DEFAULT_BSON_DISPLAY_OPTIONS: BSONDisplayOptions = {
  legacyUUIDDisplayEncoding: '',
  timezone: 'UTC',
};

export const BSONDisplayOptionsContext = createContext<BSONDisplayOptions>(
  DEFAULT_BSON_DISPLAY_OPTIONS
);

/**
 * Returns the requested subset of the BSON display options, mirroring the
 * `usePreferences` API so that call sites read the same way:
 *
 *   const { timezone } = useBSONDisplayOptions(['timezone']);
 */
export function useBSONDisplayOptions<K extends keyof BSONDisplayOptions>(
  keys: K[]
): Pick<BSONDisplayOptions, K> {
  const options = useContext(BSONDisplayOptionsContext);
  return useMemo(() => {
    return Object.fromEntries(keys.map((key) => [key, options[key]])) as Pick<
      BSONDisplayOptions,
      K
    >;
    // `keys` is expected to be a constant list of option names, so we only
    // depend on the options object itself to avoid recomputing on every render
    // when the list is passed as an inline array literal.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options]);
}

export const BSONDisplayOptionsProvider: React.FunctionComponent<
  Partial<BSONDisplayOptions> & { children?: React.ReactNode }
> = ({ legacyUUIDDisplayEncoding, timezone, children }) => {
  const value = useMemo(() => {
    return {
      legacyUUIDDisplayEncoding:
        legacyUUIDDisplayEncoding ??
        DEFAULT_BSON_DISPLAY_OPTIONS.legacyUUIDDisplayEncoding,
      timezone: timezone ?? DEFAULT_BSON_DISPLAY_OPTIONS.timezone,
    };
  }, [legacyUUIDDisplayEncoding, timezone]);

  return (
    <BSONDisplayOptionsContext.Provider value={value}>
      {children}
    </BSONDisplayOptionsContext.Provider>
  );
};
