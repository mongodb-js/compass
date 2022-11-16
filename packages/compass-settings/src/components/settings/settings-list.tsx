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
  TextInput,
} from '@mongodb-js/compass-components';

type KeysMatching<T, V> = keyof {
  [P in keyof T as T[P] extends V ? P : never]: P;
};
// Currently, only boolean and numeric options are supported in the UI.
type BooleanPreferences = KeysMatching<
  UserConfigurablePreferences,
  boolean | undefined
>;
type NumericPreferences = KeysMatching<
  UserConfigurablePreferences,
  number | undefined
>;
type SupportedPreferences = BooleanPreferences | NumericPreferences;

const inputStyles = css({
  marginTop: spacing[3],
  marginBottom: spacing[3],
});

type HandleChange<PreferenceName extends SupportedPreferences> = <
  N extends PreferenceName
>(
  field: N,
  value: UserConfigurablePreferences[N]
) => void;

export type SettingsListProps<PreferenceName extends SupportedPreferences> = {
  fields: readonly PreferenceName[];
  handleChange: HandleChange<PreferenceName>;
  preferenceStates: PreferenceStateInformation;
  currentValues: Partial<Pick<UserConfigurablePreferences, PreferenceName>>;
};

function SettingLabel({ name }: { name: SupportedPreferences }) {
  const { short, long } = getSettingDescription(name).description;
  return (
    <>
      <Label htmlFor={name} id={`${name}-label`}>
        {short}
      </Label>
      {long && <Description>{long}</Description>}
    </>
  );
}

function BooleanSetting<PreferenceName extends BooleanPreferences>({
  name,
  handleChange,
  value,
  disabled,
}: {
  name: PreferenceName;
  handleChange: HandleChange<PreferenceName>;
  value: boolean;
  disabled: boolean;
}) {
  const handleCheckboxChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      handleChange(name, event.target.checked);
    },
    [name, handleChange]
  );

  return (
    <Checkbox
      key={name}
      className={inputStyles}
      name={name}
      id={name}
      data-testid={name}
      onChange={handleCheckboxChange}
      label={<SettingLabel name={name} />}
      checked={value}
      disabled={disabled}
    />
  );
}
function NumericSetting<PreferenceName extends NumericPreferences>({
  name,
  handleChange,
  value,
  disabled,
  required,
}: {
  name: PreferenceName;
  handleChange: HandleChange<PreferenceName>;
  value: number | undefined;
  disabled: boolean;
  required: boolean;
}) {
  const handleChangeEvent = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const { value } = event.target;
      // @ts-expect-error this fails unless there are actual numeric settings defined
      handleChange(name, value === '' ? (required ? 0 : undefined) : +value);
    },
    [name, handleChange, required]
  );

  return (
    <>
      <SettingLabel name={name} />
      <TextInput
        className={inputStyles}
        aria-labelledby={`${name}-label`}
        id={name}
        name={name}
        data-testid={name}
        type="text"
        inputMode="numeric"
        pattern={required ? '[0-9]+' : '[0-9]*'}
        value={value === undefined ? (required ? '0' : '') : `${value}`}
        onChange={handleChangeEvent}
        disabled={disabled}
        optional={!required}
      />
    </>
  );
}

export function SettingsList<PreferenceName extends SupportedPreferences>({
  fields,
  preferenceStates,
  handleChange,
  currentValues,
}: SettingsListProps<PreferenceName>) {
  return (
    <div>
      {fields.map((name) => {
        const { type, required } = getSettingDescription(name);
        if (type !== 'boolean' && type !== 'number') {
          throw new Error(
            `do not know how to render type ${
              type as string
            } for preference ${name}`
          );
        }
        return (
          <div data-testid={`setting-${name}`} key={`setting-${name}`}>
            {type === 'boolean' ? (
              <BooleanSetting
                name={name as BooleanPreferences & PreferenceName}
                handleChange={handleChange}
                value={!!currentValues[name]}
                disabled={!!preferenceStates[name]}
              />
            ) : type === 'number' ? (
              <NumericSetting
                name={name as NumericPreferences}
                handleChange={handleChange}
                value={
                  currentValues[name as NumericPreferences & PreferenceName]
                }
                required={required}
                disabled={!!preferenceStates[name]}
              />
            ) : null}
            {settingStateLabels[preferenceStates[name] ?? '']}
          </div>
        );
      })}
    </div>
  );
}
