/* eslint-disable react/no-multi-comp */

import React from 'react';
import { storiesOf } from '@storybook/react';
import ComponentPreview from '../../../.storybook/decorators/componentPreview';

import Database from '../database';

storiesOf('Database', module)
  .add('Status Enabled', () => (
    <ComponentPreview dark>
      <Database status="enabled" />
    </ComponentPreview>
  ))
  .add('Status Disabled', () => (
    <ComponentPreview dark>
      <Database status="disabled" />
    </ComponentPreview>
  ));

/* eslint-enable react/no-multi-comp */
