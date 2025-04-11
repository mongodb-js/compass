import React, { useCallback } from 'react';
import type { UserConfigurablePreferences } from 'compass-preferences-model';
import {
  getSettingDescription,
  featureFlags,
} from 'compass-preferences-model/provider';
import { SORT_ORDER_VALUES } from 'compass-preferences-model/provider';
import { settingStateLabels } from './state-labels';
import {
  Checkbox,
  Label,
  Description,
  css,
  spacing,
  TextInput,
  Select,
  Option,
  FormFieldContainer,
  Badge,
  palette,
} from '@mongodb-js/compass-components';
import { changeFieldValue } from '../../stores/settings';
import type { RootState } from '../../stores';
import { connect } from 'react-redux';

const inputDescriptionStyles = css({
  display: 'block',
  color: palette.gray.dark1,
});

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
  marginTop: spacing[400],
  marginBottom: spacing[400],
});

const devBadgeStyles = css({
  marginLeft: spacing[200],
});

const fieldContainerStyles = css({
  margin: `${spacing[400]}px 0`,
  fieldset: {
    paddingLeft: `${spacing[600]}px`,
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
};

function SettingLabel({ name }: { name: SupportedPreferences }) {
  const { short, long, longReact } = getSettingDescription(name).description;
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
      {long && !longReact && <Description>{long}</Description>}
      {longReact && <div className={inputDescriptionStyles}>{longReact}</div>}
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

function DefaultSortOrderSetting<PreferenceName extends 'defaultSortOrder'>({
  name,
  onChange,
  value,
  disabled,
}: {
  name: PreferenceName;
  onChange: HandleChange<PreferenceName>;
  value: string;
  disabled: boolean;
}) {
  const optionDescriptions = getSettingDescription(name).description.options;
  const onChangeCallback = useCallback(
    (value: string) => {
      onChange(name, value as UserConfigurablePreferences[PreferenceName]);
    },
    [name, onChange]
  );

  return (
    <>
      <SettingLabel name={name} />
      <Select
        className={inputStyles}
        allowDeselect={false}
        aria-labelledby={`${name}-label`}
        id={name}
        name={name}
        data-testid={name}
        value={value}
        onChange={onChangeCallback}
        disabled={disabled}
      >
        {SORT_ORDER_VALUES.map((option) => (
          <Option
            key={option}
            value={option}
            description={
              optionDescriptions && optionDescriptions[option].description
            }
          >
            {optionDescriptions && optionDescriptions[option].label}
          </Option>
        ))}
      </Select>
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

type AnySetting = {
  name: string;
  type: unknown;
  value?: unknown;
  onChange(field: string, value: unknown): void;
};

type SettingsInputProps = AnySetting & {
  stateLabel?: React.ReactNode;
  disabled?: boolean;
  required?: boolean;
};

function isSupported(props: AnySetting): props is
  | {
      name: StringPreferences;
      type: 'string';
      value?: string;
      onChange: HandleChange<StringPreferences>;
    }
  | {
      name: NumericPreferences;
      type: 'number';
      value?: number;
      onChange: HandleChange<NumericPreferences>;
    }
  | {
      name: BooleanPreferences;
      type: 'boolean';
      value?: boolean;
      onChange: HandleChange<BooleanPreferences>;
    } {
  return ['number', 'string', 'boolean'].includes(props.type as string);
}

function SettingsInput({
  stateLabel = '',
  disabled = false,
  required = false,
  ...props
}: SettingsInputProps): React.ReactElement {
  if (!isSupported(props)) {
    throw new Error(
      `Do not know how to render type ${props.type} for preference ${props.name}`
    );
  }

  let input = null;

  const { name, type, onChange, value } = props;

  if (type === 'boolean') {
    input = (
      <BooleanSetting
        name={name}
        onChange={onChange}
        value={!!value}
        disabled={!!disabled}
      />
    );
  } else if (type === 'string' && name === 'defaultSortOrder') {
    input = (
      <DefaultSortOrderSetting
        name={name}
        onChange={onChange}
        value={value as string}
        disabled={!!disabled}
      />
    );
  } else if (type === 'number') {
    input = (
      <NumericSetting
        name={name}
        onChange={onChange}
        value={value}
        required={!!required}
        disabled={!!disabled}
      />
    );
  } else if (type === 'string') {
    input = (
      <StringSetting
        name={name}
        onChange={onChange}
        value={value}
        required={!!required}
        disabled={!!disabled}
      />
    );
  }

  return (
    <div data-testid={`setting-${name}`}>
      <FormFieldContainer className={fieldContainerStyles}>
        {input}
        {stateLabel ?? ''}
      </FormFieldContainer>
    </div>
  );
}

const ConnectedSettingsInput = connect(
  (state: RootState, ownProps: { name: SupportedPreferences }) => {
    const {
      settings: { settings, preferenceStates },
    } = state;
    const { name } = ownProps;
    const { type } = getSettingDescription(name);

    return {
      value: settings[name],
      type: type,
      disabled: !!preferenceStates[name],
      stateLabel: settingStateLabels[preferenceStates[name] ?? ''],
    };
  },
  { onChange: changeFieldValue }
)(SettingsInput);

export function SettingsList<PreferenceName extends SupportedPreferences>({
  fields,
}: SettingsListProps<PreferenceName>) {
  return (
    <>
      {fields.map((name) => {
        return (
          <ConnectedSettingsInput
            key={name}
            name={name}
          ></ConnectedSettingsInput>
        );
      })}
    </>
  );
}

export default React.memo(SettingsList);
