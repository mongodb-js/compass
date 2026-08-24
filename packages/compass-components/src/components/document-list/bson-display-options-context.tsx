import React, { createContext, useContext, useMemo } from 'react';

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

export function useBSONDisplayOptions(): BSONDisplayOptions {
  return useContext(BSONDisplayOptionsContext);
}

export const BSONDisplayOptionsProvider: React.FunctionComponent<
  Partial<BSONDisplayOptions> & { children?: React.ReactNode }
> = ({
  legacyUUIDDisplayEncoding = DEFAULT_BSON_DISPLAY_OPTIONS.legacyUUIDDisplayEncoding,
  timezone = DEFAULT_BSON_DISPLAY_OPTIONS.timezone,
  children,
}) => {
  const value = useMemo(() => {
    return {
      legacyUUIDDisplayEncoding,
      timezone,
    };
  }, [legacyUUIDDisplayEncoding, timezone]);

  return (
    <BSONDisplayOptionsContext.Provider value={value}>
      {children}
    </BSONDisplayOptionsContext.Provider>
  );
};
