/* eslint-disable react/no-multi-comp */

import React from 'react';
import { storiesOf } from '@storybook/react';
import ComponentPreview from 'storybook/decorators/componentPreview';

import Status from 'components/status';

storiesOf('Status', module)
  .add('Hidden', () => (
    <ComponentPreview light>
      <Status />
    </ComponentPreview>
  ))
  .add('Progress Bar (50%)', () => (
    <ComponentPreview light>
      <Status visible progressbar progress={50} />
    </ComponentPreview>
  ))
  .add('Animation', () => (
    <ComponentPreview light>
      <Status visible animation />
    </ComponentPreview>
  ))
  .add('Animation w/ Message', () => (
    <ComponentPreview light>
      <Status visible animation message="Loading" />
    </ComponentPreview>
  ))
  .add('Animation w/ Sidebar & Message', () => (
    <ComponentPreview light>
      <Status visible animation sidebar message="Loading" />
    </ComponentPreview>
  ));

/* eslint-enable react/no-multi-comp */
