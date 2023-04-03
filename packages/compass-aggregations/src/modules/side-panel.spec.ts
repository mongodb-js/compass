import type { Store } from 'redux';
import type { RootState } from '.';
import { expect } from 'chai';
import { toggleSidePanel } from './side-panel';
import configureStore from '../../test/configure-store';

describe('side-panel module', function () {
  describe('#actions', function () {
    let store: Store<RootState>;
    beforeEach(function () {
      store = configureStore();
    });

    it('toggles the side panel', function () {
      store.dispatch(toggleSidePanel());
      expect(store.getState().sidePanel.isPanelOpen).to.equal(true);
      store.dispatch(toggleSidePanel());
      expect(store.getState().sidePanel.isPanelOpen).to.equal(false);
    });
  });
});
