const DEFAULT_PROPS = {
  delimiter: ',',
  setDelimiter: () => console.log('setDelimiter:'),
  fileType: '',
  selectImportFileType: () => console.log('selectImportFileType:'),
  fileName: '',
  selectImportFileName: () => console.log('selectImportFileName:'),
  stopOnErrors: false,
  setStopOnErrors: () => console.log('setStopOnErrors:'),
  ignoreBlanks: true,
  setIgnoreBlanks: () => console.log('setIgnoreBlanks:'),
  fileOpenDialog: () => console.log('fileOpenDialog:')
};

/* eslint-disable no-alert */
import React from 'react';
import { storiesOf } from '@storybook/react';
import ImportOptions from 'components/import-options';

storiesOf('Examples/ImportOptions', module)
  .add('csv', () => {
    const props = {
      ...DEFAULT_PROPS,
      fileType: 'csv',
      fileName: '~/my-csv-data.csv'
    };
    return <ImportOptions {...props} />;
  })
  .add('tsv', () => {
    const props = {
      ...DEFAULT_PROPS,
      fileType: 'csv',
      fileName: '~/my-tsv-data.tsv',
      delimiter: '\\t'
    };
    return <ImportOptions {...props} />;
  })
  .add('json', () => {
    const props = {
      ...DEFAULT_PROPS,
      fileType: 'json',
      fileName: '~/compass-github-api-releases.json'
    };

    return <ImportOptions {...props} />;
  })
  .add('default', () => {
    return <ImportOptions {...DEFAULT_PROPS} />;
  });
