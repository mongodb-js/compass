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
import PEARSONS_RHO_EXAMPLE from './example-pearsons-rho.js';

import DataService from './data-service-provider';

import { DEFAULT_STITCH_APP_ID } from './example-constants';

import { runStage } from 'modules/pipeline';
import { refreshInputDocuments } from 'modules/input-documents';

const BASE_STATE = {
  ...INITIAL_STATE,
  stitchAppId: DEFAULT_STITCH_APP_ID
};

function loadAggregation(state = {}) {
  const initialState = {
    ...BASE_STATE,
    ...state
  };

  initialState.dataService.dataService = new DataService(
    initialState.stitchAppId
  );

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
  .add('Pearsons Rho', () => loadAggregation(PEARSONS_RHO_EXAMPLE))
  .add('Default', () => {
    const initialState = {
      ...BASE_STATE
    };
    initialState.dataService.dataService = new DataService(
      DEFAULT_STITCH_APP_ID
    );

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
