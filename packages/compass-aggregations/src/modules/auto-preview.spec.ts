import { expect } from 'chai';
import { toggleAutoPreview } from './auto-preview';
import configureStore from '../stores/store';

describe('auto preview module', function () {
  let store: ReturnType<typeof configureStore>;
  beforeEach(function () {
    store = configureStore();
  });

  it('returns the default state', function () {
    expect(store.getState().autoPreview).to.equal(true);
  });

  it('returns the new state', function () {
    store.dispatch(toggleAutoPreview(false));
    expect(store.getState().autoPreview).to.equal(false);
  });
});
