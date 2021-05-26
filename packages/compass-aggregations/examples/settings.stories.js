import React from 'react';
import { storiesOf } from '@storybook/react';
import { ComponentPreview } from '../.storybook/decorators';

import { INITIAL_STATE as _BASE_STATE } from '../src/modules/settings';
import { INITIAL_STATE as INITIAL_LIMIT_STATE } from '../src/modules/limit';
import { INITIAL_STATE as INITIAL_MAX_TIME_MS_STATE } from '../src/modules/max-time-ms';
import { INITIAL_STATE as INITIAL_LARGE_LIMIT_STATE } from '../src/modules/large-limit';

import ACTION_PROPS from './action-creators';

import Settings from '../src/components/settings';

const PROPS = {
  ..._BASE_STATE,
  settings: _BASE_STATE,
  isCommenting: true,
  limit: INITIAL_LIMIT_STATE,
  largeLimit: INITIAL_LARGE_LIMIT_STATE,
  maxTimeMS: INITIAL_MAX_TIME_MS_STATE,
  ...ACTION_PROPS
};

storiesOf('Components/Settings', module)
  .addDecorator(story => <ComponentPreview>{story()}</ComponentPreview>)
  .add('isExpanded', () => {
    const props = {
      ...PROPS,
      isExpanded: true
    };
    return <Settings {...props} />;
  })
  .add('Default', () => {
    const props = {
      ...PROPS
    };
    return <Settings {...props} />;
  })
  ;
