import React, { useCallback } from 'react';
import type { UserConfigurablePreferences } from 'compass-preferences-model';
import {
  getSettingDescription,
  featureFlags,
} from 'compass-preferences-model/provider';
import {
  SORT_ORDER_VALUES,
  LEGACY_UUID_ENCODINGS,
  TIMEZONES,
} from 'compass-preferences-model/provider';
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
  Combobox,
  ComboboxOption,
  Icon,
} from '@mongodb-js/compass-components';
import { changeFieldValue } from '../../stores/settings';
import type { RootState } from '../../stores';
import { connect } from 'react-redux';
import type { SettingsDescriptionComponent } from '../settings-descriptions';
import { SETTINGS_DESCRIPTIONS_MAP } from '../settings-descriptions';

const ENUM_PREFERENCE_CONFIG = {
  defaultSortOrder: SORT_ORDER_VALUES,
  legacyUUIDDisplayEncoding: LEGACY_UUID_ENCODINGS,
  timezone: TIMEZONES,
} as const;

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
type StringEnumPreferences = keyof typeof ENUM_PREFERENCE_CONFIG;
export type SupportedPreferences =
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

function SettingLabel<PreferenceName extends SupportedPreferences>({
  name,
  value,
}: {
  name: PreferenceName;
  value: UserConfigurablePreferences[PreferenceName] | undefined;
}) {
  const { short, long } = getSettingDescription(name).description;
  const SettingDescription = SETTINGS_DESCRIPTIONS_MAP[name] as
    | SettingsDescriptionComponent<PreferenceName>
    | undefined;
  const featureFlagDefinition = featureFlags.find((definition) => {
    return definition.name === name;
  });
  return (
    <>
      <Label htmlFor={name} id={`${name}-label`}>
        {short}
        {featureFlagDefinition?.stage === 'development' && (
          <span>
            <Badge className={devBadgeStyles}>dev</Badge>
          </span>
        )}
      </Label>
      {(SettingDescription || long) && (
        <Description>
          {SettingDescription ? <SettingDescription value={value} /> : long}
        </Description>
      )}
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
      label={<SettingLabel name={name} value={value} />}
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
      <SettingLabel name={name} value={value} />
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

function StringEnumSetting<PreferenceName extends StringEnumPreferences>({
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
  const { short, options: optionDescriptions } =
    getSettingDescription(name).description;

  if (!optionDescriptions) {
    throw new Error(`No option descriptions found for preference ${name}`);
  }

  const onChangeCallback = useCallback(
    (value: string | null) => {
      if (value !== null) {
        onChange(name, value as UserConfigurablePreferences[PreferenceName]);
      }
    },
    [name, onChange]
  );

  const selectComponent =
    // TODO(COMPASS-10998): LG Select and Combobox do not render selected
    // option's label in a same way, if the option is an empty string.
    // Select, renders the label and Comboxbox does not. So we are showing
    // Select for such settings.
    Object.keys(optionDescriptions).some((x) => x === '') ? (
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
        {Object.entries(optionDescriptions).map(([option, details]) => (
          <Option
            key={option}
            value={option}
            glyph={details.glyph ? <Icon glyph={details.glyph} /> : undefined}
            description={details.description}
          >
            {details.label}
          </Option>
        ))}
      </Select>
    ) : (
      <Combobox
        className={inputStyles}
        aria-label={short}
        id={name}
        data-testid={name}
        value={value}
        multiselect={false}
        clearable={false}
        onChange={onChangeCallback}
        disabled={disabled}
      >
        {Object.entries(optionDescriptions).map(([option, details]) => (
          <ComboboxOption
            key={option}
            value={option}
            glyph={details.glyph ? <Icon glyph={details.glyph} /> : undefined}
            displayName={details.label}
            description={details.description}
          />
        ))}
      </Combobox>
    );
  return (
    <>
      <SettingLabel
        name={name}
        value={value as UserConfigurablePreferences[PreferenceName]}
      />
      {selectComponent}
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
      <SettingLabel
        name={name}
        value={value as UserConfigurablePreferences[PreferenceName]}
      />
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

function isStringEnumPreference(name: string): name is StringEnumPreferences {
  return name in ENUM_PREFERENCE_CONFIG;
}

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
      `Do not know how to render type ${String(props.type)} for preference ${
        props.name
      }`
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
  } else if (type === 'string' && isStringEnumPreference(name)) {
    input = (
      <StringEnumSetting
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
