import React, { useCallback } from 'react';
import type { ChangeEvent } from 'react';
import {
  Label,
  RadioBox,
  RadioBoxGroup,
  css,
  spacing,
} from '@mongodb-js/compass-components';

const selectFileTypeLabelId = 'select-file-type-label';
const radioBoxGroupId = 'radio-box-group-id';

const containerStyles = css({
  margin: `${spacing[3]}px 0`,
});

function SelectFileType({
  fileType,
  onSelected,
  label,
}: {
  fileType: 'json' | 'csv' | '';
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
    <div className={containerStyles}>
      <Label htmlFor={radioBoxGroupId} id={selectFileTypeLabelId}>
        {label}
      </Label>
      <RadioBoxGroup
        aria-labelledby={selectFileTypeLabelId}
        data-testid="select-file-type"
        id={radioBoxGroupId}
        onChange={onFileTypeChanged}
        value={fileType}
      >
        <RadioBox data-testid="select-file-type-json" value="json">
          JSON
        </RadioBox>
        <RadioBox data-testid="select-file-type-csv" value="csv">
          CSV
        </RadioBox>
      </RadioBoxGroup>
    </div>
  );
}

export { SelectFileType };
