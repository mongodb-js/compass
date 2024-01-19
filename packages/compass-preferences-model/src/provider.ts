import type { z } from 'zod';
import { createContext, useContext } from 'react';
import type {
  AllPreferences,
  PreferencesAccess,
  UserConfigurablePreferences,
} from './';
import {
  allPreferencesProps,
  makeComputePreferencesValuesAndStates,
} from './preferences-schema';
export { usePreference, withPreferences } from './react';
export { capMaxTimeMSAtPreferenceLimit } from './maxtimems';

export class ReadOnlyPreferenceService implements PreferencesAccess {
  private allPreferences: AllPreferences;

  constructor(preferencesOverrides?: Partial<AllPreferences>) {
    this.allPreferences = {
      ...this.initialPreferenceValuesAndStates.values,
      ...preferencesOverrides,
    };
  }

  private get initialPreferenceValuesAndStates() {
    const preferencesDefaults = Object.fromEntries(
      Object.entries(allPreferencesProps).map(
        ([preferenceName, { validator }]) => {
          return [preferenceName, validator.parse(undefined)];
        }
      )
    ) as {
      [K in keyof Required<typeof allPreferencesProps>]: z.output<
        Required<typeof allPreferencesProps>[K]['validator']
      >;
    };

    const computeValuesAndStates =
      makeComputePreferencesValuesAndStates(preferencesDefaults);

    return computeValuesAndStates();
  }

  savePreferences() {
    return Promise.resolve(this.allPreferences);
  }

  refreshPreferences() {
    return Promise.resolve(this.allPreferences);
  }

  getPreferences() {
    return {
      ...this.allPreferences,
    };
  }

  ensureDefaultConfigurableUserPreferences() {
    return Promise.resolve();
  }

  getConfigurableUserPreferences() {
    const preferences = this.getPreferences();
    return Promise.resolve(
      Object.fromEntries(
        Object.entries(preferences).filter(
          ([key]) =>
            allPreferencesProps[key as keyof AllPreferences].ui === true
        )
      ) as UserConfigurablePreferences
    );
  }

  getPreferenceStates() {
    return Promise.resolve(this.initialPreferenceValuesAndStates.states);
  }

  onPreferenceValueChanged() {
    return () => {
      // noop
    };
  }

  createSandbox() {
    return Promise.reject('Method not supported');
  }
}

const PreferencesContext = createContext<PreferencesAccess>(
  // Our context starts with our simple preference service but we expect
  // different runtimes to provide their own service implementation at some
  // point.
  new ReadOnlyPreferenceService()
);

export const PreferencesProvider = PreferencesContext.Provider;

export function preferencesLocator(): PreferencesAccess {
  return useContext(PreferencesContext);
}
export type { PreferencesAccess };
