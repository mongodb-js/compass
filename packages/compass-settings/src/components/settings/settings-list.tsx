import React, { useCallback } from 'react';
import type {
  PreferenceStateInformation,
  UserConfigurablePreferences,
} from 'compass-preferences-model';
import { getSettingDescription, featureFlags } from 'compass-preferences-model';
import { settingStateLabels } from './state-labels';
import {
  Checkbox,
  Label,
  Description,
  css,
  spacing,
  TextInput,
  FormFieldContainer,
  Badge,
} from '@mongodb-js/compass-components';

type KeysMatching<T, V> = keyof {
  [P in keyof T as T[P] extends V ? P : never]: P;
};
// Currently, boolean, numeric, and string options are supported in the UI.
type BooleanPreferences = KeysMatching<
  UserConfigurablePreferences,
  boolean | undefined
>;
type NumericPreferences = KeysMatching<
  UserConfigurablePreferences,
  number | undefined
>;
type StringPreferences = KeysMatching<
  UserConfigurablePreferences,
  string | undefined
>;
type SupportedPreferences =
  | BooleanPreferences
  | NumericPreferences
  | StringPreferences;

const inputStyles = css({
  marginTop: spacing[3],
  marginBottom: spacing[3],
});

const devBadgeStyles = css({
  marginLeft: spacing[2],
});

const fieldContainerStyles = css({
  margin: `${spacing[3]}px 0`,
  fieldset: {
    paddingLeft: `${spacing[4]}px`,
  },
});

type HandleChange<PreferenceName extends SupportedPreferences> = <
  N extends PreferenceName
>(
  field: N,
  value: UserConfigurablePreferences[N]
) => void;

export type SettingsListProps<PreferenceName extends SupportedPreferences> = {
  fields: readonly PreferenceName[];
  onChange: HandleChange<PreferenceName>;
  preferenceStates: PreferenceStateInformation;
  currentValues: Partial<Pick<UserConfigurablePreferences, PreferenceName>>;
};

function SettingLabel({ name }: { name: SupportedPreferences }) {
  const { short, long } = getSettingDescription(name).description;
  return (
    <>
      <Label htmlFor={name} id={`${name}-label`}>
        {short}
        {(featureFlags as any)[name]?.stage === 'development' && (
          <span>
            <Badge className={devBadgeStyles}>dev</Badge>
          </span>
        )}
      </Label>
      {long && <Description>{long}</Description>}
    </>
  );
}

function BooleanSetting<PreferenceName extends BooleanPreferences>({
  name,
  onChange,
  value,
  disabled,
}: {
  name: PreferenceName;
  onChange: HandleChange<PreferenceName>;
  value: boolean;
  disabled: boolean;
}) {
  const handleCheckboxChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onChange(name, event.target.checked);
    },
    [name, onChange]
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
  onChange,
  value,
  disabled,
  required,
}: {
  name: PreferenceName;
  onChange: HandleChange<PreferenceName>;
  value: number | undefined;
  disabled: boolean;
  required: boolean;
}) {
  const onChangeEvent = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const { value } = event.target;
      onChange(name, value === '' ? (required ? 0 : undefined) : +value);
    },
    [name, onChange, required]
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
        type="number"
        value={value === undefined ? (required ? '0' : '') : `${value}`}
        onChange={onChangeEvent}
        disabled={disabled}
        optional={!required}
      />
    </>
  );
}
function StringSetting<PreferenceName extends StringPreferences>({
  name,
  onChange,
  value,
  disabled,
  required,
}: {
  name: PreferenceName;
  onChange: HandleChange<PreferenceName>;
  value: string | undefined;
  disabled: boolean;
  required: boolean;
}) {
  const onChangeEvent = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const { value } = event.target;
      onChange(
        name,
        (value === ''
          ? required
            ? ''
            : undefined
          : value) as UserConfigurablePreferences[PreferenceName]
      );
    },
    [name, onChange, required]
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
        value={value === undefined ? '' : `${value}`}
        onChange={onChangeEvent}
        disabled={disabled}
        optional={!required}
      />
    </>
  );
}

export function SettingsList<PreferenceName extends SupportedPreferences>({
  fields,
  preferenceStates,
  onChange,
  currentValues,
}: SettingsListProps<PreferenceName>) {
  return (
    <>
      {fields.map((name) => {
        const { type } = getSettingDescription(name);
        if (type !== 'boolean' && type !== 'number' && type !== 'string') {
          throw new Error(
            `do not know how to render type ${
              type as string
            } for preference ${name}`
          );
        }
        return (
          <div data-testid={`setting-${name}`} key={`setting-${name}`}>
            <FormFieldContainer className={fieldContainerStyles}>
              {type === 'boolean' ? (
                <BooleanSetting
                  name={name as BooleanPreferences & PreferenceName}
                  onChange={onChange}
                  value={!!currentValues[name]}
                  disabled={!!preferenceStates[name]}
                />
              ) : type === 'number' ? (
                <NumericSetting
                  name={name as NumericPreferences}
                  onChange={onChange}
                  value={
                    currentValues[name as NumericPreferences & PreferenceName]
                  }
                  required={false}
                  disabled={!!preferenceStates[name]}
                />
              ) : type === 'string' ? (
                <StringSetting
                  name={name as StringPreferences}
                  onChange={onChange}
                  value={
                    currentValues[name as StringPreferences & PreferenceName]
                  }
                  required={false}
                  disabled={!!preferenceStates[name]}
                />
              ) : null}
              {settingStateLabels[preferenceStates[name] ?? '']}
            </FormFieldContainer>
          </div>
        );
      })}
    </>
  );
}
