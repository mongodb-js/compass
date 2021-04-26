/* eslint-disable no-alert */
import React from 'react';
import { storiesOf } from '@storybook/react';
import SelectFileType from 'components/select-file-type';

storiesOf('Examples/SelectFileType', module)
  .add('default', () => {
    return (
      <SelectFileType
        label="Select a File Type"
        onSelected={t => window.alert(`Selected ${t}`)}
      />
    );
  })
  .add('selected', () => {
    return (
      <SelectFileType
        label="Select a File Type"
        onSelected={t => window.alert(`Selected ${t}`)}
        fileType="json"
      />
    );
  });
