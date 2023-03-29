import { CollapsibleFieldSet, TextInput } from '@mongodb-js/compass-components';
import { CodemirrorMultilineEditor } from '@mongodb-js/compass-editor';
import React from 'react';
import { connect } from 'react-redux';
import type { RootState } from '../../modules/create-index';
import type { InputOptions } from '../../modules/create-index/options';
import {
  changeOption,
  changeOptionEnabled,
  OPTIONS,
} from '../../modules/create-index/options';

type CollapsibleInputProps = {
  name: InputOptions;
  type: 'text' | 'code' | 'number';
  label: React.ReactElement | string;
  description: React.ReactElement | string;
  disabled?: boolean;
  optional?: boolean;
  units?: string;
  value: string;
  onChange(name: string, newVal: string): void;
  enabled: boolean;
  onEnabled(name: string, newVal: boolean): void;
};

export const CollapsibleInput: React.FunctionComponent<
  CollapsibleInputProps
> = ({
  name,
  type,
  label,
  description,
  disabled,
  optional,
  units,
  value,
  onChange,
  enabled,
  onEnabled,
}) => {
  const id = `create-index-modal-${name}`;
  const inputId = `${id}-${type}`;
  return (
    <CollapsibleFieldSet
      id={id}
      toggled={!disabled && enabled}
      onToggle={(enabled) => {
        onEnabled(name, enabled);
      }}
      label={label}
      data-testid={id}
      description={description}
      disabled={disabled}
    >
      {type === 'code' ? (
        <CodemirrorMultilineEditor
          data-testid={inputId}
          text={value}
          onChangeText={(newVal) => {
            onChange(name, newVal);
          }}
          id={inputId}
          aria-labelledby={id}
          readOnly={disabled}
        />
      ) : (
        // @ts-expect-error leafygreen confused with labels
        <TextInput
          id={inputId}
          value={value}
          data-testid={inputId}
          type={type}
          onChange={(e) => {
            onChange(name, e.target.value);
          }}
          spellCheck={false}
          disabled={disabled}
          optional={optional}
          label={units}
          aria-labelledby={!units ? id : undefined}
        />
      )}
    </CollapsibleFieldSet>
  );
};

export default connect(
  (state: RootState, { name }: Pick<CollapsibleInputProps, 'name'>) => {
    return {
      type: OPTIONS[name].type,
      label: OPTIONS[name].label,
      description: OPTIONS[name].description,
      optional: OPTIONS[name].optional,
      units: OPTIONS[name].units,
      value: state.options[name].value,
      enabled: state.options[name].enabled,
    };
  },
  {
    onChange: changeOption,
    onEnabled: changeOptionEnabled,
  }
)(CollapsibleInput);
