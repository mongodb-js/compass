import React, { useCallback } from 'react';

import {
  Body,
  Checkbox,
  Select,
  Label,
  Option,
  css,
  spacing,
  useTranslation,
} from '@mongodb-js/compass-components';

import type { AcceptedFileType } from '../constants/file-types';
import type { Delimiter } from '../csv/csv-types';
import { ImportFileInput } from './import-file-input';

const formStyles = css({
  paddingTop: spacing[400],
});

const optionsHeadingStyles = css({
  fontWeight: 'bold',
  marginTop: spacing[400],
});

const inlineFieldStyles = css({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  gap: spacing[200],
});

const inlineLabelStyles = css({
  fontWeight: 'normal',
});

const delimiterSelectStyles = css({
  minWidth: '120px', // fit all options without wrapping
});

const checkboxStyles = css({
  margin: `${spacing[200]}px 0`,
});

const delimiters: {
  value: Delimiter;
  key: string;
  label: string;
}[] = [
  {
    value: ',',
    key: 'importExport.options.comma',
    label: 'Comma',
  },
  {
    value: '\t',
    key: 'importExport.options.tab',
    label: 'Tab',
  },
  {
    value: ';',
    key: 'importExport.options.semicolon',
    label: 'Semicolon',
  },
  {
    value: ' ',
    key: 'importExport.options.space',
    label: 'Space',
  },
];

type ImportOptionsProps = {
  selectImportFileName: (fileName: string) => void;
  setDelimiter: (delimiter: Delimiter) => void;
  delimiter: Delimiter;
  fileType: AcceptedFileType | '';
  fileName: string;
  stopOnErrors: boolean;
  setStopOnErrors: (stopOnErrors: boolean) => void;
  ignoreBlanks: boolean;
  setIgnoreBlanks: (ignoreBlanks: boolean) => void;
};

function ImportOptions({
  selectImportFileName,
  setDelimiter,
  delimiter,
  fileType,
  fileName,
  stopOnErrors,
  setStopOnErrors,
  ignoreBlanks,
  setIgnoreBlanks,
}: ImportOptionsProps) {
  const t = useTranslation();
  const handleOnSubmit = useCallback(
    (evt: React.FormEvent<HTMLFormElement>) => {
      evt.preventDefault();
      evt.stopPropagation();
    },
    []
  );

  const isCSV = fileType === 'csv';

  return (
    <form onSubmit={handleOnSubmit} className={formStyles}>
      <ImportFileInput
        fileName={fileName}
        selectImportFileName={selectImportFileName}
      />
      <Body as="h3" className={optionsHeadingStyles}>
        {t('importExport.options.heading', 'Options')}
      </Body>
      {isCSV && (
        <>
          <div className={inlineFieldStyles}>
            <Label
              id="import-delimiter-label"
              htmlFor="import-delimiter-select"
              className={inlineLabelStyles}
            >
              {t('importExport.options.selectDelimiter', 'Select delimiter')}
            </Label>
            <Select
              className={delimiterSelectStyles}
              id="import-delimiter-select"
              aria-labelledby="import-delimiter-label"
              aria-label={t('importExport.options.delimiter', 'Delimiter')}
              data-testid="import-delimiter-select"
              onChange={(delimiter: string) =>
                void setDelimiter(delimiter as Delimiter)
              }
              value={delimiter}
              allowDeselect={false}
              size="small"
            >
              {delimiters.map(({ value, key, label }) => (
                <Option key={value} value={value}>
                  {t(key, label)}
                </Option>
              ))}
            </Select>
          </div>
          <Checkbox
            className={checkboxStyles}
            checked={ignoreBlanks}
            onChange={() => {
              setIgnoreBlanks(!ignoreBlanks);
            }}
            label={t(
              'importExport.options.ignoreEmptyStrings',
              'Ignore empty strings'
            )}
          />
        </>
      )}
      <Checkbox
        data-testid="import-stop-on-errors"
        className={checkboxStyles}
        checked={stopOnErrors}
        onChange={() => {
          setStopOnErrors(!stopOnErrors);
        }}
        label={t('importExport.options.stopOnErrors', 'Stop on errors')}
      />
    </form>
  );
}

export { ImportOptions };
