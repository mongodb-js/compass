import React from 'react';
import {
  Select,
  Option,
  css,
  spacing,
  Tooltip,
} from '@mongodb-js/compass-components';

import { CSVFieldTypeLabels } from '../utils/csv';
import type { CSVParsableFieldType } from '../utils/csv';

const selectStyles = css({
  minWidth: spacing[3] * 9,
});

function SelectFieldType({
  fieldPath,
  selectedType,
  summary,
  onChange,
}: {
  fieldPath: string;
  selectedType: CSVParsableFieldType;
  summary?: string;
  onChange: (type: string) => void;
}) {
  return (
    <Tooltip
      enabled={!!summary}
      align="top"
      justify="middle"
      trigger={({ children, ...props }) => (
        <div {...props}>
          <Select
            // NOTE: Leafygreen gives an error with only aria-label for select.
            aria-labelledby={`toggle-import-field-label-${fieldPath}`}
            // leafygreen bases ids inside Select off this id which is why we have it in addition to data-testid
            id={`import-preview-field-type-select-menu-${fieldPath}`}
            data-testid={`import-preview-field-type-select-menu-${fieldPath}`}
            className={selectStyles}
            aria-label="Field type"
            value={selectedType}
            onChange={onChange}
            allowDeselect={false}
            size="xsmall"
          >
            {Object.entries(CSVFieldTypeLabels).map(([value, display]) => (
              <Option key={value} value={value}>
                {display}
              </Option>
            ))}
          </Select>
          {children}
        </div>
      )}
    >
      {summary}
    </Tooltip>
  );
}
export { SelectFieldType };
