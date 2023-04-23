import {
  Body,
  spacing,
  css,
  ComboboxWithCustomOption,
} from '@mongodb-js/compass-components';
import React, { useState } from 'react';

const containerStyles = css({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[2],
});

const comboboxStyles = css({ width: '350px' });

const mapGroupFormStateToStageValue = (formState: string[]) => {
  const fields = Object.fromEntries(formState.map((x) => [x, `$${x}`]));
  return {
    _id: fields,
  };
};

export const BasicGroup = ({
  fields,
  onChange,
}: {
  fields: string[];
  onChange: (value: string, error: Error | null) => void;
}) => {
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
        options={fields}
        optionLabel="Field:"
        overflow="scroll-x"
      />
    </div>
  );
};

export default BasicGroup;
