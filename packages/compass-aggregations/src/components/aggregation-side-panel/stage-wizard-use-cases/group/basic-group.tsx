import {
  Body,
  spacing,
  css,
  ComboboxWithCustomOption,
} from '@mongodb-js/compass-components';
import React, { useState, useMemo } from 'react';
import { mapFieldsToAccumulatorValue } from '../utils';
import type { WizardComponentProps } from '..';

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
  const fieldNames = useMemo(() => fields.map(({ name }) => name), [fields]);
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
      <ComboboxWithCustomOption<true>
        placeholder={'Select field names'}
        className={comboboxStyles}
        aria-label={'Select field names'}
        size="default"
        clearable={true}
        multiselect={true}
        value={groupFields}
        onChange={onChangeFields}
        options={fieldNames}
        optionLabel="Field:"
        overflow="scroll-x"
      />
    </div>
  );
};

export default BasicGroup;
