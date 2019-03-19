import React from 'react';
import { storiesOf } from '@storybook/react';
import { ComponentPreview } from 'storybook/decorators';

import { Provider } from 'react-redux';
import { INITIAL_STATE } from 'modules';
import Aggregations from 'components/aggregations';
import { configureStore } from 'utils/configureStore';

import BASIC_EXAMPLE from './example-basic.js';
import COMPLEX_EXAMPLE from './example-complex.js';
import ARRAY_STATS_EXAMPLE from './example-array-stats.js';
import GROUPED_STATS_EXAMPLE from './example-grouped-stats.js';

import DataService from './data-service-provider';

const BASE_STATE = {
  ...INITIAL_STATE
};

BASE_STATE.dataService.dataService = new DataService();

storiesOf('Examples', module)
  .addDecorator(story => <ComponentPreview>{story()}</ComponentPreview>)
  .add('Basic', () => {
    const store = configureStore({
      ...BASE_STATE,
      ...BASIC_EXAMPLE
    });
    return (
      <Provider store={store}>
        <Aggregations />
      </Provider>
    );
  })
  .add('Very Complex', () => {
    const store = configureStore({
      ...BASE_STATE,
      ...COMPLEX_EXAMPLE
    });
    return (
      <Provider store={store}>
        <Aggregations />
      </Provider>
    );
  })
  .add('Array Stats', () => {
    const store = configureStore({
      ...BASE_STATE,
      ...ARRAY_STATS_EXAMPLE
    });
    return (
      <Provider store={store}>
        <Aggregations />
      </Provider>
    );
  })
  .add('Grouped Stats', () => {
    const store = configureStore({
      ...BASE_STATE,
      ...GROUPED_STATS_EXAMPLE
    });
    return (
      <Provider store={store}>
        <Aggregations />
      </Provider>
    );
  })
  .add('Default', () => {
    const store = configureStore(BASE_STATE);
    return (
      <Provider store={store}>
        <Aggregations />
      </Provider>
    );
  })
  .add('isFullscreenOn', () => {
    const store = configureStore({
      ...BASE_STATE,
      isFullscreenOn: true
    });
    return (
      <Provider store={store}>
        <Aggregations />
      </Provider>
    );
  })
  .add('settings.isExpanded', () => {
    const state = {
      ...BASE_STATE
    };

    state.settings.isExpanded = true;

    const store = configureStore(state);
    return (
      <Provider store={store}>
        <Aggregations />
      </Provider>
    );
  });
