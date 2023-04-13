import React, { useState } from 'react';
import {
  Banner,
  Label,
  RadioBox,
  RadioBoxGroup,
  css,
  spacing,
} from '@mongodb-js/compass-components';

import type { FieldsToExportOption } from '../modules/export';

const selectFieldsRadioBoxStyles = css({
  // Keep the label from going to two lines.
  whiteSpace: 'nowrap',
});

const messageBannerStyles = css({
  marginTop: spacing[3],
});

const selectFieldsToExportId = 'select-fields-to-export';
const selectFieldsToExportLabelId = 'select-fields-to-export-label';

function FieldsToExportOptions({
  fieldsToExportOption,
  setFieldsToExportOption,
}: {
  fieldsToExportOption: FieldsToExportOption;
  setFieldsToExportOption: (fieldsToExportOption: FieldsToExportOption) => void;
}) {
  const [showProjectInfoMessage, setShowProjectInfoMessage] =
    useState<boolean>(true);

  return (
    <>
      <Label htmlFor={selectFieldsToExportId} id={selectFieldsToExportLabelId}>
        Fields to export
      </Label>
      <RadioBoxGroup
        aria-labelledby={selectFieldsToExportLabelId}
        data-testid="select-file-type"
        id={selectFieldsToExportId}
        onChange={({
          target: { value },
        }: React.ChangeEvent<HTMLInputElement>) =>
          setFieldsToExportOption(value as FieldsToExportOption)
        }
      >
        <RadioBox
          data-testid="select-file-type-json"
          value="all-fields"
          checked={fieldsToExportOption === 'all-fields'}
        >
          All fields
        </RadioBox>
        <RadioBox
          className={selectFieldsRadioBoxStyles}
          data-testid="select-file-type-csv"
          value="select-fields"
          checked={fieldsToExportOption === 'select-fields'}
        >
          Select fields in table
        </RadioBox>
      </RadioBoxGroup>
      {showProjectInfoMessage && (
        <Banner
          className={messageBannerStyles}
          dismissible
          onClose={() => setShowProjectInfoMessage(false)}
        >
          You can also use the <strong>Project</strong> field in the query bar
          to specify which fields to return or export.
        </Banner>
      )}
    </>
  );
}

export { FieldsToExportOptions };
