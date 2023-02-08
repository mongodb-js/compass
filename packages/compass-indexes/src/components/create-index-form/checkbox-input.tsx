import React from 'react';
import {
  Checkbox,
  Label,
  FormFieldContainer,
} from '@mongodb-js/compass-components';
import { connect } from 'react-redux';
import type { RootState } from '../../modules/create-index';
import type { CheckboxOptions } from '../../modules/create-index/options';
import { changeOption } from '../../modules/create-index/options';
import { OPTIONS } from '../../modules/create-index/options';

type CheckboxInputProps = {
  name: CheckboxOptions;
  label: string;
  description: string;
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
  const labelId = `create-index-modal-${name}-checkbox`;
  return (
    <FormFieldContainer>
      <Checkbox
        id={labelId}
        data-testid={labelId}
        checked={checked}
        onChange={(event) => {
          onChange(name, event.target.checked);
        }}
        label={<Label htmlFor={labelId}>{label}</Label>}
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
      checked: state.options[name].value,
    };
  },
  { onChange: changeOption }
)(CheckboxInput);
