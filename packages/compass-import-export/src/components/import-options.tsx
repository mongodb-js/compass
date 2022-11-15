import React, { useCallback } from 'react';

import {
  Checkbox,
  FileInput,
  Select,
  Option,
  css,
  spacing,
} from '@mongodb-js/compass-components';

import type { AcceptedFileType } from '../constants/file-types';
import { SelectFileType } from './select-file-type';
import type { CSVDelimiter } from '../modules/import';

const formStyles = css({
  paddingTop: spacing[3],
});

const delimiterSelectStyles = css({
  margin: `${spacing[3]}px 0`,
});

const checkboxStyles = css({
  margin: `${spacing[2]}px 0`,
});

const delimeters: {
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
  setDelimiter: (delimeter: CSVDelimiter) => void;
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
  /**
   * Handle choosing a file from the file dialog.
   */
  const handleChooseFile = useCallback(
    (files: string[]) => {
      if (files.length > 0) {
        selectImportFileName(files[0]);
      }
    },
    [selectImportFileName]
  );

  const handleOnSubmit = useCallback((evt) => {
    evt.preventDefault();
    evt.stopPropagation();
  }, []);

  const isCSV = fileType === 'csv';

  const values = fileName ? [fileName] : undefined;

  return (
    <form onSubmit={handleOnSubmit} className={formStyles}>
      <FileInput
        label="Select File"
        id="import-file"
        onChange={handleChooseFile}
        values={values}
        variant="VERTICAL"
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
            label="Delimeter"
            id="import-delimiter-select"
            onChange={(delimiter: string) =>
              setDelimiter(delimiter as CSVDelimiter)
            }
            value={delimiter}
            allowDeselect={false}
            size="small"
          >
            {delimeters.map(({ value, label }) => (
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
