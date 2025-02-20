import React from 'react';
import {
  Checkbox,
  Label,
  FormFieldContainer,
} from '@mongodb-js/compass-components';
import { connect } from 'react-redux';
import type { RootState } from '../../modules';
import type { CheckboxOptions } from '../../modules/create-index';
import { OPTIONS, optionChanged } from '../../modules/create-index';

type CheckboxInputProps = {
  name: CheckboxOptions;
  label: React.ReactNode;
  description: React.ReactNode;
  disabled?: boolean;
  checked: boolean;
  onChange(name: CheckboxOptions, newVal: boolean): void;
};

export const CheckboxInput: React.FunctionComponent<CheckboxInputProps> = ({
  name,
  label,
  description,
  disabled,
  checked,
  onChange,
}) => {
  const labelId = `create-index-modal-${name}`;
  return (
    <FormFieldContainer>
      <Checkbox
        id={labelId}
        data-testid={`${labelId}-checkbox`}
        checked={checked}
        onChange={(event) => {
          onChange(name, event.target.checked);
        }}
        label={
          <Label htmlFor={labelId} data-testid={`${labelId}-label`}>
            {label}
          </Label>
        }
        // @ts-expect-error leafygreen types only allow strings here, but can
        // render a ReactNode too (and we use that to render links inside
        // descriptions)
        description={description}
        disabled={disabled}
      />
    </FormFieldContainer>
  );
};

export default connect(
  (state: RootState, { name }: Pick<CheckboxInputProps, 'name'>) => {
    return {
      label: OPTIONS[name].label,
      description: OPTIONS[name].description,
      checked: state.createIndex.options[name].value,
    };
  },
  { onChange: optionChanged }
)(CheckboxInput);
