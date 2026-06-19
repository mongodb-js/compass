import { createContext, useContext } from 'react';

/**
 * Controls whether long BSON values shown in the document List view are
 * truncated with an ellipsis (the historical behaviour) or displayed in full,
 * wrapping to the available row width.
 *
 * Default `false` preserves the original truncating behaviour, so any value
 * renderer used outside of a provider is unchanged. The provider is set by
 * `@mongodb-js/compass-crud` from the `longValuesInDataDisplay` preference.
 *
 * This mirrors `LegacyUUIDDisplayContext` so that the preference-agnostic
 * `compass-components` package never has to depend on `compass-preferences-model`
 * (which would be a circular dependency).
 */
export const ExpandedValueDisplayContext = createContext<boolean>(false);

export function useExpandedValueDisplay(): boolean {
  return useContext(ExpandedValueDisplayContext);
}
