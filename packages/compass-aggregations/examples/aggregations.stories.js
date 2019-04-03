import React from 'react';
import { storiesOf } from '@storybook/react';
import { ComponentPreview } from 'storybook/decorators';

import { Provider } from 'react-redux';
import { INITIAL_STATE } from 'modules';
import Aggregations from 'components/aggregations';
import { configureStore } from 'utils/configureStore';

import BASIC_EXAMPLE from './example-basic.js';
import SCHEMA_CHECKER_EXAMPLE from './example-schema-checker.js';
import ARRAY_STATS_EXAMPLE from './example-array-stats.js';
import GROUPED_STATS_EXAMPLE from './example-grouped-stats.js';

import DataService from './data-service-provider';

import { runStage } from 'modules/pipeline';
import { refreshInputDocuments } from 'modules/input-documents';

const BASE_STATE = {
  ...INITIAL_STATE
};

BASE_STATE.dataService.dataService = new DataService();

function loadAggregation(state = {}) {
  const initialState = {
    ...BASE_STATE,
    ...state
  };

  const store = configureStore(initialState);
  /**
   * TOOD (lucas) Dispatch for populating fields.
   */
  store.dispatch(refreshInputDocuments());
  store.dispatch(runStage(0));
  return (
    <Provider store={store}>
      <Aggregations />
    </Provider>
  );
}

storiesOf('Examples', module)
  .addDecorator((story) => <ComponentPreview>{story()}</ComponentPreview>)
  .add('Basic', () => loadAggregation(BASIC_EXAMPLE))
  .add('Grouped Stats', () => loadAggregation(GROUPED_STATS_EXAMPLE))
  .add('Array Stats', () => loadAggregation(ARRAY_STATS_EXAMPLE))
  .add('Schema Checker', () => loadAggregation(SCHEMA_CHECKER_EXAMPLE))
  .add('Default', () => {
    const initialState = {
      ...BASE_STATE
    };
    const store = configureStore(initialState);
    return (
      <Provider store={store}>
        <Aggregations />
      </Provider>
    );
  })
  .add('Static', () => {
    const initialState = {
      ...BASE_STATE,
      ...BASIC_EXAMPLE
    };
    const store = configureStore(initialState);
    return (
      <Provider store={store}>
        <Aggregations />
      </Provider>
    );
  });
