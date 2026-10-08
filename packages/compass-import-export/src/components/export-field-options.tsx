import React, { useState } from 'react';
import {
  Banner,
  Label,
  RadioBox,
  RadioBoxGroup,
  css,
  spacing,
  useTranslation,
} from '@mongodb-js/compass-components';

import type { FieldsToExportOption } from '../modules/export';

const selectFieldsRadioBoxStyles = css({
  // Keep the label from going to two lines.
  whiteSpace: 'nowrap',
});

const messageBannerStyles = css({
  marginTop: spacing[400],
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
  const t = useTranslation();
  const [showProjectInfoMessage, setShowProjectInfoMessage] =
    useState<boolean>(true);

  return (
    <>
      <Label htmlFor={selectFieldsToExportId} id={selectFieldsToExportLabelId}>
        {t('importExport.fieldOptions.fieldsToExport', 'Fields to export')}
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
        value={fieldsToExportOption}
      >
        <RadioBox
          id="export-query-all-fields-option"
          value="all-fields"
          checked={fieldsToExportOption === 'all-fields'}
        >
          {t('importExport.fieldOptions.allFields', 'All fields')}
        </RadioBox>
        <RadioBox
          className={selectFieldsRadioBoxStyles}
          id="export-query-select-fields-option"
          value="select-fields"
          checked={fieldsToExportOption === 'select-fields'}
        >
          {t(
            'importExport.fieldOptions.selectFieldsInTable',
            'Select fields in table'
          )}
        </RadioBox>
      </RadioBoxGroup>
      {showProjectInfoMessage && (
        <Banner
          className={messageBannerStyles}
          dismissible
          onClose={() => setShowProjectInfoMessage(false)}
        >
          {t(
            'importExport.fieldOptions.projectHint.prefix',
            'You can also use the '
          )}
          <b>{t('importExport.fieldOptions.projectHint.project', 'Project')}</b>
          {t(
            'importExport.fieldOptions.projectHint.suffix',
            ' field in the query bar to specify which fields to return or export.'
          )}
        </Banner>
      )}
    </>
  );
}

export { FieldsToExportOptions };
