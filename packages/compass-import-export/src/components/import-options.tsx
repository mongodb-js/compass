import React, { useCallback } from 'react';

import {
  Checkbox,
  Select,
  Option,
  css,
  spacing,
} from '@mongodb-js/compass-components';

import type { AcceptedFileType } from '../constants/file-types';
import { SelectFileType } from './select-file-type';
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
  selectImportFileType: (fileType: AcceptedFileType) => void;
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
  selectImportFileType,
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
      <SelectFileType
        fileType={fileType}
        onSelected={selectImportFileType}
        label="Input File Type"
      />
      {isCSV && (
        <>
          <Select
            className={delimiterSelectStyles}
            label="Delimiter"
            id="import-delimiter-select"
            data-testid="import-delimiter-select"
            onChange={(delimiter: string) =>
              setDelimiter(delimiter as CSVDelimiter)
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
