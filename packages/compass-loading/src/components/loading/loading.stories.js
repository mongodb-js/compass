/* eslint-disable react/no-multi-comp */

import React from 'react';
import { storiesOf } from '@storybook/react';
import ComponentPreview from 'storybook/decorators/componentPreview';

import Loading from 'components/loading';

storiesOf('Loading', module)
  .add('Status Enabled', () => (
    <ComponentPreview dark>
      <Loading status="enabled" />
    </ComponentPreview>
  ))
  .add('Status Disabled', () => (
    <ComponentPreview dark>
      <Loading status="disabled" />
    </ComponentPreview>
  ));

/* eslint-enable react/no-multi-comp */
