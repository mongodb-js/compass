import { expect } from 'chai';
import configureStore from '../../test/configure-store';
import type { AggregationsStore } from '../stores/store';
import { toggleAutoPreview } from './auto-preview';

describe('auto preview module', function () {
  let store: AggregationsStore;
  beforeEach(async function () {
    store = (await configureStore()).plugin.store;
  });

  it('returns the default state', function () {
    expect(store.getState().autoPreview).to.equal(true);
  });

  it('returns the new state', function () {
    store.dispatch(toggleAutoPreview(false));
    expect(store.getState().autoPreview).to.equal(false);
  });
});
