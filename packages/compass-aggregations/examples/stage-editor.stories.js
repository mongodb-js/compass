import React from 'react';
import { storiesOf } from '@storybook/react';
import { ComponentPreview } from 'storybook/decorators';

import { Provider } from 'react-redux';
import { INITIAL_STATE } from 'modules';
import { configureStore } from 'utils/configureStore';

import { STAGE_DEFAULTS } from './example-constants.js';
import { ObjectId } from 'bson';
import ACTION_PROPS from './action-creators';

import BASIC_EXAMPLE from './example-basic.js';
import COMPLEX_EXAMPLE from './example-complex.js';
import ARRAY_STATS_EXAMPLE from './example-array-stats.js';
import GROUPED_STATS_EXAMPLE from './example-grouped-stats.js';

const PROPS = {
  ...STAGE_DEFAULTS,
  ...ACTION_PROPS,
  fromStageOperators: true,
  isAutoPreviewing: true,
  index: 0,
  serverVersion: '4.0.0',
  fields: [],
  id: new ObjectId().toHexString(),
  stageOperator: '',
  stage: '{}'
};

import StageEditor from 'components/stage-editor';

storiesOf('Components/StageEditor', module)
  .addDecorator(story => <ComponentPreview>{story()}</ComponentPreview>)
  .add('Example > $lookup', () => {
    const store = configureStore(INITIAL_STATE);
    const stage = COMPLEX_EXAMPLE.pipeline[0];
    const props = {
      ...PROPS,
      ...stage
    };
    return (
      <Provider store={store}>
        <StageEditor {...props} />
      </Provider>
    );
  })
  .add('Example > $project', () => {
    const store = configureStore(INITIAL_STATE);
    const stage = ARRAY_STATS_EXAMPLE.pipeline[0];
    const props = {
      ...PROPS,
      ...stage
    };
    return (
      <Provider store={store}>
        <StageEditor {...props} />
      </Provider>
    );
  })
  .add('Example > $group', () => {
    const store = configureStore(INITIAL_STATE);
    const stage = GROUPED_STATS_EXAMPLE.pipeline[1];
    const props = {
      ...PROPS,
      ...stage
    };
    return (
      <Provider store={store}>
        <StageEditor {...props} />
      </Provider>
    );
  })
  .add('Example > $match', () => {
    const store = configureStore(INITIAL_STATE);
    const stage = BASIC_EXAMPLE.pipeline[0];
    const props = {
      ...PROPS,
      ...stage
    };
    return (
      <Provider store={store}>
        <StageEditor {...props} />
      </Provider>
    );
  })
  .add('Default', () => {
    const store = configureStore(INITIAL_STATE);
    return (
      <Provider store={store}>
        <StageEditor {...PROPS} />
      </Provider>
    );
  });
