/* eslint-disable no-alert */
import React from 'react';
import { storiesOf } from '@storybook/react';
import SelectFieldType from 'components/select-field-type';

storiesOf('Examples/SelectFieldType', module)
  .add('default', () => {
    return (
      <SelectFieldType
        onChange={t => window.alert(`Selected type changed ${t}`)}
      />
    );
  })
  .add('number selected', () => {
    return (
      <SelectFieldType
        selectedType="number"
        onChange={t => window.alert(`Selected type changed ${t}`)}
      />
    );
  });
