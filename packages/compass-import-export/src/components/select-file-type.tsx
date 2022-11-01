import React, { useCallback } from 'react';
import type { ChangeEvent } from 'react';
import {
  FormFieldContainer,
  Label,
  RadioBox,
  RadioBoxGroup,
} from '@mongodb-js/compass-components';

const selectFileTypeLabelId = 'select-file-type-label';
const radioBoxGroupId = 'radio-box-group-id';

function SelectFileType({
  fileType,
  onSelected,
  label,
}: {
  fileType: 'json' | 'csv';
  onSelected: (fileType: 'json' | 'csv') => void;
  label: string;
}) {
  const onFileTypeChanged = useCallback(
    ({ target: { value } }: ChangeEvent<HTMLInputElement>) => {
      onSelected(value as 'json' | 'csv');
    },
    [onSelected]
  );

  return (
    <FormFieldContainer>
      <Label htmlFor={radioBoxGroupId} id={selectFileTypeLabelId}>
        {label}
      </Label>
      <RadioBoxGroup
        aria-labelledby={selectFileTypeLabelId}
        id={radioBoxGroupId}
        onChange={onFileTypeChanged}
      >
        <RadioBox
          data-testid="select-file-type-json"
          value="json"
          checked={fileType === 'json'}
        >
          JSON
        </RadioBox>
        <RadioBox
          data-testid="select-file-type-csv"
          value="csv"
          checked={fileType === 'csv'}
        >
          CSV
        </RadioBox>
      </RadioBoxGroup>
    </FormFieldContainer>
  );
}

export { SelectFileType };
