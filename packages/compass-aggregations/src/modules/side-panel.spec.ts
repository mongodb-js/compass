import type { Store } from 'redux';
import type { RootState } from '.';
import { expect } from 'chai';
import { toggleSidePanel } from './side-panel';
import configureStore from '../../test/configure-store';
import type { SinonStub } from 'sinon';
import sinon from 'sinon';

describe('side-panel module', function () {
  describe('#actions', function () {
    let store: Store<RootState>;
    let fakeLocalStorage: SinonStub;

    beforeEach(async function () {
      store = (await configureStore()).plugin.store;

      const localStorageValues: Record<string, string> = {};

      fakeLocalStorage = sinon.stub(global, 'localStorage').value({
        getItem: sinon.fake((key: string) => {
          return localStorageValues[key];
        }),
        setItem: sinon.fake((key: string, value: any) => {
          localStorageValues[key] = value.toString();
        }),
      });
    });

    afterEach(function () {
      fakeLocalStorage.restore();
    });

    it('starts with an closed state', function () {
      expect(store.getState().sidePanel.isPanelOpen).to.equal(false);
    });

    it('toggles the side panel', function () {
      store.dispatch(toggleSidePanel() as any);
      expect(store.getState().sidePanel.isPanelOpen).to.equal(true);
      store.dispatch(toggleSidePanel() as any);
      expect(store.getState().sidePanel.isPanelOpen).to.equal(false);
    });

    it('persists the last state', async function () {
      const store1 = (await configureStore()).plugin.store;
      expect(store1.getState().sidePanel.isPanelOpen).to.equal(false);

      store1.dispatch(toggleSidePanel() as any);
      expect(store1.getState().sidePanel.isPanelOpen).to.equal(true);

      const store2 = (await configureStore()).plugin.store;
      expect(store2.getState().sidePanel.isPanelOpen).to.equal(true);
    });
  });
});
