import React from 'react';
import { Select, Option, css, spacing } from '@mongodb-js/compass-components';

import bsonCSV from '../utils/bson-csv';

function getBSONTypeCastings() {
  return Object.keys(bsonCSV);
}

const selectStyles = css({
  minWidth: spacing[5] * 5,
});

function SelectFieldType({
  fieldPath,
  selectedType,
  onChange,
}: {
  fieldPath: string;
  selectedType: string;
  onChange: (type: string) => void;
}) {
  return (
    <Select
      // NOTE: Leafygreen gives an error with only aria-label for select.
      aria-labelledby=""
      id={`import-preview-field-type-select-menu-${fieldPath}`}
      className={selectStyles}
      aria-label="Field type"
      value={selectedType}
      onChange={onChange}
      allowDeselect={false}
      size="xsmall"
    >
      {getBSONTypeCastings().map((name) => (
        <Option key={name} value={name}>
          {name}
        </Option>
      ))}
    </Select>
  );
}
export { SelectFieldType };
