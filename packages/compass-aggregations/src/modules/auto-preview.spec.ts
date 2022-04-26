import { expect } from 'chai';
import type { Store } from 'redux';

import { toggleAutoPreview } from './auto-preview';
import type { RootState } from '.';
import configureStore from '../stores/store';
import { DATA_SERVICE_CONNECTED } from './data-service';
import { spy } from 'sinon';
import { stageOperatorSelected, stageChanged, stageAddedAfter } from './pipeline';

const initialToolbarValue = process.env.COMPASS_SHOW_NEW_AGGREGATION_TOOLBAR;

describe('auto preview module', function () {
  let store: Store<RootState>;
  beforeEach(function () {
    store = configureStore({});
    process.env.COMPASS_SHOW_NEW_AGGREGATION_TOOLBAR = 'true';
  });

  afterEach(function() {
    process.env.COMPASS_SHOW_NEW_AGGREGATION_TOOLBAR = initialToolbarValue;
  });

  it('returns the default state', function () {
    expect(store.getState().autoPreview).to.equal(true);
  });

  it('returns the new state', function () {
    store.dispatch(toggleAutoPreview() as any);
    expect(store.getState().autoPreview).to.equal(false);
  });

  it('runs stages when user enables auto-preview', function () {
    const cursorMock = {
      toArray: spy(),
      close: spy(),
    };
    const dataServiceMock = new class {
      aggregate(...args) {
        const callback = args[args.length - 1];
        callback(null, cursorMock);
      }
    };
    const aggregateSpy = spy(dataServiceMock, 'aggregate');

    store.dispatch({
      type: DATA_SERVICE_CONNECTED,
      dataService: dataServiceMock
    });

    store.dispatch(stageOperatorSelected(0, '$match', false, 'on-prem') as any);
    store.dispatch(stageChanged(`{name: /berlin/i}`, 0) as any);

    store.dispatch(stageAddedAfter(0) as any);
    store.dispatch(stageOperatorSelected(1, '$out', false, 'on-prem') as any);
    store.dispatch(stageChanged(`'coll'`, 1) as any);


    // by default autoPreview is true
    store.dispatch(toggleAutoPreview() as any); // sets to false
    store.dispatch(toggleAutoPreview() as any); // sets to true


    expect(aggregateSpy.calledOnce, 'aggregates only once').to.be.true;
  });
});
