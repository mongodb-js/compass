import { maxTimeMSChanged } from './max-time-ms';
import { expect } from 'chai';
import configureStore from '../../test/configure-store';

describe('max-time-ms module', function () {
  let store: ReturnType<typeof configureStore>;
  beforeEach(function () {
    store = configureStore(undefined, undefined, {
      preferences: {
        getPreferences: () => ({ maxTimeMS: 1000 }),
      },
    } as any);
  });

  it('initializes default max time to preferences value', function () {
    expect(store.getState().maxTimeMS).to.equal(1000);
  });

  it('dispatches max time changed action', function () {
    store.dispatch(maxTimeMSChanged(100));
    expect(store.getState().maxTimeMS).to.equal(100);
  });

  it('caps max time at preference limit', function () {
    store.dispatch(maxTimeMSChanged(9999));
    expect(store.getState().maxTimeMS).to.equal(1000);
  });
});
