import React, { createContext, useContext, useMemo } from 'react';
import { useCurrentValueRef } from '../../hooks/use-current-value-ref';

export type LegacyUUIDDisplay =
  | ''
  | 'LegacyJavaUUID'
  | 'LegacyCSharpUUID'
  | 'LegacyPythonUUID';

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

export function useBSONDisplayOptions<K extends keyof BSONDisplayOptions>(
  keys: readonly K[]
): Pick<BSONDisplayOptions, K> {
  const initialKeys = useCurrentValueRef(keys);
  const keysSignature = keys.join('|');
  const options = useContext(BSONDisplayOptionsContext);
  return useMemo(() => {
    return Object.fromEntries(
      initialKeys.current.map((key) => [key, options[key]])
    ) as Pick<BSONDisplayOptions, K>;
  }, [keysSignature, options]);
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
