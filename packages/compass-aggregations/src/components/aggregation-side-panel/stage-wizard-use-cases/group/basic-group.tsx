import { Body, spacing, css } from '@mongodb-js/compass-components';
import React, { useState } from 'react';
import { mapFieldsToAccumulatorValue } from '../utils';
import type { WizardComponentProps } from '..';
import { FieldCombobox } from '../field-combobox';

const containerStyles = css({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[2],
});

const comboboxStyles = css({ width: '350px' });

const mapGroupFormStateToStageValue = (formState: string[]) => {
  return {
    _id: mapFieldsToAccumulatorValue(formState),
  };
};

export const BasicGroup = ({ fields, onChange }: WizardComponentProps) => {
  const [groupFields, setGroupFields] = useState<string[]>([]);

  const onChangeFields = (data: string[]) => {
    setGroupFields(data);

    onChange(
      JSON.stringify(mapGroupFormStateToStageValue(data)),
      data.length === 0 ? new Error('Group fields cannot be empty') : null
    );
  };

  return (
    <div className={containerStyles}>
      <Body>Group documents based on</Body>
      <FieldCombobox
        className={comboboxStyles}
        multiselect={true}
        value={groupFields}
        onChange={onChangeFields}
        fields={fields}
      />
    </div>
  );
};

export default BasicGroup;
