import React, { useCallback } from 'react';

import {
  Checkbox,
  Select,
  Option,
  css,
  spacing,
} from '@mongodb-js/compass-components';

import type { AcceptedFileType } from '../constants/file-types';
import type { CSVDelimiter } from '../modules/import';
import { ImportFileInput } from './import-file-input';

const formStyles = css({
  paddingTop: spacing[3],
});

const delimiterSelectStyles = css({
  margin: `${spacing[3]}px 0`,
});

const checkboxStyles = css({
  margin: `${spacing[2]}px 0`,
});

const delimiters: {
  value: CSVDelimiter;
  label: string;
}[] = [
  {
    value: ',',
    label: 'comma',
  },
  {
    value: '\t',
    label: 'tab',
  },
  {
    value: ';',
    label: 'semicolon',
  },
  {
    value: ' ',
    label: 'space',
  },
];

type ImportOptionsProps = {
  selectImportFileName: (fileName: string) => void;
  setDelimiter: (delimiter: CSVDelimiter) => void;
  delimiter: CSVDelimiter;
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
  const handleOnSubmit = useCallback((evt) => {
    evt.preventDefault();
    evt.stopPropagation();
  }, []);

  const isCSV = fileType === 'csv';

  return (
    <form onSubmit={handleOnSubmit} className={formStyles}>
      <ImportFileInput
        fileName={fileName}
        selectImportFileName={selectImportFileName}
      />
      {isCSV && (
        <>
          <Select
            className={delimiterSelectStyles}
            label="Delimiter"
            id="import-delimiter-select"
            data-testid="import-delimiter-select"
            onChange={(delimiter: string) =>
              void setDelimiter(delimiter as CSVDelimiter)
            }
            value={delimiter}
            allowDeselect={false}
            size="small"
          >
            {delimiters.map(({ value, label }) => (
              <Option key={value} value={value}>
                {label}
              </Option>
            ))}
          </Select>
          <Checkbox
            className={checkboxStyles}
            checked={ignoreBlanks}
            onChange={() => {
              setIgnoreBlanks(!ignoreBlanks);
            }}
            label="Ignore empty strings"
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
        label="Stop on errors"
      />
    </form>
  );
}

export { ImportOptions };
