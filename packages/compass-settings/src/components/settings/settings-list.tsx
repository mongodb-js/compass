import React, { useCallback } from 'react';
import type {
  PreferenceStateInformation,
  UserConfigurablePreferences,
} from 'compass-preferences-model';
import { getSettingDescription } from 'compass-preferences-model';
import { settingStateLabels } from './state-labels';
import {
  Checkbox,
  Label,
  Description,
  css,
  spacing,
} from '@mongodb-js/compass-components';

type KeysMatching<T, V> = keyof {
  [P in keyof T as T[P] extends V ? P : never]: P;
};
// Currently, only boolean options are supported in the UI.
type BooleanPreferences = KeysMatching<
  UserConfigurablePreferences,
  boolean | undefined
>;
type SupportedPreferences = BooleanPreferences;

const checkboxStyles = css({
  marginTop: spacing[3],
  marginBottom: spacing[3],
});

export type SettingsListProps<PreferenceName extends SupportedPreferences> = {
  fields: readonly PreferenceName[];
  handleChange: <N extends PreferenceName>(
    field: N,
    value: UserConfigurablePreferences[N]
  ) => void;
  preferenceStates: PreferenceStateInformation;
  currentValues: Partial<Pick<UserConfigurablePreferences, PreferenceName>>;
};

function SettingLabel({ name }: { name: SupportedPreferences }) {
  const { short, long } = getSettingDescription(name);
  return (
    <>
      <Label htmlFor={name}>{short}</Label>
      {long && <Description>{long}</Description>}
    </>
  );
}

export function SettingsList<PreferenceName extends SupportedPreferences>({
  fields,
  preferenceStates,
  handleChange,
  currentValues,
}: SettingsListProps<PreferenceName>) {
  const handleCheckboxChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      handleChange(event.target.name as PreferenceName, event.target.checked);
    },
    [handleChange]
  );

  return (
    <div>
      {fields.map((name) => (
        <div data-testid={`setting-${name}`} key={`setting-${name}`}>
          <Checkbox
            key={name}
            className={checkboxStyles}
            name={name}
            id={name}
            data-testid={name}
            onChange={handleCheckboxChange}
            label={<SettingLabel name={name} />}
            checked={!!currentValues[name]}
            disabled={!!preferenceStates[name]}
          />
          {settingStateLabels[preferenceStates[name] ?? '']}
        </div>
      ))}
    </div>
  );
}
