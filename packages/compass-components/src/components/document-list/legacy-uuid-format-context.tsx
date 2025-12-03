import { createContext, useContext } from 'react';

export type LegacyUUIDDisplay =
  | ''
  | 'LegacyJavaUUID'
  | 'LegacyCSharpUUID'
  | 'LegacyPythonUUID';

export const LegacyUUIDDisplayContext = createContext<LegacyUUIDDisplay>('');

export function useLegacyUUIDDisplayContext(): LegacyUUIDDisplay {
  return useContext(LegacyUUIDDisplayContext);
}
